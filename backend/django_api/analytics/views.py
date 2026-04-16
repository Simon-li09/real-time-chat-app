from django.contrib.auth import get_user_model
from chat_messages.models import Message
from datetime import datetime, timedelta
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions

User = get_user_model()

class AdminStats(APIView):
    permission_classes = [permissions.IsAuthenticated] # Keep it secure by default

    def get(self, request):
        today = datetime.today()
        today_start = datetime(today.year, today.month, today.day)

        total_users = User.objects.count()
        total_messages = Message.objects.count()

        # Assuming User model has a created_at field. 
        # In my implementation, AbstractUser uses 'date_joined'.
        # Let's check the model.
        daily_signups = User.objects.filter(
            date_joined__gte=today_start
        ).count()

        return Response({
            "total_users": total_users,
            "total_messages": total_messages,
            "daily_signups": daily_signups
        })
