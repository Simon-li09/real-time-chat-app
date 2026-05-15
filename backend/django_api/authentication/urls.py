from django.urls import path
from .views import RegisterView, MeView, CustomTokenObtainPairView, ProfileUpdateView, AdminStats

urlpatterns = [
    # Full path will be: /api/register/
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', CustomTokenObtainPairView.as_view(), name='login'),
    path('me/', MeView.as_view(), name='me'),
    path('profile/', ProfileUpdateView.as_view(), name='profile-update'),
    
    # Full path will be: /api/admin/stats/
    path("admin/stats/", AdminStats.as_view(), name="admin-stats"),
]