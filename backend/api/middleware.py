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
        token = AccessToken(token_key)
        user_id = token['user_id']
        return User.objects.get(id=user_id)
    except Exception as e:
        print(f"WS-Middleware: Token validation failed: {str(e)}")
        return AnonymousUser()

class TokenAuthMiddleware(BaseMiddleware):
    async def __call__(self, scope, receive, send):
        query_string = scope.get('query_string', b'').decode('utf-8')
        query_params = urllib.parse.parse_qs(query_string)
        token = query_params.get('token', [None])[0]
        
        print(f"WS-Middleware: Connecting... Token found: {bool(token)}")

        if token:
            user = await get_user(token)
            scope['user'] = user
            print(f"WS-Middleware: User resolved: {user}")
        else:
            scope['user'] = AnonymousUser()
            print("WS-Middleware: No token provided, setting AnonymousUser")

        return await super().__call__(scope, receive, send)