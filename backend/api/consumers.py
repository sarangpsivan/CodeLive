import json
from channels.generic.websocket import AsyncWebsocketConsumer
from .models import ChatMessage, Project, Documentation, Membership
from django.contrib.auth.models import User
from channels.db import database_sync_to_async
import redis.asyncio as redis
from django.conf import settings

# Initialize Redis client
# Use REDIS_URL from settings if available, else fallback to localhost
REDIS_URL = getattr(settings, 'REDIS_URL', 'redis://127.0.0.1:6379/1')

class ProjectConsumer(AsyncWebsocketConsumer):
    # Redis client placeholder - initialized on class level or instance?
    # Better to use a connection pool or simple client. 
    # django-channels layers use redis, so we can assume a redis server is reachable.
    
    async def connect(self):
        self.project_id = self.scope['url_route']['kwargs']['projectId']
        self.room_group_name = f'project_{self.project_id}'
        self.user = self.scope["user"]

        print(f"WS-Consumer: Connect attempt for project {self.project_id} by {self.user}")

        if self.user.is_anonymous:
            print("WS-Consumer: Rejecting anonymous user")
            await self.close()
            return
            
        self.redis = redis.from_url(REDIS_URL)

        self.can_edit = await self.check_edit_permission(self.user.id, self.project_id)

        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

        # Presence Logic with Redis
        try:
            # 1. Add this specific channel to the user's connection set
            # This is robust: duplicate adds do nothing, removes are specific to this socket
            user_channels_key = f"project:{self.project_id}:user:{self.user.id}:channels"
            await self.redis.sadd(user_channels_key, self.channel_name)
            await self.redis.expire(user_channels_key, 300) # 5 min auto-cleanup

            # 2. Add user to the set of active users for this project
            active_users_key = f"project:{self.project_id}:active_users"
            
            # Check if this is the first connection (cardinality was 0 before add? or just add to active set)
            # We just add to active set. It's a set, so duplicates are ignored.
            await self.redis.sadd(active_users_key, self.user.id)
            await self.redis.expire(active_users_key, 300)
            
            await self.broadcast_presence()
            
        except Exception as e:
            print(f"Redis Error in connect: {e}")

        await self.send(text_data=json.dumps({
            'type': 'permission_status',
            'can_edit': self.can_edit
        }))

    async def disconnect(self, close_code):
        if self.user.is_authenticated:
            try:
                # 1. Remove this channel from the user's connection set
                user_channels_key = f"project:{self.project_id}:user:{self.user.id}:channels"
                await self.redis.srem(user_channels_key, self.channel_name)
                
                # 2. Check remaining connections
                count = await self.redis.scard(user_channels_key)
                
                if count <= 0:
                    # User has no more active connections
                    await self.redis.delete(user_channels_key) # Clean up
                    
                    active_users_key = f"project:{self.project_id}:active_users"
                    await self.redis.srem(active_users_key, self.user.id)
                    
                    # Broadcast leaving
                    await self.channel_layer.group_send(
                        self.room_group_name,
                        {
                            'type': 'collaborator_update',
                            'message': f'{self.user.username} has left.',
                            'removed_user_id': self.user.id
                        }
                    )
            except Exception as e:
                print(f"Redis Error in disconnect: {e}")
            
            finally:
                # Close redis connection
                await self.redis.close()

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
                        'fileId': data.get('fileId'),
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
                'content': event['content'],
                'fileId': event.get('fileId')
            }))

    async def send_current_presence(self):
        active_ids = []
        try:
             active_users_key = f"project:{self.project_id}:active_users"
             members = await self.redis.smembers(active_users_key)
             active_ids = [int(uid) for uid in members]
        except Exception as e:
             print(f"Redis Error in send_current_presence: {e}")

        await self.send(text_data=json.dumps({
            'type': 'presence_update',
            'active_user_ids': active_ids
        }))

    async def broadcast_presence(self):
        active_ids = []
        try:
             active_users_key = f"project:{self.project_id}:active_users"
             members = await self.redis.smembers(active_users_key)
             active_ids = [int(uid) for uid in members]
        except Exception as e:
             print(f"Redis Error in broadcast_presence: {e}")
             
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
        if removed_user_id:
             # Force remove from presence if it was an explicit removal event
             try:
                 active_users_key = f"project:{self.project_id}:active_users"
                 user_channels_key = f"project:{self.project_id}:user:{removed_user_id}:channels"
                 
                 # Check if user is actually in the list
                 is_member = await self.redis.sismember(active_users_key, removed_user_id)
                 if is_member:
                     await self.redis.srem(active_users_key, removed_user_id)
                     await self.redis.delete(user_channels_key)
                     await self.broadcast_presence()
             except Exception as e:
                 print(f"Redis Error in collaborator_update: {e}")

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

    async def file_tree_update(self, event):
        await self.send(text_data=json.dumps({
            'type': 'file_tree_update',
            'message': event['message']
        }))

    async def new_join_request(self, event):
        await self.send(text_data=json.dumps({
            'type': 'new_join_request'
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