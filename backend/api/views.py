from django.conf import settings
from django.contrib.auth.models import User
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
import requests
import os
import time

from .models import Project, Membership, Folder, File, Documentation, Alert
from .serializers import (
    UserSerializer, ProjectSerializer, MyTokenObtainPairSerializer,
    MemberSerializer, FolderSerializer, FileDetailSerializer,
    FileCreateSerializer, FolderCreateSerializer, DocumentationSerializer, DocumentationListSerializer, AlertSerializer
)
from .permissions import IsProjectOwner, IsEditorOrOwner
from .rag_service import index_project, chat_with_project 


# Helper functions
def send_collaborator_update_signal(project_id, message, removed_user_id=None):
    channel_layer = get_channel_layer()
    payload = {
        'type': 'collaborator_update',
        'message': message,
    }
    if removed_user_id:
        payload['removed_user_id'] = removed_user_id
    
    async_to_sync(channel_layer.group_send)(f'project_{project_id}', payload)

def send_file_tree_update_signal(project_id, message):
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        f'project_{project_id}',
        {'type': 'file_tree_update', 'message': message}
    )

def send_doc_list_update_signal(project_id, message):
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        f'project_{project_id}',
        {'type': 'doc_list_update', 'message': message}
    )

def send_doc_content_update_signal(project_id, document_id, updated_data):
    print(f"VIEW: Attempting to send doc_content_update signal for doc {document_id} in project {project_id}") 
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        f'project_{project_id}',
        {
            'type': 'doc_content_update',
            'documentId': document_id,
            'updater_username': updated_data.get('last_updated_by_username', 'N/A'),
            'updated_at': updated_data.get('updated_at', None).isoformat() if updated_data.get('updated_at') else None,
            'title': updated_data.get('title'),
            'content': updated_data.get('content')
        }
    )

def send_alert_signal(project_id, message):
    unresolved_count = Alert.objects.filter(project_id=project_id, is_resolved=False).count()
    
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        f'project_{project_id}',
        {
            'type': 'alert_update', 
            'message': message,
            'unresolved_count': unresolved_count 
        }
    )

# Authentication Views
class CreateUserView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer

class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer


# Project Views
class ProjectListCreateView(generics.ListCreateAPIView):
    serializer_class = ProjectSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Project.objects.filter(
            membership__user=self.request.user,
            membership__status=Membership.Status.APPROVED 
        ).distinct()

    def perform_create(self, serializer):
        project = serializer.save(owner=self.request.user)
        Membership.objects.create(
            project=project, 
            user=self.request.user, 
            role=Membership.Role.ADMIN, 
            status=Membership.Status.APPROVED
        )

class ProjectDetailView(generics.RetrieveAPIView):
    serializer_class = ProjectSerializer
    permission_classes = [IsAuthenticated]
    queryset = Project.objects.all()

class ProjectTerminateView(generics.DestroyAPIView):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer
    permission_classes = [IsAuthenticated, IsProjectOwner]


# Membership Views
class MemberListView(generics.ListAPIView):
    serializer_class = MemberSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        project_id = self.kwargs['project_id']
        return Membership.objects.filter(project_id=project_id, status=Membership.Status.APPROVED)

