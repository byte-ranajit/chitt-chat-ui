import Sidebar from "../components/Sidebar";
import ChatWindow from "../components/ChatWindow";
import { useState } from "react";

function Chat() {

    const [selectedUser, setSelectedUser] = useState(null);

    return (
        <div className="flex h-screen bg-gray-900 text-white">
            <Sidebar onSelectUser={setSelectedUser} />
            <ChatWindow selectedUser={selectedUser} />
        </div>
    );
}

export default Chat;