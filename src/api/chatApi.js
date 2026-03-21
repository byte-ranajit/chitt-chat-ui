import authApi from "../api/authApi";

async function requestData(request, errorLabel) {
  try {
    const response = await request();
    return response.data;
  } catch (error) {
    console.error(`${errorLabel}:`, error);
    throw error;
  }
}

async function requestVoid(request, errorLabel) {
  try {
    await request();
  } catch (error) {
    console.error(`${errorLabel}:`, error);
    throw error;
  }
}

export const sendMessage = (message) =>
  requestData(() => authApi.post("/messages/send", message), "Send message error");

export const getInbox = (userName) =>
  requestData(() => authApi.get(`/messages/inbox/${userName}`), "Inbox fetch error");

export const getAllMessages = () =>
  requestData(() => authApi.get("/messages"), "Get messages error");

export const markAsRead = (messageId) =>
  requestVoid(() => authApi.post(`/messages/${messageId}/read`), "Mark as read error");

export const getUsers = () =>
  requestData(() => authApi.get("/user"), "Get users error");