class JoinProjectView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        room_code = request.data.get('room_code')
        
        if not room_code:
            return Response({'error': 'Room code is required.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            project = Project.objects.get(room_code=room_code)
        except Project.DoesNotExist:
            return Response({'error': 'Project with this code does not exist.'}, status=status.HTTP_404_NOT_FOUND)
        if Membership.objects.filter(project=project, user=request.user).exists():
            return Response({'error': 'You have already joined or requested to join this project.'}, status=status.HTTP_400_BAD_REQUEST)
        
        Membership.objects.create(
            project=project, 
            user=request.user, 
            role=Membership.Role.VIEWER,
            status=Membership.Status.PENDING
        )
        
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f'project_{project.id}',
            {'type': 'new_join_request'}
        )
        
        return Response({'message': 'Your request to join has been sent to the project owner.'}, status=status.HTTP_201_CREATED)

class MembershipDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Membership.objects.all()
    permission_classes = [IsAuthenticated]
    serializer_class = MemberSerializer

    def update(self, request, *args, **kwargs):
        membership = self.get_object()
        project = membership.project
        if project.owner != request.user:
            return Response({'error': 'Only the project owner can change roles.'}, status=status.HTTP_403_FORBIDDEN)
        if membership.user == project.owner:
            return Response({'error': 'Project owner role cannot be changed.'}, status=status.HTTP_400_BAD_REQUEST)
        
        response = super().update(request, *args, **kwargs)
        if response.status_code == 200:
            send_collaborator_update_signal(project.id, 'A member role has been updated.')
        return response

    def destroy(self, request, *args, **kwargs):
        membership = self.get_object()
        project_id_for_signal = membership.project.id
        removed_user_id = membership.user.id
        project_owner = membership.project.owner
        current_user = request.user

        if not (project_owner == current_user or removed_user_id == current_user.id):
            return Response({'error': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)

        if project_owner == current_user and removed_user_id == current_user.id:
            return Response({'error': 'Owner cannot leave the project. Please terminate it instead.'}, status=status.HTTP_400_BAD_REQUEST)

        self.perform_destroy(membership)

        send_collaborator_update_signal(
            project_id=project_id_for_signal,
            message='A member has left or been removed.',
            removed_user_id=removed_user_id
        )
        
        return Response(status=status.HTTP_204_NO_CONTENT)

class MembershipRequestListView(generics.ListAPIView):
    
    serializer_class = MemberSerializer
    permission_classes = [IsAuthenticated, IsProjectOwner]

    def get_queryset(self):
        project_id = self.kwargs['project_id']
        project = generics.get_object_or_404(Project, pk=project_id)
        self.check_object_permissions(self.request, project)
        return Membership.objects.filter(project=project, status=Membership.Status.PENDING)

class MembershipRequestActionView(APIView):
    
    permission_classes = [IsAuthenticated, IsProjectOwner]

    def post(self, request, *args, **kwargs):
        membership_id = self.kwargs['membership_id']
        action = request.data.get('action')

        membership = generics.get_object_or_404(Membership, pk=membership_id)
        project = membership.project

        self.check_object_permissions(self.request, project)

        if action == 'approve':
            membership.status = Membership.Status.APPROVED
            membership.save()
            
            send_collaborator_update_signal(project.id, f"{membership.user.username} has been approved.")
            
            project_data = ProjectSerializer(project).data
            channel_layer = get_channel_layer()
            async_to_sync(channel_layer.group_send)(
                f'user_{membership.user.id}',
                {
                    'type': 'project_approval_notification',
                    'project': project_data
                }
            )
            return Response({'message': 'Membership approved.'}, status=status.HTTP_200_OK)
        
        elif action == 'reject':
            membership.delete()
            send_collaborator_update_signal(project.id, f"A join request has been rejected.")
            return Response({'message': 'Membership rejected and deleted.'}, status=status.HTTP_204_NO_CONTENT)
        
        return Response({'error': 'Invalid action.'}, status=status.HTTP_400_BAD_REQUEST)

# File and Folder Views
class FileTreeView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, project_id):
        try:
            top_level_folders = Folder.objects.filter(project_id=project_id, parent__isnull=True)
            serializer = FolderSerializer(top_level_folders, many=True)
            return Response(serializer.data)
        except Exception as e:
            return Response({'error': str(e)}, status=500)

class FileCreateView(generics.CreateAPIView):
    queryset = File.objects.all()
    serializer_class = FileCreateSerializer
    permission_classes = [IsAuthenticated, IsEditorOrOwner]

    def perform_create(self, serializer):
        new_file = serializer.save()
        send_file_tree_update_signal(new_file.project.id, 'A file has been created.')

class FileDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = FileDetailSerializer
    permission_classes = [IsAuthenticated, IsEditorOrOwner]
    queryset = File.objects.all()

    def perform_destroy(self, instance):
        project_id = instance.project.id
        instance.delete()
        send_file_tree_update_signal(project_id, 'A file has been deleted.')

class FolderCreateView(generics.CreateAPIView):
    queryset = Folder.objects.all()
    serializer_class = FolderCreateSerializer
    permission_classes = [IsAuthenticated, IsEditorOrOwner]

    def perform_create(self, serializer):
        new_folder = serializer.save()
        send_file_tree_update_signal(new_folder.project.id, 'A folder has been created.')

class FolderDetailView(generics.RetrieveDestroyAPIView):
    serializer_class = FolderSerializer
    permission_classes = [IsAuthenticated, IsEditorOrOwner]
    queryset = Folder.objects.all()

    def perform_destroy(self, instance):
        project_id = instance.project.id
        instance.delete()
        send_file_tree_update_signal(project_id, 'A folder has been deleted.')


# Code Execution View
class CodeExecutionView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        language = request.data.get('language', 'python')
        code = request.data.get('code', '')

        language_map = {
            "python": 71,
            "javascript": 63,
            "cpp": 54,
            "java": 62,
        }
        language_id = language_map.get(language)
        if not language_id:
            return Response({"error": "Unsupported language"}, status=status.HTTP_400_BAD_REQUEST)

        url = "https://judge0-ce.p.rapidapi.com/submissions"
        payload = {
            "language_id": language_id,
            "source_code": code,
            "stdin": request.data.get('input', '')
        }
        headers = {
            "content-type": "application/json",
            "X-RapidAPI-Key": settings.JUDGE0_API_KEY,
            "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com"
        }

        try:
            response = requests.post(url, json=payload, headers=headers)
            response.raise_for_status()
            submission_token = response.json().get('token')
            if not submission_token:
                return Response({"error": "Failed to get submission token"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            result_url = f"{url}/{submission_token}"
            while True:
                result_response = requests.get(result_url, headers=headers)
                result_response.raise_for_status()
                result_data = result_response.json()
                if result_data.get('status', {}).get('id', 0) > 2: 
                    return Response(result_data)
                time.sleep(0.2) 

        except requests.exceptions.RequestException as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
# dashbord view

class DashboardStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        current_user = request.user

        user_projects = Project.objects.filter(
            membership__user=current_user, 
            membership__status=Membership.Status.APPROVED
        )

        collaborator_ids = Membership.objects.filter(
            project__in=user_projects,
            status=Membership.Status.APPROVED
        ).values_list('user', flat=True).distinct()
        
        total_collaborators = max(0, collaborator_ids.count() - 1)

        total_files = File.objects.filter(project__in=user_projects).count()

        data = {
            'total_collaborators': total_collaborators,
            'total_files': total_files 
        }
        return Response(data)
    
#documentation view

class DocumentationRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    
    serializer_class = DocumentationSerializer
    permission_classes = [IsAuthenticated]
    queryset = Documentation.objects.all() 

    def get_object(self):
        doc = super().get_object()
        project_id_from_url = self.kwargs['project_id']
        
        if doc.project.id != project_id_from_url:
            raise generics.NotFound() 

        if not Membership.objects.filter(
            project_id=project_id_from_url, 
            user=self.request.user, 
            status=Membership.Status.APPROVED
        ).exists():
            raise generics.PermissionDenied("You are not an approved member of this project.")
            
        return doc
        
    def perform_update(self, serializer):
        updated_instance = serializer.save(last_updated_by=self.request.user)
        print(f"VIEW: Document {updated_instance.id} saved successfully. Preparing signal data.")
        signal_data = {
            'last_updated_by_username': updated_instance.last_updated_by.username if updated_instance.last_updated_by else 'N/A',
            'updated_at': updated_instance.updated_at,
            'title': updated_instance.title,
            'content': updated_instance.content
        }
        send_doc_content_update_signal(
            updated_instance.project.id,
            updated_instance.id,
            signal_data
        )

    def perform_destroy(self, instance):
        project_id = instance.project.id 
        instance.delete()
        send_doc_list_update_signal(project_id, 'Document deleted.')

class DocumentationListCreateView(generics.ListCreateAPIView):

    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return DocumentationSerializer 
        return DocumentationListSerializer 

    def get_queryset(self):
        project_id = self.kwargs['project_id']
        project = generics.get_object_or_404(Project, pk=project_id)
        
        if not Membership.objects.filter(project=project, user=self.request.user, status=Membership.Status.APPROVED).exists():
            raise generics.PermissionDenied("You are not an approved member of this project.")
            
        return Documentation.objects.filter(project=project)

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['project'] = generics.get_object_or_404(Project, pk=self.kwargs['project_id'])
        return context

    def perform_create(self, serializer):
        new_doc = serializer.save() 
        send_doc_list_update_signal(new_doc.project.id, 'New document created.')


# RAG Views

class AIIndexProjectView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, project_id):
        try:
            project = Project.objects.get(id=project_id)
            if not Membership.objects.filter(project=project, user=request.user, status=Membership.Status.APPROVED).exists():
                return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        except Project.DoesNotExist:
            return Response({'error': 'Project not found'}, status=status.HTTP_404_NOT_FOUND)

        success, message = index_project(project_id)
        if success:
            return Response({'message': message})
        else:
            return Response({'error': message}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class AIChatView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, project_id):
        query = request.data.get('query')
        if not query:
            return Response({'error': 'Query is required'}, status=status.HTTP_400_BAD_REQUEST)

        if not Membership.objects.filter(project_id=project_id, user=request.user, status=Membership.Status.APPROVED).exists():
             return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

        try:
            answer = chat_with_project(project_id, query)
            return Response({'answer': answer})
        except Exception as e:
            print(f"AI Error: {str(e)}")
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
# Alert Views
class AlertListCreateView(generics.ListCreateAPIView):
    serializer_class = AlertSerializer
    permission_classes = [IsAuthenticated] 

    def get_queryset(self):
        project_id = self.kwargs['project_id']
        return Alert.objects.filter(project_id=project_id)

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['project'] = generics.get_object_or_404(Project, pk=self.kwargs['project_id'])
        return context

    def perform_create(self, serializer):
        alert = serializer.save()
        send_alert_signal(alert.project.id, "New alert raised.")

class AlertDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Alert.objects.all()
    serializer_class = AlertSerializer
    permission_classes = [IsAuthenticated, IsEditorOrOwner] 

    def perform_update(self, serializer):
        alert = serializer.save()
        send_alert_signal(alert.project.id, "Alert status updated.")

    def perform_destroy(self, instance):
        project_id = instance.project.id
        instance.delete()
        send_alert_signal(project_id, "Alert deleted.")