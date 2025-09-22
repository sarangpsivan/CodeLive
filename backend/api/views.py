from django.contrib.auth.models import User
from rest_framework import generics
from .serializers import UserSerializer, ProjectSerializer
from .models import Project
from rest_framework.permissions import IsAuthenticated
from .serializers import MyTokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView

class CreateUserView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer

class ProjectListCreateView(generics.ListCreateAPIView):
    serializer_class = ProjectSerializer
    permission_classes = [IsAuthenticated] # Only authenticated users can access this view

    def get_queryset(self):
        # This view should only return projects owned by the currently logged-in user
        return Project.objects.filter(owner=self.request.user)

    def perform_create(self, serializer):
        # When a new project is created, set the owner to the current user
        serializer.save(owner=self.request.user)

class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer
