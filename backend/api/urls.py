# backend/api/urls.py
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

urlpatterns = [
    path('token/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('register/', CreateUserView.as_view(), name='register'),
    path('projects/', ProjectListCreateView.as_view(), name='project-list-create'),
    path("projects/<int:project_id>/members/", MemberListView.as_view(), name="member-list"),
    path("projects/<int:project_id>/files/", FileTreeView.as_view(), name="file-tree"),
    path("projects/<int:pk>/", ProjectDetailView.as_view(), name="project-detail"),
    path("files/<int:pk>/", FileDetailView.as_view(), name="file-detail"),
    path("files/create/", FileCreateView.as_view(), name="file-create"),
    path("folders/create/", FolderCreateView.as_view(), name="folder-create"),
    path("folders/<int:pk>/", FolderDetailView.as_view(), name="folder-detail"),
    path("execute/", CodeExecutionView.as_view(), name="code-execute"),
]