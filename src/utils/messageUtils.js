export const getMessageTime = (message) =>
  Date.parse(message?.createdAt ?? message?.timestamp ?? message?.sentAt ?? "") || 0;

const pickUserName = (value) => {
  if (!value) return undefined;
  if (typeof value === "string") return value;
  if (typeof value === "object") {
    return (
      value.userName ??
      value.username ??
      value.name ??
      value.id ??
      undefined
    );
  }

  return undefined;
};

export const normalizeMessage = (message) => {
  if (!message || typeof message !== "object") {
    return null;
  }

  const sender =
    pickUserName(message.sender) ??
    message.senderUserName ??
    message.senderUsername ??
    message.fromUserName ??
    message.fromUsername ??
    pickUserName(message.from) ??
    undefined;

  const receiver =
    pickUserName(message.receiver) ??
    message.receiverUserName ??
    message.receiverUsername ??
    message.toUserName ??
    message.toUsername ??
    pickUserName(message.to) ??
    undefined;

  const content =
    message.content ?? message.message ?? message.text ?? message.body ?? "";

  return {
    ...message,
    sender,
    receiver,
    content,
    createdAt:
      message.createdAt ?? message.timestamp ?? message.sentAt ?? undefined,
    timestamp:
      message.timestamp ?? message.createdAt ?? message.sentAt ?? undefined,
  };
};

export const getCounterpartUserName = (message, currentUserName) => {
  if (!message || !currentUserName) {
    return null;
  }

  if (message.sender === currentUserName) {
    return message.receiver ?? null;
  }

  if (message.receiver === currentUserName) {
    return message.sender ?? null;
  }

  return null;
};
