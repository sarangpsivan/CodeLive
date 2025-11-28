from rest_framework import permissions
from .models import Membership

class IsProjectOwner(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        return obj.owner == request.user

class IsEditorOrOwner(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if obj.project.owner == request.user:
            return True

        try:
            membership = Membership.objects.get(
                project=obj.project,
                user=request.user,
                status=Membership.Status.APPROVED
            )
            
            if request.method in permissions.SAFE_METHODS:
                return True

            return membership.role in [Membership.Role.ADMIN, Membership.Role.EDITOR]

        except Membership.DoesNotExist:
            return False