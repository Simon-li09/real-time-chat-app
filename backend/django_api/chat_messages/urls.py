from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ChatHistoryView, GroupViewSet, MediaUploadView, CallLogListCreateView

router = DefaultRouter()
router.register(r'groups', GroupViewSet, basename='group')

urlpatterns = [
    path('', include(router.urls)),
    path('upload/', MediaUploadView.as_view(), name='media-upload'),
    path('call-logs/', CallLogListCreateView.as_view(), name='call-log-list'),
    path('<int:user_id>/', ChatHistoryView.as_view(), name='chat-history'),
]
