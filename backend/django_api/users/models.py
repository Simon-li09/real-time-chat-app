from django.db import models
from authentication.models import User

class Follow(models.Model):
    follower = models.ForeignKey(User, on_delete=models.CASCADE, related_name="following")
    following = models.ForeignKey(User, on_delete=models.CASCADE, related_name="followers")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('follower', 'following')

class Status(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="statuses")
    media = models.FileField(upload_to='statuses/')
    caption = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    @property
    def is_expired(self):
        from django.utils import timezone
        import datetime
        return timezone.now() > self.created_at + datetime.timedelta(hours=24)

    def __str__(self):
        return f"{self.user.username}'s Status"

class UserSettings(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='settings')
    last_seen = models.BooleanField(default=True)
    read_receipts = models.BooleanField(default=True)
    notifications = models.BooleanField(default=True)
    sound = models.BooleanField(default=True)
    font_size = models.CharField(max_length=10, default='medium') # small, medium, large
    wallpaper = models.CharField(max_length=255, default='default')
    
    def __str__(self):
        return f"Settings for {self.user.username}"
