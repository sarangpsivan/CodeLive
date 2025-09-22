# backend/api/urls.py
from django.urls import path
from .views import CreateUserView, ProjectListCreateView, MyTokenObtainPairView
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path('token/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('register/', CreateUserView.as_view(), name='register'),
    path('projects/', ProjectListCreateView.as_view(), name='project-list-create'),
]