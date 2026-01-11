
class CreateSuperUserView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        secret = request.GET.get('secret')
        # Hardcoded secret for this session only - User should delete this view after use
        if secret != "temporary_admin_bypass_2026":
            return Response({"error": "Unauthorized"}, status=status.HTTP_401_UNAUTHORIZED)
        
        username = request.GET.get('username', 'admin')
        email = request.GET.get('email', 'admin@example.com')
        password = request.GET.get('password', 'admin123')

        if User.objects.filter(username=username).exists():
            return Response({"message": f"User {username} already exists"}, status=status.HTTP_200_OK)

        try:
            User.objects.create_superuser(username, email, password)
            return Response({"message": f"Superuser {username} created successfully"}, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
