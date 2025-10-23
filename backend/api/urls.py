from django.urls import path
from .views import CreateUserView, ProjectListCreateView, MyTokenObtainPairView
from rest_framework_simplejwt.views import TokenRefreshView
from .views import MemberListView
from .views import FileTreeView
from .views import ProjectDetailView
from .views import FileDetailView
from .views import FileCreateView, FolderCreateView
from .views import FolderDetailView
from .views import CodeExecutionView
from .views import JoinProjectView
from .views import MembershipDetailView
from .views import ProjectTerminateView
from .views import MembershipRequestListView, MembershipRequestActionView
from .views import (
    DashboardStatsView,
    DocumentationListCreateView, 
    DocumentationRetrieveUpdateDestroyView 
)

urlpatterns = [
    path('token/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('register/', CreateUserView.as_view(), name='register'),
    path('dashboard-stats/', DashboardStatsView.as_view(), name='dashboard-stats'),
    path('projects/', ProjectListCreateView.as_view(), name='project-list-create'),
    path("projects/<int:project_id>/members/", MemberListView.as_view(), name="member-list"),
    path("projects/<int:project_id>/files/", FileTreeView.as_view(), name="file-tree"),
    path("projects/<int:pk>/", ProjectDetailView.as_view(), name="project-detail"),
    path("files/<int:pk>/", FileDetailView.as_view(), name="file-detail"),
    path("files/create/", FileCreateView.as_view(), name="file-create"),
    path("folders/create/", FolderCreateView.as_view(), name="folder-create"),
    path("folders/<int:pk>/", FolderDetailView.as_view(), name="folder-detail"),
    path("execute/", CodeExecutionView.as_view(), name="code-execute"),
    path("projects/join/", JoinProjectView.as_view(), name="project-join"),
    path("memberships/<int:pk>/", MembershipDetailView.as_view(), name="membership-detail"),
    path("projects/<int:pk>/terminate/", ProjectTerminateView.as_view(), name="project-terminate"),
    path("projects/<int:project_id>/requests/", MembershipRequestListView.as_view(), name="membership-request-list"),
    path("requests/<int:membership_id>/action/", MembershipRequestActionView.as_view(), name="membership-request-action"),
    path("projects/<int:project_id>/documentation/", DocumentationListCreateView.as_view(), name="project-documentation-list-create"),
    path("projects/<int:project_id>/documentation/<int:pk>/", DocumentationRetrieveUpdateDestroyView.as_view(), name="project-documentation-detail"),
]