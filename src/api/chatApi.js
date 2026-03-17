import authApi from "../api/authApi";

export const sendMessage = async (message) => {
  try {
    const res = await authApi.post("/messages/send", message);
    return res.data;
  } catch (error) {
    console.error("Send message error:", error);
    throw error;
  }
};

export const getInbox = async (username) => {
  try {
    const res = await authApi.get(`/messages/inbox/${username}`);
    return res.data;
  } catch (error) {
    console.error("Inbox fetch error:", error);
    throw error;
  }
};

export const getAllMessages = async () => {
  try {
    const res = await authApi.get("/messages");
    return res.data;
  } catch (error) {
    console.error("Get messages error:", error);
    throw error;
  }
};

export const markAsRead = async (messageId) => {
  try {
    await authApi.post(`/messages/${messageId}/read`);
  } catch (error) {
    console.error("Mark as read error:", error);
    throw error;
  }
};

export const getUsers = async () => {
  try {
    const res = await authApi.get("/user");
    return res.data;
  } catch (error) {
    console.error("Get users error:", error);
    throw error;
  }
};
