# backend/api/consumers.py
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from .models import ChatMessage, Project
from django.contrib.auth.models import User
from channels.db import database_sync_to_async

class ProjectConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.project_id = self.scope['url_route']['kwargs']['projectId']
        self.room_group_name = f'project_{self.project_id}'

        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()
        print(f"WebSocket connected to project {self.project_id}")

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)
        print(f"WebSocket disconnected from project {self.project_id}")

    # This function receives messages from a user's WebSocket
    async def receive(self, text_data):
        data = json.loads(text_data)
        message_type = data.get('type')

        # Route the message based on its type
        if message_type == 'code_update':
            await self.channel_layer.group_send(
                self.room_group_name, {'type': 'broadcast_code', 'message': data['message']}
            )
        elif message_type == 'chat_message':
            # For chat, we need to save the message to the database
            # and include the user's name in the broadcast.
            # Note: A real app would get the user from self.scope['user']
            # but we'll use a placeholder for now.

            # We will add real user handling later. For now, let's use a placeholder.
            username = "User" # Placeholder

            # Save the chat message
            # await self.save_chat_message(data['message'], self.scope['user'])

            await self.channel_layer.group_send(
                self.room_group_name, {
                    'type': 'broadcast_chat_message',
                    'message': data['message'],
                    'username': username
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
            'username': event['username']
        }))

    # handler for file tree updates
    async def file_tree_update(self, event):
        await self.send(text_data=json.dumps({
            'type': 'file_tree_update',
            'message': event['message']
        }))

    # Helper function to save messages to the database
    # @database_sync_to_async
    # def save_chat_message(self, message, user):
    #     project = Project.objects.get(id=self.project_id)
    #     ChatMessage.objects.create(project=project, user=user, message=message)