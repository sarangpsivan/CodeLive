from rest_framework.authentication import BaseAuthentication
from rest_framework_simplejwt.authentication import JWTAuthentication
import urllib.parse

class CodeLivePreviewAuthentication(BaseAuthentication):
    def authenticate(self, request):
        token = request.GET.get('token')
        
        if not token:
            token = request.COOKIES.get('preview_access_token')

        if not token:
            referer = request.META.get('HTTP_REFERER')
            if referer:
                try:
                    parsed_url = urllib.parse.urlparse(referer)
                    query_params = urllib.parse.parse_qs(parsed_url.query)
                    if 'token' in query_params:
                        token = query_params['token'][0]
                        print(f"DEBUG: AUTH - Found token in Referer: {referer}")
                    else:
                        print(f"DEBUG: AUTH - Referer present but no token: {referer}")
                except Exception:
                    pass
            else:
                 print("DEBUG: AUTH - No Referer Header found")

        if not token:
            return None 

        try:
            jwt_auth = JWTAuthentication()
            validated_token = jwt_auth.get_validated_token(token)
            user = jwt_auth.get_user(validated_token)
            return (user, validated_token)
        except Exception as e:
            print(f"DEBUG: AUTH - Token validation failed: {e}")
            return None