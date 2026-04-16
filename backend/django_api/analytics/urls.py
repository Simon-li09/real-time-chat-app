from django.urls import path
from .views import AdminStats

urlpatterns = [
    path("admin/stats/", AdminStats.as_view(), name="admin-stats"),
]
