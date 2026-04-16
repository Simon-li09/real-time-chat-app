from .models import UserSettings, Status
from rest_framework import serializers

class StatusSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    user_avatar = serializers.ImageField(source='user.profile_picture', read_only=True)

    class Meta:
        model = Status
        fields = ('id', 'user', 'username', 'user_avatar', 'media', 'caption', 'created_at', 'is_expired')
        read_only_fields = ('user',)

class UserSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserSettings
        fields = ('last_seen', 'read_receipts', 'notifications', 'sound', 'font_size', 'wallpaper')

# I'll also add a view for it soon.
