import Sidebar from "../components/Sidebar";
import ChatWindow from "../components/ChatWindow";
import { useState } from "react";
import { getUser, getUserName } from "../auth/AuthUtils";
import {
    getCounterpartUserName,
    getMessageTime,
    normalizeMessage,
} from "../utils/messageUtils";

function Chat() {
    const [selectedUser, setSelectedUser] = useState(null);
    const [latestMessagesByUser, setLatestMessagesByUser] = useState({});
    const currentUserName = getUserName(getUser());

    const handleMessageActivity = (incomingMessage) => {
        const message = normalizeMessage(incomingMessage);

        if (!message || !currentUserName) {
            return;
        }

        const counterpartUserName = getCounterpartUserName(message, currentUserName);

        if (!counterpartUserName) {
            return;
        }

        setLatestMessagesByUser((prev) => {
            const previousMessage = prev[counterpartUserName];

            if (
                previousMessage &&
                getMessageTime(previousMessage) > getMessageTime(message)
            ) {
                return prev;
            }

            return {
                ...prev,
                [counterpartUserName]: message,
            };
        });
    };

    return (
        <div className="flex h-screen bg-gray-900 text-white">
            <Sidebar
                onSelectUser={setSelectedUser}
                latestMessagesByUser={latestMessagesByUser}
                currentUserName={currentUserName}
                onInitialMessagesLoaded={setLatestMessagesByUser}
            />
            <ChatWindow
                selectedUser={selectedUser}
                onMessageActivity={handleMessageActivity}
            />
        </div>
    );
}

export default Chat;
