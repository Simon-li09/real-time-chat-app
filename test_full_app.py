"""
Full terminal test for the chat app.
Tests: registration, login, messaging, call signaling.
WebRTC media (audio/video) requires a browser - cannot test media from terminal.
"""
import asyncio
import json
import requests
import websockets

API = "http://127.0.0.1:8000"
WS = "ws://127.0.0.1:8000/ws/chat"

users = {}
tokens = {}
ws_conns = []
received = []

async def test_all():
    print("=" * 60)
    print("1. REGISTER TWO USERS")
    print("=" * 60)
    import time
    suffix = int(time.time())
    names = ["alice", "bob"]
    for i, name in enumerate(names):
        username = f"{name}_{suffix}"
        r = requests.post(f"{API}/api/auth/register/", json={
            "username": username, "email": f"{username}@test.com", "password": "pass123"
        })
        status = "OK" if r.status_code == 201 else f"FAIL ({r.status_code})"
        print(f"  Register {name} ({username}): {status}")
        if r.ok:
            users[name] = {"id": None, "username": username, "password": "pass123"}

    print()
    print("=" * 60)
    print("2. LOGIN & GET TOKENS")
    print("=" * 60)
    for name in names:
        r = requests.post(f"{API}/api/auth/login/", json={
            "username": users[name]["username"], "password": users[name]["password"]
        })
        if r.ok:
            data = r.json()
            tokens[name] = data["access"]
            users[name]["id"] = data["user"]["id"]
            print(f"  Login {name}: OK  (id={data['user']['id']})")
        else:
            print(f"  Login {name}: FAIL -> {r.text[:80]}")

    print()
    print("=" * 60)
    print("3. FOLLOW EACH OTHER")
    print("=" * 60)
    for follower, target in [("alice", "bob"), ("bob", "alice")]:
        r = requests.post(f"{API}/api/users/follow/",
            headers={"Authorization": f"Bearer {tokens[follower]}"},
            json={"user_id": users[target]["id"]}
        )
        print(f"  {follower} follows {target}: {'OK' if r.ok else 'FAIL'} -> {r.json()}")

    print()
    print("=" * 60)
    print("4. LIST USERS (as alice)")
    print("=" * 60)
    r = requests.get(f"{API}/api/users/",
        headers={"Authorization": f"Bearer {tokens['alice']}"})
    if r.ok:
        for u in r.json():
            print(f"  - {u['username']} (id={u['id']})")

    print()
    print("=" * 60)
    print("5. WEBSOCKET: Connect both users & send a message")
    print("=" * 60)

    async def connect_user(name):
        uid = users[name]["id"]
        ws = await websockets.connect(f"{WS}/{uid}/")
        ws_conns.append(ws)
        print(f"  {name} WebSocket connected (user_id={uid})")

        async def listener():
            async for msg in ws:
                data = json.loads(msg)
                t = data.get("type", "?")
                if t == "online_status":
                    print(f"  [{name}] presence: user {data.get('user_id')} {'online' if data.get('is_online') else 'offline'}")
                elif t == "message_sent":
                    print(f"  [{name}] message SENT confirmed: id={data['data']['id']} text='{data['data']['message_text']}'")
                elif t == "receive_message":
                    print(f"  [{name}] message RECEIVED from {data['data'].get('sender_name')}: '{data['data'].get('message_text')}'")
                elif t == "rtc_signal":
                    s = data.get("signal", {})
                    print(f"  [{name}] RTC SIGNAL received from user {data.get('from')}: type={s.get('type')}")
                else:
                    print(f"  [{name}] event: {t}")

        asyncio.create_task(listener())
        await asyncio.sleep(0.3)

    await connect_user("alice")
    await connect_user("bob")
    await asyncio.sleep(1)

    # Alice sends a message to Bob
    alice_ws = ws_conns[0]
    await alice_ws.send(json.dumps({
        "type": "send_message",
        "receiver_id": users["bob"]["id"],
        "message": "Hello Bob! Testing from terminal."
    }))
    await asyncio.sleep(1)

    print()
    print("=" * 60)
    print("6. WEBSOCKET: Test RTC call signaling (offer/answer cycle)")
    print("=" * 60)
    print("  Simulating WebRTC offer from alice -> bob...")

    await alice_ws.send(json.dumps({
        "type": "rtc_signal",
        "to": users["bob"]["id"],
        "signal": {
            "type": "offer",
            "offer": {"type": "offer", "sdp": "v=0\no=- 123 2 IN IP4 127.0.0.1\n..."}
        }
    }))
    await asyncio.sleep(1)

    bob_ws = ws_conns[1]
    await bob_ws.send(json.dumps({
        "type": "rtc_signal",
        "to": users["alice"]["id"],
        "signal": {
            "type": "answer",
            "answer": {"type": "answer", "sdp": "v=0\no=- 456 2 IN IP4 127.0.0.1\n..."}
        }
    }))
    await asyncio.sleep(1)

    # ICE candidates
    await alice_ws.send(json.dumps({
        "type": "rtc_signal",
        "to": users["bob"]["id"],
        "signal": {
            "type": "candidate",
            "candidate": {"candidate": "candidate:1 1 UDP 2122252543 192.168.1.1 54321 typ host"}
        }
    }))
    await asyncio.sleep(0.5)

    await bob_ws.send(json.dumps({
        "type": "rtc_signal",
        "to": users["alice"]["id"],
        "signal": {
            "type": "candidate",
            "candidate": {"candidate": "candidate:1 1 UDP 2122252543 192.168.1.2 54322 typ host"}
        }
    }))
    await asyncio.sleep(0.5)

    # End call
    await alice_ws.send(json.dumps({
        "type": "rtc_signal",
        "to": users["bob"]["id"],
        "signal": {"type": "end"}
    }))
    await asyncio.sleep(0.5)

    print()
    print("=" * 60)
    print("7. CHECK CALL LOG")
    print("=" * 60)
    r = requests.get(f"{API}/api/messages/call-logs/",
        headers={"Authorization": f"Bearer {tokens['alice']}"})
    if r.ok:
        logs = r.json() if isinstance(r.json(), list) else [r.json()]
        for log in logs:
            print(f"  Call: {log.get('direction')} {log.get('type')} with {log.get('caller', {}).get('username', '?')} - {log.get('status')}")

    print()
    print("=" * 60)
    print("8. GET CHAT HISTORY (alice <-> bob)")
    print("=" * 60)
    r = requests.get(f"{API}/api/messages/{users['bob']['id']}/",
        headers={"Authorization": f"Bearer {tokens['alice']}"})
    if r.ok:
        msgs = r.json() if isinstance(r.json(), list) else []
        for m in msgs:
            print(f"  [{m.get('created_at')}] {m.get('sender_name')}: {m.get('message_text')}")

    print()
    print("=" * 60)
    print("DONE! Clean up WebSocket connections...")
    print("=" * 60)
    for ws in ws_conns:
        await ws.close()

if __name__ == "__main__":
    asyncio.run(test_all())
