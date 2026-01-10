import json
from channels.generic.websocket import AsyncWebsocketConsumer
from .models import ChatMessage, Project, Documentation, Membership
from django.contrib.auth.models import User
from channels.db import database_sync_to_async
from collections import defaultdict
# Removed module-level Redis connection to prevent import blocking

class ProjectConsumer(AsyncWebsocketConsumer):
    # In-memory storage for presence (safe for single-instance deployment)
    # Structure: presence_data[project_id][user_id] = set(channel_names)
    presence_data = defaultdict(lambda: defaultdict(set))

    async def connect(self):
        self.project_id = self.scope['url_route']['kwargs']['projectId']
        self.room_group_name = f'project_{self.project_id}'
        self.user = self.scope["user"]

        print(f"WS-Consumer: Connect attempt for project {self.project_id} by {self.user}")

        if self.user.is_anonymous:
            print("WS-Consumer: Rejecting anonymous user")
            await self.close()
            return

        self.can_edit = await self.check_edit_permission(self.user.id, self.project_id)

        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

        # Add connection to presence tracker
        ProjectConsumer.presence_data[self.project_id][self.user.id].add(self.channel_name)
        
        # Determine if this user was already active (had other tabs)
        # If it's the first connection (len was 0 before, now 1), broadcast join
        # But here we just broadcast the full list every time to be safe and simple
        await self.broadcast_presence()

        await self.send(text_data=json.dumps({
            'type': 'permission_status',
            'can_edit': self.can_edit
        }))

    async def disconnect(self, close_code):
        if self.user.is_authenticated:
            # Remove this specific connection
            user_channels = ProjectConsumer.presence_data[self.project_id][self.user.id]
            user_channels.discard(self.channel_name)
            
            # If user has no more connections, remove them from the project list
            if not user_channels:
                del ProjectConsumer.presence_data[self.project_id][self.user.id]
                
                # Verify if project is empty to clean up memory (optional but good)
                if not ProjectConsumer.presence_data[self.project_id]:
                    del ProjectConsumer.presence_data[self.project_id]
                
                # Broadcast leaving ONLY if they are truly gone (no tabs left)
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'collaborator_update',
                        'message': f'{self.user.username} has left.',
                        'removed_user_id': self.user.id
                    }
                )

            await self.broadcast_presence()

        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)
        message_type = data.get('type')

        if message_type == 'chat_message':
            message = data.get('message')
            if message and self.user.is_authenticated:
                await self.save_chat_message(message, self.user)
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'chat_message',
                        'message': message,
                        'user_id': self.user.id,
                        'username': self.user.username,
                        'timestamp': data.get('timestamp') 
                    }
                )

        elif message_type == 'code_update':
            # Check permissions before broadcasting code updates
            if self.can_edit:
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'code_update',
                        'content': data.get('content'),
                        'sender_id': self.user.id
                    }
                )
    
    async def chat_message(self, event):
        await self.send(text_data=json.dumps({
            'type': 'chat_message',
            'message': event['message'],
            'user_id': event['user_id'],
            'username': event['username'],
            'timestamp': event.get('timestamp')
        }))

    async def code_update(self, event):
        # Don't echo back to sender (handled by frontend usually, but safe to filter if needed)
        if event['sender_id'] != self.user.id:
            await self.send(text_data=json.dumps({
                'type': 'code_update',
                'content': event['content']
            }))

    async def send_current_presence(self):
        active_ids = list(ProjectConsumer.presence_data[self.project_id].keys())
        await self.send(text_data=json.dumps({
            'type': 'presence_update',
            'active_user_ids': active_ids
        }))

    async def broadcast_presence(self):
        active_ids = list(ProjectConsumer.presence_data[self.project_id].keys())
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'presence_update',
                'active_user_ids': active_ids
            }
        )
    
    async def presence_update(self, event):
        await self.send(text_data=json.dumps({
            'type': 'presence_update',
            'active_user_ids': event['active_user_ids']
        }))

    async def doc_content_update(self, event):
        await self.send(text_data=json.dumps({
           'type': 'doc_content_update',
           'documentId': event['documentId'],
           'updater_username': event['updater_username'],
           'updated_at': event['updated_at'],
           'title': event.get('title'),
           'content': event.get('content'),
       }))

    async def collaborator_update(self, event):
        removed_user_id = event.get('removed_user_id')
        
        # If the user was removed by ID (e.g. kicked or just left), we might want to cleanup presence
        # But 'disconnect' handles the primary cleanup. This is mostly for broadcasting the message.
        if removed_user_id and removed_user_id in ProjectConsumer.presence_data[self.project_id]:
             # Force remove from presence if it was an explicit removal event
             del ProjectConsumer.presence_data[self.project_id][removed_user_id]
             await self.broadcast_presence()

        await self.send(text_data=json.dumps({
            'type': 'collaborator_update',
            'message': event['message'],
            'removed_user_id': removed_user_id
        }))

    async def doc_list_update(self, event):
       await self.send(text_data=json.dumps({
           'type': 'doc_list_update',
           'message': event.get('message', 'Document list updated')
       }))

    async def alert_update(self, event):
       await self.send(text_data=json.dumps({
           'type': 'alert_update',
           'message': event['message'],
           'unresolved_count': event['unresolved_count'] 
       }))

    @database_sync_to_async
    def save_chat_message(self, message, user):
        try:
            project = Project.objects.get(id=self.project_id)
            ChatMessage.objects.create(project=project, user=user, message=message)
            
            existing_messages = ChatMessage.objects.filter(project=project).order_by('-timestamp')
            if existing_messages.count() > 50:
                ids_to_delete = list(existing_messages[50:].values_list('id', flat=True))
                if ids_to_delete:
                    ChatMessage.objects.filter(id__in=ids_to_delete).delete()

        except Project.DoesNotExist:
            pass
        except Exception as e:
            print(f"Error saving chat: {e}")

    @database_sync_to_async
    def check_edit_permission(self, user_id, project_id):
        try:
            project = Project.objects.get(id=project_id)
            if project.owner.id == user_id:
                return True
            membership = Membership.objects.get(
                project_id=project_id, user_id=user_id, status=Membership.Status.APPROVED
            )
            return membership.role in [Membership.Role.ADMIN, Membership.Role.EDITOR]
        except:
            return False

class UserNotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope['user']
        if self.user.is_anonymous:
            await self.close()
            return
        self.room_group_name = f'user_{self.user.id}'
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        if self.user.is_authenticated:
            await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def project_approval_notification(self, event):
        await self.send(text_data=json.dumps({
            'type': 'project_approved',
            'project': event['project']
        }))