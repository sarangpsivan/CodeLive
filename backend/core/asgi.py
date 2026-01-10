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

def clear_presence_keys():
    try:
        redis_url = os.environ.get('REDIS_URL')
        if redis_url:
            r = redis.from_url(redis_url)
        else:
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