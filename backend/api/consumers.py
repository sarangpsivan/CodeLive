import json
from channels.generic.websocket import AsyncWebsocketConsumer
from .models import ChatMessage, Project, Documentation
from django.contrib.auth.models import User
from channels.db import database_sync_to_async

active_users_in_project = {}

class ProjectConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.project_id = self.scope['url_route']['kwargs']['projectId']
        self.room_group_name = f'project_{self.project_id}'
        
        self.user = self.scope["user"]
        if self.user.is_anonymous:
            await self.close()
            return

        if self.room_group_name not in active_users_in_project:
            active_users_in_project[self.room_group_name] = set()
        active_users_in_project[self.room_group_name].add(self.user.id)

        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()
        print(f"WebSocket connected to project {self.project_id}")

        await self.broadcast_presence()

    async def disconnect(self, close_code):
        if self.user.is_authenticated:
            if self.room_group_name in active_users_in_project:
                active_users_in_project[self.room_group_name].discard(self.user.id)
                if not active_users_in_project[self.room_group_name]:
                    del active_users_in_project[self.room_group_name]
            
            await self.broadcast_presence()

        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)
        print(f"WebSocket disconnected from project {self.project_id}")

    async def receive(self, text_data):
        data = json.loads(text_data)
        message_type = data.get('type')

        if message_type == 'code_update':
            await self.channel_layer.group_send(
                self.room_group_name, {'type': 'broadcast_code', 'message': data['message']}
            )
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

    # Handler for broadcasting code updates
    async def broadcast_code(self, event):
        await self.send(text_data=json.dumps({
            'type': 'code_update',
            'message': event['message']
        }))

    # Handler for broadcasting chat messages
    async def broadcast_chat_message(self, event):
        await self.send(text_data=json.dumps({
            'type': 'chat_message',
            'message': event['message'],
            'username': event['username'],
            'user_id': event.get('user_id')
        }))

    # Handler for file tree updates
    async def file_tree_update(self, event):
        await self.send(text_data=json.dumps({
            'type': 'file_tree_update',
            'message': event['message']
        }))

    # Handler for collaborator updates
    async def collaborator_update(self, event):
        removed_user_id = event.get('removed_user_id')
        
        if removed_user_id and self.room_group_name in active_users_in_project:
            active_users_in_project[self.room_group_name].discard(removed_user_id)
            await self.broadcast_presence()
        
        await self.send(text_data=json.dumps({
            'type': 'collaborator_update',
            'message': event['message']
        }))

    # Handler for the join request badge notification
    async def new_join_request(self, event):
        await self.send(text_data=json.dumps({
            'type': 'new_join_request'
        }))

    # Presence Helper Function
    async def broadcast_presence(self):
        active_ids = list(active_users_in_project.get(self.room_group_name, set()))
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'presence_update',
                'active_user_ids': active_ids
            }
        )
    
    # Handler for Presence Updates
    async def presence_update(self, event):
        await self.send(text_data=json.dumps({
            'type': 'presence_update',
            'active_user_ids': event['active_user_ids']
        }))

    # Handler for doc content updates (after save) 
    async def doc_content_update(self, event):
         print(f"CONSUMER: Received doc_content_update from channel layer for doc {event.get('documentId')}. Sending via WebSocket.")
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

    # Save chat messages to database
    @database_sync_to_async
    def save_chat_message(self, message, user):
        try:
            project = Project.objects.get(id=self.project_id)
            ChatMessage.objects.create(project=project, user=user, message=message)
        except Project.DoesNotExist:
            print(f"Project {self.project_id} not found")
        except Exception as e:
            print(f"Error saving chat message: {e}")

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