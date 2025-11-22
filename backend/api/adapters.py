from allauth.account.adapter import DefaultAccountAdapter
from allauth.socialaccount.adapter import DefaultSocialAccountAdapter
from django.conf import settings
# Import your custom serializer
from .serializers import MyTokenObtainPairSerializer 
from django.contrib.auth import get_user_model

class CustomAccountAdapter(DefaultAccountAdapter):
    def get_login_redirect_url(self, request):
        # Get the user who just logged in
        user = request.user
        
        # Generate tokens using YOUR custom serializer to include username/first_name
        refresh = MyTokenObtainPairSerializer.get_token(user)
        access_token = str(refresh.access_token)
        refresh_token = str(refresh)

        # Get the frontend URL from settings
        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
        
        # Construct the redirect URL with tokens
        return f"{frontend_url}/social-auth-callback?access_token={access_token}&refresh_token={refresh_token}"

class CustomSocialAccountAdapter(DefaultSocialAccountAdapter):
    def pre_social_login(self, request, sociallogin):
        # 1. If the social account is already connected, let it pass
        if sociallogin.is_existing:
            return

        # 2. If the user is already logged in, let allauth handle the connection
        if request.user.is_authenticated:
            return

        # 3. Check if a user with this email already exists in the DB
        User = get_user_model()
        email = sociallogin.account.extra_data.get('email') or sociallogin.user.email
        
        if email:
            try:
                existing_user = User.objects.get(email__iexact=email)
                # Connect the new social account to the existing user
                sociallogin.connect(request, existing_user)
            except User.DoesNotExist:
                # No user exists, let allauth create a new one
                pass