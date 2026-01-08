import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from api.middleware import TokenAuthMiddleware
import api.routing

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

# Startup/Shutdown lifecycle handler
import redis
from django.conf import settings

def clear_presence_keys():
    try:
        r = redis.Redis(host=settings.REDIS_HOST, port=settings.REDIS_PORT, db=0)
        keys = r.keys("project_presence_*")
        if keys:
            print(f"Startup: Cleaning up {len(keys)} stale presence keys...")
            r.delete(*keys)
    except Exception as e:
        print(f"Startup: Failed to clear Redis keys: {e}")

# Call immediately (synchronous check on import/startup)
clear_presence_keys()

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": TokenAuthMiddleware(
        URLRouter(
            api.routing.websocket_urlpatterns
        )
    ),
})