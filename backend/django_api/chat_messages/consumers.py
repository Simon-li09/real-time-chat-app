import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.core.cache import cache
from .models import Message, Group
from authentication.models import User
from users.models import Follow
from .views import MessageSerializer # We'll need to make sure this is accessible or use a local one

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user_id = self.scope['url_route']['kwargs']['user_id']
        self.room_group_name = f'user_{self.user_id}'

        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        
        # Join global presence group
        await self.channel_layer.group_add(
            'presence_broadcast',
            self.channel_name
        )

        await self.accept()

        # Mark user as online and broadcast
        await self.update_user_status(True)
        await self.broadcast_presence(True)

    async def disconnect(self, close_code):
        # Leave room groups
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
        await self.channel_layer.group_discard(
            'presence_broadcast',
            self.channel_name
        )

        # Mark user as offline
        await self.update_user_status(False)
        await self.broadcast_presence(False)

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
        except json.JSONDecodeError:
            await self.send_error("Invalid JSON format")
            return

        event_type = data.get('type')
        if not event_type:
            await self.send_error("Missing event type")
            return

        handlers = {
            'send_message': self.handle_send_message,
            'typing': self.handle_typing,
            'message_read': self.handle_message_read,
            'rtc_signal': self.handle_rtc_signal
        }

        handler = handlers.get(event_type)
        if handler:
            await handler(data)
        else:
            await self.send_error(f"Unknown event type: {event_type}")

    async def handle_send_message(self, data):
        receiver_id = data.get('receiver_id')
        group_id = data.get('group_id')
        message_text = data.get('message', '').strip()
        message_type = data.get('message_type', 'text')
        file_url = data.get('file_url')

        if not message_text and not file_url:
            await self.send_error("Message content cannot be empty")
            return

        # Messaging restriction checks
        if receiver_id:
            is_mutual = await self.is_mutual_following(self.user_id, receiver_id)
            if not is_mutual:
                await self.send_error("Messaging restricted: Both users must follow each other", code="RESTRICTED_MUTUAL")
                return
        elif group_id:
            members = await self.get_group_members(group_id)
            if int(self.user_id) not in members:
                await self.send_error("Messaging restricted: You are not a member of this group", code="RESTRICTED_GROUP")
                return
        else:
            await self.send_error("Missing recipient: specify receiver_id or group_id")
            return

        # Save and Broadcast
        message_data = await self.save_message(
            sender_id=self.user_id,
            receiver_id=receiver_id,
            group_id=group_id,
            text=message_text,
            msg_type=message_type,
            file_url=file_url
        )

        if message_data:
            # Broadcast to recipient(s)
            if group_id:
                members = await self.get_group_members(group_id)
                for member_id in members:
                    if str(member_id) != str(self.user_id):
                        await self.channel_layer.group_send(f'user_{member_id}', {'type': 'relay_message', 'data': message_data})
            else:
                await self.channel_layer.group_send(f'user_{receiver_id}', {'type': 'relay_message', 'data': message_data})

            # Confirm to sender
            await self.send_json({'type': 'message_sent', 'data': message_data})

    async def handle_typing(self, data):
        receiver_id = data.get('receiver_id')
        group_id = data.get('group_id')
        is_typing = data.get('is_typing', False)

        payload = {
            'type': 'relay_typing',
            'sender_id': self.user_id,
            'is_typing': is_typing,
            'group_id': group_id
        }

        if group_id:
            members = await self.get_group_members(group_id)
            for member_id in members:
                if str(member_id) != str(self.user_id):
                    await self.channel_layer.group_send(f'user_{member_id}', payload)
        elif receiver_id:
            await self.channel_layer.group_send(f'user_{receiver_id}', payload)

    async def handle_message_read(self, data):
        message_id = data.get('message_id')
        sender_id = data.get('sender_id')
        if not message_id or not sender_id: return

        await self.update_message_status_read(message_id)
        await self.channel_layer.group_send(
            f'user_{sender_id}',
            {
                'type': 'relay_status',
                'message_id': message_id,
                'status': 'read'
            }
        )

    async def handle_rtc_signal(self, data):
        receiver_id = data.get('to')
        if not receiver_id: return
        
        await self.channel_layer.group_send(
            f'user_{receiver_id}',
            {
                'type': 'relay_rtc',
                'from': self.user_id,
                'signal': data.get('signal')
            }
        )

    # Relay Handlers (Group/Room distribution)
    async def relay_message(self, event):
        await self.send_json({'type': 'receive_message', 'data': event['data']})

    async def relay_typing(self, event):
        await self.send_json({
            'type': 'typing_status',
            'sender_id': event['sender_id'],
            'is_typing': event['is_typing'],
            'group_id': event.get('group_id')
        })

    async def relay_status(self, event):
        await self.send_json({
            'type': 'message_status',
            'message_id': event['message_id'],
            'status': event['status']
        })

    async def relay_rtc(self, event):
        await self.send_json({
            'type': 'rtc_signal',
            'from': event['from'],
            'signal': event['signal']
        })

    async def presence_update(self, event):
        await self.send_json({
            'type': 'online_status',
            'user_id': event['user_id'],
            'is_online': event['is_online']
        })

    # Helpers
    async def send_json(self, data):
        await self.send(text_data=json.dumps(data))

    async def send_error(self, message, code="ERROR"):
        await self.send_json({'type': 'error', 'message': message, 'code': code})

    async def broadcast_presence(self, is_online):
        await self.channel_layer.group_send(
            'presence_broadcast',
            {
                'type': 'presence_update',
                'user_id': self.user_id,
                'is_online': is_online
            }
        )

    # Database Sync Methods
    @database_sync_to_async
    def update_user_status(self, is_online):
        key = f"user_online_{self.user_id}"
        if is_online:
            cache.set(key, True, timeout=None)
        else:
            cache.delete(key)

    @database_sync_to_async
    def is_mutual_following(self, user1_id, user2_id):
        f1 = Follow.objects.filter(follower_id=user1_id, following_id=user2_id).exists()
        f2 = Follow.objects.filter(follower_id=user2_id, following_id=user1_id).exists()
        return f1 and f2

    @database_sync_to_async
    def get_group_members(self, group_id):
        try:
            group = Group.objects.get(id=group_id)
            return list(group.members.values_list('id', flat=True))
        except Group.DoesNotExist:
            return []

    @database_sync_to_async
    def save_message(self, sender_id, receiver_id, group_id, text, msg_type='text', file_url=None):
        try:
            sender = User.objects.get(id=sender_id)
            receiver = User.objects.get(id=receiver_id) if receiver_id else None
            group = Group.objects.get(id=group_id) if group_id else None
            
            content = file_url if msg_type != 'text' and file_url else text
            
            msg = Message.objects.create(
                sender=sender, 
                receiver=receiver, 
                group=group,
                message_type=msg_type,
                message_text=content
            )
            
            # Using partial data directly to avoid circular dependency with views/serializers
            # or we could move MessageSerializer to a dedicated file.
            # For robustness, let's just construct the return payload clearly.
            return {
                'id': msg.id,
                'sender_id': int(sender_id),
                'receiver_id': int(receiver_id) if receiver_id else None,
                'group_id': int(group_id) if group_id else None,
                'message_type': msg_type,
                'message_text': content,
                'file_url': file_url,
                'sender_name': sender.username,
                'created_at': msg.created_at.isoformat(),
                'status': msg.status
            }
        except Exception as e:
            print(f"ERROR saving message: {e}")
            return None

    @database_sync_to_async
    def update_message_status_read(self, message_id):
        Message.objects.filter(id=message_id).update(status='read')
