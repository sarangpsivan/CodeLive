import json
from channels.generic.websocket import AsyncWebsocketConsumer
from .models import ChatMessage, Project, Documentation, Membership
from django.contrib.auth.models import User
from channels.db import database_sync_to_async
from collections import defaultdict
import redis
from django.conf import settings

r = redis.Redis(host=settings.REDIS_HOST, port=settings.REDIS_PORT, db=0)

class ProjectConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.project_id = self.scope['url_route']['kwargs']['projectId']
        self.room_group_name = f'project_{self.project_id}'
        self.redis_key = f"project_presence_{self.project_id}" 
        self.user = self.scope["user"]

        print(f"WS-Consumer: Connect attempt for project {self.project_id} by {self.user}")

        if self.user.is_anonymous:
            print("WS-Consumer: Rejecting anonymous user")
            await self.close()
            return

        self.can_edit = await self.check_edit_permission(self.user.id, self.project_id)

        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

        count = await database_sync_to_async(r.hincrby)(self.redis_key, str(self.user.id), 1)
        
        if count == 1:
            await self.broadcast_presence()
        else:
            await self.send_current_presence()

        await self.send(text_data=json.dumps({
            'type': 'permission_status',
            'can_edit': self.can_edit
        }))

    async def disconnect(self, close_code):
        if self.user.is_authenticated:
            count = await database_sync_to_async(r.hincrby)(self.redis_key, str(self.user.id), -1)
            
            if count <= 0:
                await database_sync_to_async(r.hdel)(self.redis_key, str(self.user.id))
                await self.broadcast_presence()

        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def send_current_presence(self):
        active_ids_bytes = await database_sync_to_async(r.hkeys)(self.redis_key)
        active_ids = [int(uid.decode('utf-8')) for uid in active_ids_bytes]
        
        await self.send(text_data=json.dumps({
            'type': 'presence_update',
            'active_user_ids': active_ids
        }))

    async def broadcast_presence(self):
        active_ids_bytes = await database_sync_to_async(r.hkeys)(self.redis_key)
        active_ids = [int(uid.decode('utf-8')) for uid in active_ids_bytes]
            
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
        if removed_user_id:
            await database_sync_to_async(r.hdel)(self.redis_key, str(removed_user_id))
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