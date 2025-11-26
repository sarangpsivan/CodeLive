from rest_framework import permissions
from .models import Membership

class IsProjectOwner(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        return obj.owner == request.user

class IsEditorOrOwner(permissions.BasePermission):
    """
    - Owners: Full Access
    - Editors/Admins: Full Access
    - Viewers: Read-Only Access (GET requests only)
    """
    def has_object_permission(self, request, view, obj):
        # 1. Project Owners always have full access
        if obj.project.owner == request.user:
            return True

        # 2. Check if the user is a member of the project
        try:
            membership = Membership.objects.get(
                project=obj.project,
                user=request.user,
                status=Membership.Status.APPROVED
            )
            
            # 3. If the method is SAFE (GET, HEAD, OPTIONS), allow ALL members (including Viewers)
            if request.method in permissions.SAFE_METHODS:
                return True

            # 4. If the method is UNSAFE (PUT, DELETE, POST), allow only ADMIN/EDITOR
            return membership.role in [Membership.Role.ADMIN, Membership.Role.EDITOR]

        except Membership.DoesNotExist:
            return False