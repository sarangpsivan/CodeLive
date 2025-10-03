from django.contrib.auth.models import User
from rest_framework import generics
from .serializers import UserSerializer, ProjectSerializer
from .models import Project
from rest_framework.permissions import IsAuthenticated
from .serializers import MyTokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from .models import Membership
from .serializers import MemberSerializer
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Folder
from .serializers import FolderSerializer
from .serializers import FileDetailSerializer
from .models import File
from .serializers import FileCreateSerializer, FolderCreateSerializer
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
import requests
import os
import time
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

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

class MemberListView(generics.ListAPIView):
    serializer_class = MemberSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Get the project_id from the URL
        project_id = self.kwargs['project_id']
        # Return all members for that specific project
        return Membership.objects.filter(project_id=project_id)
    
class FileTreeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, project_id):
        try:
            # Fetch only top-level folders for the given project
            top_level_folders = Folder.objects.filter(project_id=project_id, parent__isnull=True)
            serializer = FolderSerializer(top_level_folders, many=True)
            return Response(serializer.data)
        except Exception as e:
            return Response({'error': str(e)}, status=500)
        
class ProjectDetailView(generics.RetrieveAPIView):
    serializer_class = ProjectSerializer
    permission_classes = [IsAuthenticated]
    queryset = Project.objects.all()

class FileDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = FileDetailSerializer
    permission_classes = [IsAuthenticated]
    queryset = File.objects.all()

    def perform_destroy(self, instance):
        project_id = instance.project.id
        instance.delete()
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f'project_{project_id}',
            {'type': 'file_tree_update', 'message': 'A file has been deleted.'}
        )

class FileCreateView(generics.CreateAPIView):
    queryset = File.objects.all()
    serializer_class = FileCreateSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        # First, save the new file object
        new_file = serializer.save()
        
        # Then, send a notification to the project's WebSocket group
        channel_layer = get_channel_layer()
        project_id = new_file.project.id
        async_to_sync(channel_layer.group_send)(
            f'project_{project_id}',
            {
                'type': 'file_tree_update', # This is a new event type
                'message': 'A file has been updated.'
            }
        )

class FolderCreateView(generics.CreateAPIView):
    queryset = Folder.objects.all()
    serializer_class = FolderCreateSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        # First, save the new folder object
        new_folder = serializer.save()
        
        # Then, send a notification to the project's WebSocket group
        channel_layer = get_channel_layer()
        project_id = new_folder.project.id
        async_to_sync(channel_layer.group_send)(
            f'project_{project_id}',
            {
                'type': 'file_tree_update',
                'message': 'A folder has been updated.'
            }
        )

class FolderDetailView(generics.RetrieveDestroyAPIView):
    serializer_class = FolderSerializer
    permission_classes = [IsAuthenticated]
    queryset = Folder.objects.all()

    def perform_destroy(self, instance):
        project_id = instance.project.id
        instance.delete()
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f'project_{project_id}',
            {'type': 'file_tree_update', 'message': 'A folder has been deleted.'}
        )

class CodeExecutionView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        language = request.data.get('language', 'python')
        code = request.data.get('code', '')

        # Map our language names to Judge0's language IDs
        language_map = {
            "python": 71,
            "javascript": 63,
            "cpp": 54,
            "java": 62,
        }
        language_id = language_map.get(language)
        if not language_id:
            return Response({"error": "Unsupported language"}, status=status.HTTP_400_BAD_REQUEST)

        # API request to Judge0 to submit the code
        url = "https://judge0-ce.p.rapidapi.com/submissions"
        payload = {
            "language_id": language_id,
            "source_code": code,
            "stdin": request.data.get('input', '')
        }
        headers = {
            "content-type": "application/json",
            "X-RapidAPI-Key": os.environ.get('JUDGE0_API_KEY'),
            "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com"
        }

        try:
            response = requests.post(url, json=payload, headers=headers)
            response.raise_for_status()
            submission_token = response.json().get('token')
            if not submission_token:
                return Response({"error": "Failed to get submission token"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            # Poll Judge0 for the result
            result_url = f"{url}/{submission_token}"
            while True:
                result_response = requests.get(result_url, headers=headers)
                result_response.raise_for_status()
                result_data = result_response.json()
                if result_data.get('status', {}).get('id', 0) > 2: # Statuses 1 (In Queue) and 2 (Processing)
                    return Response(result_data)
                time.sleep(0.2) # Wait 200ms before polling again

        except requests.exceptions.RequestException as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)