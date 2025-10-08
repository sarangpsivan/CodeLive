# backend/api/middleware.py
from django.contrib.auth.models import AnonymousUser
from channels.db import database_sync_to_async
from channels.middleware import BaseMiddleware
from rest_framework_simplejwt.tokens import AccessToken
from django.contrib.auth import get_user_model
import urllib.parse

User = get_user_model()

@database_sync_to_async
def get_user(token_key):
    try:
        # Validate the token and get the user
        token = AccessToken(token_key)
        user_id = token['user_id']
        return User.objects.get(id=user_id)
    except Exception:
        return AnonymousUser()

class TokenAuthMiddleware(BaseMiddleware):
    async def __call__(self, scope, receive, send):
        # Look for a 'token' query parameter in the URL
        query_string = scope.get('query_string', b'').decode('utf-8')
        query_params = urllib.parse.parse_qs(query_string)
        token = query_params.get('token', [None])[0]

        if token:
            # Get the user associated with this token
            scope['user'] = await get_user(token)
        else:
            scope['user'] = AnonymousUser()

        return await super().__call__(scope, receive, send)