from rest_framework import serializers, viewsets, permissions, status, generics
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.views import APIView
from .models import Group, Message, CallLog
from authentication.models import User
from authentication.serializers import UserSerializer

class GroupSerializer(serializers.ModelSerializer):
    admin = UserSerializer(read_only=True)
    members = UserSerializer(many=True, read_only=True)
    member_ids = serializers.ListField(
        child=serializers.IntegerField(), write_only=True, required=False
    )

    class Meta:
        model = Group
        fields = ('id', 'name', 'admin', 'members', 'member_ids', 'created_at')

    def create(self, validated_data):
        member_ids = validated_data.pop('member_ids', [])
        admin = self.context['request'].user
        group = Group.objects.create(admin=admin, **validated_data)
        group.members.add(admin)
        for m_id in member_ids:
            group.members.add(m_id)
        return group

class GroupViewSet(viewsets.ModelViewSet):
    serializer_class = GroupSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Group.objects.filter(members=self.request.user)

    def perform_create(self, serializer):
        serializer.save()

class CallLogSerializer(serializers.ModelSerializer):
    caller = UserSerializer(source='other_user', read_only=True)
    type = serializers.ReadOnlyField(source='call_type')
    other_user_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = CallLog
        fields = ('id', 'caller', 'direction', 'status', 'type', 'created_at', 'other_user_id')

    def create(self, validated_data):
        other_user_id = validated_data.pop('other_user_id')
        other_user = User.objects.get(id=other_user_id)
        call_log = CallLog.objects.create(
            user=self.context['request'].user,
            other_user=other_user,
            **validated_data
        )

        reverse_direction = 'incoming' if validated_data.get('direction') == 'outgoing' else 'outgoing'
        CallLog.objects.create(
            user=other_user,
            other_user=self.context['request'].user,
            direction=reverse_direction,
            call_type=validated_data.get('call_type', 'audio'),
            status=validated_data.get('status', 'calling')
        )

        return call_log

class CallLogListCreateView(generics.ListCreateAPIView):
    serializer_class = CallLogSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return CallLog.objects.filter(user=self.request.user).order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save()

    def perform_update(self, serializer):
        group = self.get_object()
        if group.admin != self.request.user:
            raise permissions.PermissionDenied("Only the group admin can update group settings")
        serializer.save()

    @action(detail=True, methods=['post'])
    def add_members(self, request, pk=None):
        group = self.get_object()
        if group.admin != request.user:
            return Response({"error": "Only admin can add members"}, status=status.HTTP_403_FORBIDDEN)
        
        member_ids = request.data.get('member_ids', [])
        for m_id in member_ids:
            group.members.add(m_id)
        
        return Response(self.get_serializer(group).data)

    @action(detail=True, methods=['post'])
    def remove_member(self, request, pk=None):
        group = self.get_object()
        if group.admin != request.user:
            return Response({"error": "Only admin can remove members"}, status=status.HTTP_403_FORBIDDEN)
        
        member_id = request.data.get('member_id')
        if member_id == group.admin.id:
            return Response({"error": "Admin cannot be removed"}, status=status.HTTP_400_BAD_REQUEST)
            
        group.members.remove(member_id)
        return Response(self.get_serializer(group).data)

    @action(detail=True, methods=['get'])
    def history(self, request, pk=None):
        group = self.get_object()
        messages = Message.objects.filter(group=group).order_by('created_at')
        serializer = MessageSerializer(messages, many=True, context={'request': request})
        return Response(serializer.data)

class MessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.ReadOnlyField(source='sender.username')
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = ('id', 'sender', 'sender_name', 'receiver', 'group', 'message_type', 'message_text', 'file', 'file_url', 'status', 'created_at')

    def get_file_url(self, obj):
        if obj.file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.file.url)
            return obj.file.url
        return None

class MediaUploadView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        file_obj = request.FILES.get('file')
        if not file_obj:
            return Response({"error": "No file provided"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Create a dummy message or just save the file to a temporary Message object
        # Better: create a message with the file but no text yet, or just return the file path if using it later.
        # Let's create a message and return its ID and file_url.
        
        msg = Message.objects.create(
            sender=request.user,
            message_type='image', # Default for upload, can be changed
            file=file_obj,
            status='uploading'
        )
        
        return Response({
            "message_id": msg.id,
            "file_url": request.build_absolute_uri(msg.file.url)
        })

class ChatHistoryView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, user_id):
        # Fetch messages where (sender=me AND receiver=target) OR (sender=target AND receiver=me)
        from django.db.models import Q
        messages = Message.objects.filter(
            (Q(sender=request.user) & Q(receiver_id=user_id)) |
            (Q(sender_id=user_id) & Q(receiver=request.user))
        ).order_by('created_at')
        
        serializer = MessageSerializer(messages, many=True, context={'request': request})
        return Response(serializer.data)
