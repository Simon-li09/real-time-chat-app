from rest_framework import generics, status, serializers, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Q
from authentication.models import User
from authentication.serializers import UserSerializer
from .models import Follow, Status

class StatusSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    media_url = serializers.SerializerMethodField()

    class Meta:
        model = Status
        fields = ('id', 'user', 'media', 'media_url', 'caption', 'created_at')

    def get_media_url(self, obj):
        if obj.media:
            request = self.context.get('request')
            return request.build_absolute_uri(obj.media.url) if request else obj.media.url
        return None

class StatusListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        # Return statuses from people the user follows, plus their own
        following_ids = Follow.objects.filter(follower=request.user).values_list('following_id', flat=True)
        user_ids = list(following_ids) + [request.user.id]
        
        from django.utils import timezone
        import datetime
        day_ago = timezone.now() - datetime.timedelta(hours=24)
        
        statuses = Status.objects.filter(user_id__in=user_ids, created_at__gt=day_ago).order_by('-created_at')
        serializer = StatusSerializer(statuses, many=True, context={'request': request})
        return Response(serializer.data)

    def post(self, request):
        file_obj = request.FILES.get('media')
        caption = request.data.get('caption', '')
        if not file_obj:
            return Response({"error": "Media required"}, status=400)
        
        status_obj = Status.objects.create(user=request.user, media=file_obj, caption=caption)
        serializer = StatusSerializer(status_obj, context={'request': request})
        return Response(serializer.data, status=201)

class UserListView(generics.ListAPIView):
    serializer_class = UserSerializer

    def get_queryset(self):
        return User.objects.exclude(id=self.request.user.id)

class UserSearchView(APIView):
    def get(self, request):
        query = request.query_params.get('q')
        if not query:
            return Response({"error": "Query parameter 'q' is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        users = User.objects.filter(
            Q(username__icontains=query) | Q(email__icontains=query)
        ).exclude(id=request.user.id)[:10]
        
        total_users = User.objects.count()
        print(f"DEBUG: Search Query='{query}', Found={len(users)}, Total Users in DB={total_users}")
        
        return Response(UserSerializer(users, many=True, context={'request': request}).data)

class FollowUserView(APIView):
    def post(self, request):
        user_id = request.data.get('user_id')
        if not user_id:
            return Response({"error": "user_id is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        if int(user_id) == request.user.id:
            return Response({"error": "You cannot follow yourself"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            target_user = User.objects.get(id=user_id)
            follow_rel = Follow.objects.filter(follower=request.user, following=target_user)
            
            if follow_rel.exists():
                follow_rel.delete()
                return Response({"message": f"Unfollowed {target_user.username}", "following": False})
            else:
                Follow.objects.create(follower=request.user, following=target_user)
                
                # Real-time notification to the target user
                from channels.layers import get_channel_layer
                from asgiref.sync import async_to_sync
                channel_layer = get_channel_layer()
                async_to_sync(channel_layer.group_send)(
                    f'user_{target_user.id}',
                    {
                        'type': 'relationship_update',
                        'sender_id': request.user.id,
                        'update_type': 'follow'
                    }
                )
                
                return Response({"message": f"Following {target_user.username}", "following": True})
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

from .models import Follow, Status, UserSettings
from .serializers import UserSettingsSerializer, StatusSerializer

class StatusListCreateView(generics.ListCreateAPIView):
    serializer_class = StatusSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Return statuses from users the current user follows + their own
        followed_ids = Follow.objects.filter(follower=self.request.user).values_list('following_id', flat=True)
        relevant_user_ids = list(followed_ids) + [self.request.user.id]
        
        # Filter out expired statuses (older than 24h)
        from django.utils import timezone
        import datetime
        day_ago = timezone.now() - datetime.timedelta(hours=24)
        
        return Status.objects.filter(
            user_id__in=relevant_user_ids,
            created_at__gte=day_ago
        ).order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class SettingsUpdateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        settings_obj, created = UserSettings.objects.get_or_create(user=request.user)
        serializer = UserSettingsSerializer(settings_obj)
        return Response(serializer.data)

    def put(self, request):
        settings_obj, created = UserSettings.objects.get_or_create(user=request.user)
        
        # Profile specific updates
        if 'name' in request.data:
            request.user.first_name = request.data['name'] # Using first_name as "Display Name" for MVP
            request.user.save()
        if 'about' in request.data:
            request.user.bio = request.data['about']
            request.user.save()
        if 'avatar' in request.FILES:
            request.user.profile_picture = request.FILES['avatar']
            request.user.save()

        # Settings specific updates (privacy, chats, notifications)
        serializer = UserSettingsSerializer(settings_obj, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            # Return full updated user data for frontend sync
            from authentication.serializers import UserSerializer
            return Response(UserSerializer(request.user, context={'request': request}).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class LogoutView(APIView):
    def post(self, request):
        return Response({"message": "Logged out successfully"})

class FollowedUsersListView(generics.ListAPIView):
    serializer_class = UserSerializer

    def get_queryset(self):
        followed_ids = Follow.objects.filter(follower=self.request.user).values_list('following_id', flat=True)
        return User.objects.filter(id__in=followed_ids)
