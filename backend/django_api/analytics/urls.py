from django.urls import path
from .views import AdminStats

urlpatterns = [
    # Full path: /api/analytics/admin/stats/
    path('admin/stats/', AdminStats.as_view(), name='admin-stats'),
]