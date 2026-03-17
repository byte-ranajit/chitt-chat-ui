function MessageBubble({ message }) {

    return (
        <div className={`flex ${message.isMe ? "justify-end" : "justify-start"}`}>
            <div className={`px-4 py-2 rounded-lg max-w-xs ${
                message.isMe ? "bg-green-600" : "bg-gray-700"
            }`}>
                {message.content}
            </div>
        </div>
    );
}

export default MessageBubble;