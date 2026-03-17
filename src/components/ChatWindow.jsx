import { useEffect, useState } from "react";
import {getUser} from "../auth/AuthUtils.js";
import {getInbox} from "../api/chatApi.js";
function ChatWindow({ selectedUser }) {

    const [messages, setMessages] = useState([]);
    const currentUser = getUser();

    useEffect(() => {
        if (!selectedUser) return;

        getInbox(currentUser.username).then(data => {

            const filtered = data.filter(msg =>
                (msg.sender === currentUser.username && msg.receiver === selectedUser.username) ||
                (msg.receiver === currentUser.username && msg.sender === selectedUser.username)
            );

            const formatted = filtered.map(msg => ({
                ...msg,
                isMe: msg.sender === currentUser.username
            }));

            setMessages(formatted);
        });

    }, [selectedUser]);

    if (!selectedUser) {
        return <div className="w-3/4 flex items-center justify-center">Select chat</div>;
    }

    return (
        <div className="w-3/4 flex flex-col">

            <div className="p-4 bg-gray-800 border-b">
                {selectedUser.username}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {messages.map((msg, i) => (
                    <MessageBubble key={i} message={msg} />
                ))}
            </div>

            <ChatInput selectedUser={selectedUser} setMessages={setMessages} />

        </div>
    );
}

export default ChatWindow;