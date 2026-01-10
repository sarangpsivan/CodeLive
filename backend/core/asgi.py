import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

# Initialize Django ASAP to allow model imports in middleware
import django
django.setup()

from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from api.middleware import TokenAuthMiddleware
import api.routing
import redis
from django.conf import settings



application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": TokenAuthMiddleware(
        URLRouter(
            api.routing.websocket_urlpatterns
        )
    ),
})