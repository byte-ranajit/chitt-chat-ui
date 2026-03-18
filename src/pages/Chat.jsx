import Sidebar from "../components/Sidebar";
import ChatWindow from "../components/ChatWindow";
import { useState } from "react";
import { getUser, getUserName } from "../auth/AuthUtils";

function Chat() {
    const [selectedUser, setSelectedUser] = useState(null);
    const [latestMessagesByUser, setLatestMessagesByUser] = useState({});
    const currentUserName = getUserName(getUser());

    const getMessageTime = (message) =>
        Date.parse(message?.createdAt ?? message?.timestamp ?? "") || 0;

    const handleMessageActivity = (message) => {
        if (!message || !currentUserName) {
            return;
        }

        const counterpartUserName =
            message.sender === currentUserName ? message.receiver : message.sender;

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
