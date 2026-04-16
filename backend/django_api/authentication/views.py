from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from .serializers import RegisterSerializer, UserSerializer
from .models import User

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        print(f"--- LOGIN ATTEMPT: {attrs.get('username')} ---")
        username = attrs.get("username")
        if "@" in username:
            try:
                user = User.objects.get(email=username)
                attrs["username"] = user.username
                print(f"Recognized email login for: {user.username}")
            except User.DoesNotExist:
                print("Email not found in DB")
                pass

        try:
            data = super().validate(attrs)
            print("Login successful")
            data['user'] = {
                'id': self.user.id,
                'username': self.user.username,
                'email': self.user.email,
                'profile_picture': self.user.profile_picture.url if self.user.profile_picture else None,
                'bio': self.user.bio
            }
            return data
        except Exception as e:
            print(f"Login failed error: {str(e)}")
            raise e

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer
    permission_classes = [permissions.AllowAny]

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (permissions.AllowAny,)
    serializer_class = RegisterSerializer

    def post(self, request, *args, **kwargs):
        print(f"--- REGISTER ATTEMPT: {request.data.get('username')} ---")
        return super().post(request, *args, **kwargs)

class ProfileUpdateView(generics.UpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

class MeView(generics.RetrieveAPIView):
    serializer_class = UserSerializer
    
    def get_object(self):
        return self.request.user
