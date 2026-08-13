import { requestClient } from '#/api/request';

export interface MessageUser {
  avatar: string;
  id: number;
  nickname: string;
  username: string;
}

export interface DirectMessage {
  content: string;
  created_at: string;
  id: string;
  read_at: null | string;
  receiver: MessageUser;
  receiver_id: number;
  sender: MessageUser;
  sender_id: number;
  sequence: number;
}

export interface MessageConversation {
  last_message: DirectMessage;
  peer: MessageUser;
  unread_count: number;
}

export interface MessageHistoryResult {
  has_more: boolean;
  list: DirectMessage[];
  next_cursor: null | number;
}

export interface WebSocketTicket {
  expires_in: number;
  ticket: string;
}

export function createMessageWebSocketTicketApi() {
  return requestClient.post<WebSocketTicket>('/system/message/ticket');
}

export async function getMessageUsersApi() {
  const data = await requestClient.get<MessageUser[] | null>(
    '/system/message/users',
  );
  return data ?? [];
}

export async function getMessageConversationsApi() {
  const data = await requestClient.get<MessageConversation[] | null>(
    '/system/message/conversations',
  );
  return data ?? [];
}

export function getMessageUnreadApi() {
  return requestClient.get<{ count: number }>('/system/message/unread');
}

export function getMessageHistoryApi(
  peerId: number,
  params?: { before?: number; limit?: number },
) {
  return requestClient.get<MessageHistoryResult>(
    `/system/message/history/${peerId}`,
    { params },
  );
}

export function markMessageConversationReadApi(peerId: number) {
  return requestClient.post<{
    message_ids: string[];
    read_at: null | string;
  }>(`/system/message/read/${peerId}`);
}
