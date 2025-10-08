# backend/api/serializers.py

from django.contrib.auth.models import User
from rest_framework import serializers
from .models import Project
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import Membership
from .models import Folder, File

class UserSerializer(serializers.ModelSerializer):
    first_name = serializers.CharField(write_only=True, required=False, allow_blank=True)
    last_name = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ["id", "username", "email", "password", "first_name", "last_name"]
        # UPDATE THIS PART
        extra_kwargs = {
            "password": {"write_only": True},
            "username": {"read_only": True} # Tell DRF username is not needed for input
        }

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['email'],
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', '')
        )
        return user
    
class ProjectSerializer(serializers.ModelSerializer):
    owner = serializers.ReadOnlyField(source='owner.id')
    member_count = serializers.IntegerField(source='membership_set.count', read_only=True)

    class Meta:
        model = Project
        fields = ['id', 'name', 'owner', 'created_at', 'room_code', 'member_count']
        read_only_fields = ['room_code']

class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # Add custom claims to the token
        token['username'] = user.username
        token['first_name'] = user.first_name
        token['user_id'] = user.id

        return token
    
class MemberSerializer(serializers.ModelSerializer):
    first_name = serializers.CharField(source='user.first_name', read_only=True)
    email = serializers.CharField(source='user.email', read_only=True)

    class Meta:
        model = Membership
        fields = ['id', 'user', 'first_name', 'email', 'role']

class FileSerializer(serializers.ModelSerializer):
    class Meta:
        model = File
        fields = ['id', 'name']

class FolderSerializer(serializers.ModelSerializer):
    files = FileSerializer(many=True, read_only=True)
    subfolders = serializers.SerializerMethodField()

    class Meta:
        model = Folder
        fields = ['id', 'name', 'files', 'subfolders']

    def get_subfolders(self, obj):
        # Recursively serialize subfolders
        subfolders = Folder.objects.filter(parent=obj)
        return FolderSerializer(subfolders, many=True).data
    
class FileDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = File
        fields = ['id', 'name', 'content', 'folder', 'project']

class FileCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = File
        fields = ['name', 'folder', 'project']

class FolderCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Folder
        fields = ['name', 'parent', 'project']