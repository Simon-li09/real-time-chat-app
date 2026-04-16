from django.db import models
from authentication.models import User

class Group(models.Model):
    name = models.CharField(max_length=255)
    admin = models.ForeignKey(User, on_delete=models.CASCADE, related_name="managed_groups")
    members = models.ManyToManyField(User, related_name="chat_groups")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class Message(models.Model):
    MESSAGE_TYPES = (
        ('text', 'Text'),
        ('image', 'Image'),
        ('voice', 'Voice'),
        ('video', 'Video'),
    )
    
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_messages')
    receiver = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_messages', null=True, blank=True)
    group = models.ForeignKey(Group, on_delete=models.CASCADE, related_name='messages', null=True, blank=True)
    
    message_type = models.CharField(max_length=10, choices=MESSAGE_TYPES, default='text')
    message_text = models.TextField(blank=True)
    file = models.FileField(upload_to='chat_media/', null=True, blank=True)
    
    status = models.CharField(max_length=20, default='sent', choices=[
        ('sent', 'Sent'),
        ('delivered', 'Delivered'),
        ('read', 'Read')
    ])
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.sender.username} to {self.receiver.username}: {self.message_text[:20]}"

class CallLog(models.Model):
    DIRECTION_CHOICES = (
        ('incoming', 'Incoming'),
        ('outgoing', 'Outgoing'),
    )
    CALL_TYPE_CHOICES = (
        ('audio', 'Audio'),
        ('video', 'Video'),
    )
    STATUS_CHOICES = (
        ('calling', 'Calling'),
        ('connected', 'Connected'),
        ('missed', 'Missed'),
        ('ended', 'Ended'),
    )

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='call_logs')
    other_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='other_call_logs')
    direction = models.CharField(max_length=10, choices=DIRECTION_CHOICES)
    call_type = models.CharField(max_length=10, choices=CALL_TYPE_CHOICES, default='audio')
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='calling')
    created_at = models.DateTimeField(auto_now_add=True)
    ended_at = models.DateTimeField(null=True, blank=True)
    duration_seconds = models.PositiveIntegerField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} {self.direction} {self.other_user.username} ({self.status})"
