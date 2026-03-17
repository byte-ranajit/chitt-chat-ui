import { useState } from "react";
import {getUser} from "../auth/AuthUtils.js";
import {sendMessage} from "../api/chatApi.js";

function ChatInput({ selectedUser, setMessages }) {

    const [text, setText] = useState("");
    const currentUser = getUser();

    const handleSend = async () => {

        if (!text.trim()) return;

        const newMsg = {
            content: text,
            sender: currentUser.username,
            receiver: selectedUser.username
        };

        const res = await sendMessage(newMsg);

        setMessages(prev => [...prev, {
            ...res,
            isMe: true
        }]);

        setText("");
    };

    return (
        <div className="flex p-3 bg-gray-800">

            <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="flex-1 p-2 bg-gray-700 rounded outline-none"
                placeholder="Type a message..."
            />

            <button
                onClick={handleSend}
                className="ml-2 px-4 bg-green-600 rounded"
            >
                Send
            </button>

        </div>
    );
}

export default ChatInput;