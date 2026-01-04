import json
from channels.generic.websocket import AsyncWebsocketConsumer
from .models import ChatMessage, Project, Documentation, Membership
from django.contrib.auth.models import User
from channels.db import database_sync_to_async
from collections import defaultdict

active_users_in_project = defaultdict(lambda: defaultdict(int))

class ProjectConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.project_id = self.scope['url_route']['kwargs']['projectId']
        self.room_group_name = f'project_{self.project_id}'
        self.user = self.scope["user"]

        if self.user.is_anonymous:
            await self.close()
            return

        self.can_edit = await self.check_edit_permission(self.user.id, self.project_id)

        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

        active_users_in_project[self.room_group_name][self.user.id] += 1
        
        if active_users_in_project[self.room_group_name][self.user.id] == 1:
            await self.broadcast_presence()

        await self.send(text_data=json.dumps({
            'type': 'permission_status',
            'can_edit': self.can_edit
        }))

    async def disconnect(self, close_code):
        if self.user.is_authenticated:
            if self.room_group_name in active_users_in_project:
                user_map = active_users_in_project[self.room_group_name]
                
                if self.user.id in user_map:
                    user_map[self.user.id] -= 1
                    
                    if user_map[self.user.id] <= 0:
                        del user_map[self.user.id]
                        await self.broadcast_presence() 

                if not user_map:
                    del active_users_in_project[self.room_group_name]

        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)
        message_type = data.get('type')

        if message_type == 'code_update':
            if not self.can_edit:
                return
            await self.channel_layer.group_send(
                self.room_group_name, {
                'type': 'broadcast_code', 
                'message': data['message'],
                'fileId': data.get('fileId')
            })

        elif message_type == 'chat_message':
            username = self.user.username
            await self.save_chat_message(data['message'], self.user)
            await self.channel_layer.group_send(
                self.room_group_name, {
                    'type': 'broadcast_chat_message',
                    'message': data['message'],
                    'username': username,
                    'user_id': self.user.id
                }
            )
            
        elif message_type == 'file_tree_update':
            await self.channel_layer.group_send(
                self.room_group_name, {
                    'type': 'file_tree_update',
                    'message': data['message']
                }
            )


    async def broadcast_code(self, event):
        await self.send(text_data=json.dumps({
            'type': 'code_update',
            'message': event['message'],
            'fileId': event.get('fileId')
        }))

    async def broadcast_chat_message(self, event):
        await self.send(text_data=json.dumps({
            'type': 'chat_message',
            'message': event['message'],
            'username': event['username'],
            'user_id': event.get('user_id')
        }))

    async def file_tree_update(self, event):
        await self.send(text_data=json.dumps({
            'type': 'file_tree_update',
            'message': event['message']
        }))

    async def collaborator_update(self, event):
        removed_user_id = event.get('removed_user_id')
        if removed_user_id and self.room_group_name in active_users_in_project:
            if removed_user_id in active_users_in_project[self.room_group_name]:
                del active_users_in_project[self.room_group_name][removed_user_id]
            await self.broadcast_presence()
        
        await self.send(text_data=json.dumps({
            'type': 'collaborator_update',
            'message': event['message'],
            'removed_user_id': removed_user_id
        }))

    async def new_join_request(self, event):
        await self.send(text_data=json.dumps({
            'type': 'new_join_request'
        }))

    async def broadcast_presence(self):
        if self.room_group_name in active_users_in_project:
            active_ids = list(active_users_in_project[self.room_group_name].keys())
        else:
            active_ids = []
            
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