from allauth.account.adapter import DefaultAccountAdapter
from allauth.socialaccount.adapter import DefaultSocialAccountAdapter
from django.conf import settings
from .serializers import MyTokenObtainPairSerializer 
from django.contrib.auth import get_user_model

class CustomAccountAdapter(DefaultAccountAdapter):
    def get_login_redirect_url(self, request):
        user = request.user
        
        refresh = MyTokenObtainPairSerializer.get_token(user)
        access_token = str(refresh.access_token)
        refresh_token = str(refresh)
        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
        
        return f"{frontend_url}/social-auth-callback?access_token={access_token}&refresh_token={refresh_token}"

class CustomSocialAccountAdapter(DefaultSocialAccountAdapter):
    def pre_social_login(self, request, sociallogin):
        if sociallogin.is_existing:
            return

        if request.user.is_authenticated:
            return

        User = get_user_model()
        email = sociallogin.account.extra_data.get('email') or sociallogin.user.email
        
        if email:
            try:
                existing_user = User.objects.get(email__iexact=email)
                sociallogin.connect(request, existing_user)
            except User.DoesNotExist:
                pass