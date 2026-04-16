from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions

class HealthCheck(APIView):
    permission_classes = [permissions.AllowAny]
    def get(self, request):
        return Response({
            "status": "ok",
            "service": "chat-backend"
        })

def api_root(request):
    return JsonResponse({
        "message": "Real-Time Messaging API is running",
        "version": "1.1.0",
        "endpoints": {
            "health": "/api/health/",
            "auth": "/api/auth/",
            "users": "/api/users/",
            "messages": "/api/messages/",
            "analytics": "/api/analytics/admin/stats/"
        }
    })

from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('', api_root, name='api-root'),
    path('api/health/', HealthCheck.as_view(), name='health-check'),
    path('admin/', admin.site.urls),
    path('api/auth/', include('authentication.urls')),
    path('api/users/', include('users.urls')),
    path('api/messages/', include('chat_messages.urls')),
    path('api/analytics/', include('analytics.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
