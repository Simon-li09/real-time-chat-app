from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    profile_picture = models.ImageField(upload_to='profile_pics/', null=True, blank=True)
    bio = models.TextField(max_length=500, blank=True)
    follows = models.ManyToManyField('self', symmetrical=False, related_name='followers_deprecated', blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.username
