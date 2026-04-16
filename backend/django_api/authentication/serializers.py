from rest_framework import serializers
from .models import User

from django.db.models import Q
from chat_messages.models import Message
from users.models import Follow

class UserSerializer(serializers.ModelSerializer):
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()
    is_following = serializers.SerializerMethodField()
    is_followed_by = serializers.SerializerMethodField()
    settings = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'profile_picture', 'bio', 'last_message', 'unread_count', 'is_following', 'is_followed_by', 'settings')

    def get_settings(self, obj):
        from users.serializers import UserSettingsSerializer
        try:
            # Get or create settings for the user
            from users.models import UserSettings
            settings_obj, created = UserSettings.objects.get_or_create(user=obj)
            return UserSettingsSerializer(settings_obj).data
        except Exception:
            return None

    def get_is_following(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        return Follow.objects.filter(follower=request.user, following=obj).exists()

    def get_is_followed_by(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        return Follow.objects.filter(follower=obj, following=request.user).exists()

    def get_last_message(self, obj):
        try:
            request = self.context.get('request')
            if not request or not request.user.is_authenticated:
                return None
            last_msg = Message.objects.filter(
                (Q(sender=request.user) & Q(receiver=obj)) |
                (Q(sender=obj) & Q(receiver=request.user))
            ).order_by('-created_at').first()
            if last_msg:
                return {
                    'text': last_msg.message_text,
                    'created_at': last_msg.created_at.isoformat(),
                    'status': last_msg.status
                }
        except Exception as e:
            print(f"Error in get_last_message: {e}")
        return None

    def get_unread_count(self, obj):
        try:
            request = self.context.get('request')
            if not request or not request.user.is_authenticated:
                return 0
            return Message.objects.filter(
                sender=obj,
                receiver=request.user,
                status__in=['sent', 'delivered']
            ).count()
        except Exception as e:
            print(f"Error in get_unread_count: {e}")
            return 0

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('username', 'email', 'password')

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password']
        )
        return user
