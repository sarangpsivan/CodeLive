# backend/api/permissions.py
from rest_framework import permissions

class IsProjectOwner(permissions.BasePermission):
    """
    Custom permission to only allow owners of a project to edit or delete it.
    """
    def has_object_permission(self, request, view, obj):
        # Write permissions are only allowed to the owner of the project.
        return obj.owner == request.user