# Chat App (React + Vite) — Real-time Messaging with STOMP + SockJS

This project uses React for the frontend and is configured for **real-time chat** using:

- **WebSocket + STOMP** on the frontend (`@stomp/stompjs` + `sockjs-client`)
- **Spring Boot WebSocket broker** on the backend (`@EnableWebSocketMessageBroker`)
- **User-specific queues** (`/user/{username}/queue/messages`) so messages are delivered to the right recipient

---

## Why WebSocket is better than polling for chat

Polling (`setInterval`) repeatedly asks the server for updates even when there are no new messages.
For chat apps this causes unnecessary load and delayed UX.

WebSocket gives you:

- **Instant delivery**: server pushes new messages immediately
- **Lower server pressure**: no repeated HTTP requests every few seconds
- **Lower bandwidth usage**: only real events are sent
- **Better UX**: near WhatsApp-like live messaging

This codebase removes polling and uses a persistent STOMP connection instead.

---

## Frontend setup (React)

### 1) Install dependencies

```bash
npm install @stomp/stompjs sockjs-client
```

### 2) WebSocket hook (`src/api/useChatSocket.js`)

The app uses a dedicated hook that:

- Creates a STOMP client over SockJS
- Uses token auth in `connectHeaders`
- Subscribes to `/user/queue/messages`
- Handles reconnect (`reconnectDelay`)
- Parses incoming JSON safely
- Cleans up on unmount

Environment variables you can configure:

- `VITE_API_BASE_URL` (default: `http://localhost:8080`)
- `VITE_SOCKJS_PATH` (default: `/chat`)

### 3) Integrate into chat component

`ChatWindow` connects through `useChatSocket(currentUser, onMessageReceived)` and appends incoming messages for the active conversation.
It also:

- Deduplicates messages
- Maintains per-conversation state
- Auto-scrolls on new messages
- Sends messages through REST persistence and then updates UI immediately

---

## Backend setup (Spring Boot)

### 1) Enable STOMP broker

```java
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.enableSimpleBroker("/topic", "/queue");
        registry.setApplicationDestinationPrefixes("/app");
        registry.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/chat")
                .setAllowedOriginPatterns("*")
                .withSockJS();
    }
}
```

### 2) Send private user-to-user messages

```java
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
public class ChatSocketService {

    private final SimpMessagingTemplate messagingTemplate;

    public ChatSocketService(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    public void sendToUser(String receiverUsername, ChatMessageDto payload) {
        messagingTemplate.convertAndSendToUser(
            receiverUsername,
            "/queue/messages",
            payload
        );
    }
}
```

With this setup, user `john` receives messages on:

- `/user/queue/messages` (frontend subscription)

Spring maps that based on the authenticated principal.

---

## Connection handling checklist

Implemented in the frontend hook:

- ✅ automatic reconnect (`reconnectDelay`)
- ✅ heartbeat in/out
- ✅ broker + websocket error logs
- ✅ safe payload parsing
- ✅ teardown (`client.deactivate()`) on component unmount

---

## Run

```bash
npm install
npm run dev
```

Make sure your Spring Boot backend is running and exposes SockJS endpoint at `/chat`.
