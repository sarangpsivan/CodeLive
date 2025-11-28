from django.contrib.auth.models import User
from rest_framework import serializers
from .models import Project, Membership, Folder, File, Documentation, Alert
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

class UserSerializer(serializers.ModelSerializer):
    first_name = serializers.CharField(write_only=True, required=False, allow_blank=True)
    last_name = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ["id", "username", "email", "password", "first_name", "last_name"]
        extra_kwargs = {
            "password": {"write_only": True},
            "username": {"read_only": True}
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
    member_count = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = ['id', 'name', 'owner', 'created_at', 'room_code', 'member_count']
        read_only_fields = ['room_code']

    def get_member_count(self, obj):
        return obj.membership_set.filter(status=Membership.Status.APPROVED).count()

class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['username'] = user.username
        token['first_name'] = user.first_name
        token['user_id'] = user.id
        return token

class MemberSerializer(serializers.ModelSerializer):
    first_name = serializers.CharField(source='user.first_name', read_only=True)
    email = serializers.CharField(source='user.email', read_only=True)
    user = serializers.ReadOnlyField(source='user.id')

    class Meta:
        model = Membership
        fields = ['id', 'user', 'first_name', 'email', 'role']
        read_only_fields = ['user', 'first_name', 'email']

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

class DocumentationSerializer(serializers.ModelSerializer):
    last_updated_by_username = serializers.CharField(source='last_updated_by.username', read_only=True, default='N/A')
    
    class Meta:
        model = Documentation
        fields = ['id', 'project', 'title', 'content', 'last_updated_by', 'last_updated_by_username', 'updated_at']
        read_only_fields = ['id', 'project', 'last_updated_by', 'last_updated_by_username', 'updated_at'] 

    def create(self, validated_data):
        validated_data['last_updated_by'] = self.context['request'].user
        validated_data['project'] = self.context['project'] 
        return super().create(validated_data)

    def update(self, instance, validated_data):
        instance.title = validated_data.get('title', instance.title) 
        instance.content = validated_data.get('content', instance.content)
        instance.last_updated_by = self.context['request'].user
        instance.save()
        return instance
    
class DocumentationListSerializer(serializers.ModelSerializer):
    last_updated_by_username = serializers.CharField(source='last_updated_by.username', read_only=True, default='N/A')

    class Meta:
        model = Documentation
        fields = ['id', 'title', 'updated_at', 'last_updated_by_username'] 

class AlertSerializer(serializers.ModelSerializer):
    sender_name = serializers.SerializerMethodField()
    sender_email = serializers.CharField(source='sender.email', read_only=True)

    class Meta:
        model = Alert
        fields = ['id', 'project', 'sender', 'sender_name', 'sender_email', 'message', 'is_resolved', 'created_at', 'file_name', 'line_number']
        read_only_fields = ['id', 'sender', 'created_at', 'project']
    
    def create(self, validated_data):
        validated_data['sender'] = self.context['request'].user
        validated_data['project'] = self.context['project']
        return super().create(validated_data)

    def get_sender_name(self, obj):
        full_name = f"{obj.sender.first_name} {obj.sender.last_name}".strip()
        return full_name if full_name else obj.sender.username