# TODO

- [ ] Step 1: Fix presence/online “connected users” leak
  - [x] Update `backend/django_api/chat_messages/consumers.py` to send presence updates only to users the sender is allowed to see (based on Follow/added users).
  - [x] Remove/avoid global `presence_broadcast` group for online events.


- [ ] Step 2: Enforce DM restriction (“only message users you added”)
  - [ ] Update `handle_send_message` in `backend/django_api/chat_messages/consumers.py` to validate receiver_id against allowed added users.

- [ ] Step 3: Fix media rendering (images + videos)
  - [ ] Update backend websocket message saving so image/video URLs are stored/serialized consistently.
  - [ ] Update `frontend/src/components/MessageBubble.jsx` to render `message_type === 'video'`.
  - [ ] Ensure frontend uses correct MEDIA URL base for `profile_picture`, images, and video.

- [ ] Step 4: Harden WebRTC answer/voice-call answer behavior
  - [ ] Update `frontend/src/components/CallModal.jsx` to prevent Accept until offer is applied (remoteDescription present).
  - [ ] Verify/adjust `rtc_signal` routing payload expectations between `CallModal.jsx` and `backend/django_api/chat_messages/consumers.py`.

- [ ] Step 5: Settings/UI fixes
  - [ ] Verify settings logout button works and settings profile image is clickable where required.
  - [ ] Add “Add user by username” button + backend endpoint for adding users.
  - [ ] Ensure all user accounts are persisted (admin-only delete; non-deleted users remain).


