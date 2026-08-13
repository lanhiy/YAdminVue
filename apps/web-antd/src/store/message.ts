import type {
  DirectMessage,
  MessageConversation,
  MessageHistoryResult,
  MessageUser,
} from '#/api';

import { ref } from 'vue';

import { useAppConfig } from '@vben/hooks';
import { useUserStore } from '@vben/stores';

import { defineStore } from 'pinia';

import {
  createMessageWebSocketTicketApi,
  getMessageConversationsApi,
  getMessageHistoryApi,
  getMessageUnreadApi,
  getMessageUsersApi,
  markMessageConversationReadApi,
} from '#/api';

type MessageSocketEvent = {
  data?: Record<string, any>;
  type: string;
};

const { apiURL } = useAppConfig(import.meta.env, import.meta.env.PROD);

export const useMessageStore = defineStore('message', () => {
  const activePeerId = ref<null | number>(null);
  const connected = ref(false);
  const conversations = ref<MessageConversation[]>([]);
  const history = ref<DirectMessage[]>([]);
  const historyLoading = ref(false);
  const started = ref(false);
  const unreadCount = ref(0);
  const users = ref<MessageUser[]>([]);

  let heartbeatTimer: number | undefined;
  let reconnectTimer: number | undefined;
  let socket: undefined | WebSocket;
  let reconnectAttempts = 0;
  let stopped = false;

  function currentUserId() {
    return Number(
      (useUserStore().userInfo as null | { user_id?: number })?.user_id || 0,
    );
  }

  function createClientId() {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      return crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function getWebSocketUrl(ticket: string) {
    const api = new URL(apiURL, window.location.origin);
    api.protocol = api.protocol === 'https:' ? 'wss:' : 'ws:';
    api.pathname = `${api.pathname.replace(/\/$/, '')}/ws/messages`;
    api.search = new URLSearchParams({ ticket }).toString();
    return api.toString();
  }

  function clearConnectionTimers() {
    if (heartbeatTimer !== undefined) {
      window.clearInterval(heartbeatTimer);
      heartbeatTimer = undefined;
    }
    if (reconnectTimer !== undefined) {
      window.clearTimeout(reconnectTimer);
      reconnectTimer = undefined;
    }
  }

  function sendSocketEvent(type: string, data: Record<string, unknown> = {}) {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      return false;
    }
    socket.send(JSON.stringify({ type, data }));
    return true;
  }

  function sortConversations() {
    conversations.value = [...(conversations.value ?? [])].sort(
      (first, second) =>
        second.last_message.sequence - first.last_message.sequence,
    );
  }

  function peerFor(message: DirectMessage): MessageUser {
    return message.sender_id === currentUserId()
      ? message.receiver
      : message.sender;
  }

  function upsertHistory(message: DirectMessage) {
    if (activePeerId.value !== peerFor(message).id) return;
    const index = history.value.findIndex((item) => item.id === message.id);
    if (index === -1) {
      history.value.push(message);
      history.value.sort((first, second) => first.sequence - second.sequence);
    } else {
      history.value[index] = { ...history.value[index], ...message };
    }
  }

  function upsertConversation(message: DirectMessage) {
    const peer = peerFor(message);
    const index = conversations.value.findIndex(
      (item) => item.peer.id === peer.id,
    );
    const isIncoming = message.receiver_id === currentUserId();
    if (index === -1) {
      conversations.value.unshift({
        last_message: message,
        peer,
        unread_count: isIncoming ? 1 : 0,
      });
    } else {
      const conversation = conversations.value[index];
      if (!conversation) return;
      const isNew = conversation.last_message.id !== message.id;
      conversation.last_message = message;
      if (isIncoming && isNew) conversation.unread_count += 1;
    }
    sortConversations();
    if (isIncoming) unreadCount.value += 1;
  }

  function applyReadReceipt(data: Record<string, any>) {
    const messageIds = new Set<string>(data.message_ids || []);
    const readAt = data.read_at as null | string;
    history.value = history.value.map((item) =>
      messageIds.has(item.id) ? { ...item, read_at: readAt } : item,
    );
    if (Number(data.reader_id) === currentUserId()) {
      const conversation = conversations.value.find(
        (item) => item.peer.id === Number(data.peer_id),
      );
      if (conversation) {
        unreadCount.value = Math.max(
          0,
          unreadCount.value - conversation.unread_count,
        );
        conversation.unread_count = 0;
      }
    }
  }

  function handleSocketEvent(event: MessageSocketEvent) {
    switch (event.type) {
      case 'connected': {
        unreadCount.value = Number(event.data?.unread_count || 0);
        break;
      }
      case 'message.new': {
        const directMessage = event.data?.message as DirectMessage | undefined;
        if (!directMessage?.id) return;
        upsertConversation(directMessage);
        upsertHistory(directMessage);
        if (
          directMessage.receiver_id === currentUserId() &&
          activePeerId.value === directMessage.sender_id
        ) {
          markConversationRead(directMessage.sender_id);
        }
        break;
      }
      case 'message.read': {
        applyReadReceipt(event.data || {});
        break;
      }
      default: {
        break;
      }
    }
  }

  function scheduleReconnect() {
    if (stopped || reconnectTimer !== undefined) return;
    const delay = Math.min(30_000, 1000 * 2 ** reconnectAttempts);
    reconnectAttempts += 1;
    reconnectTimer = window.setTimeout(() => {
      reconnectTimer = undefined;
      connect();
    }, delay);
  }

  async function connect() {
    if (
      stopped ||
      socket?.readyState === WebSocket.OPEN ||
      socket?.readyState === WebSocket.CONNECTING
    ) {
      return;
    }
    try {
      const { ticket } = await createMessageWebSocketTicketApi();
      if (stopped) return;
      socket = new WebSocket(getWebSocketUrl(ticket));
      socket.addEventListener('open', () => {
        connected.value = true;
        reconnectAttempts = 0;
        heartbeatTimer = window.setInterval(
          () => sendSocketEvent('ping'),
          25_000,
        );
      });
      socket.onmessage = (event) => {
        try {
          handleSocketEvent(JSON.parse(event.data) as MessageSocketEvent);
        } catch {
          // 忽略服务端之外的无效帧，保持连接可用。
        }
      };
      socket.addEventListener('close', () => {
        connected.value = false;
        if (heartbeatTimer !== undefined) {
          window.clearInterval(heartbeatTimer);
          heartbeatTimer = undefined;
        }
        socket = undefined;
        scheduleReconnect();
      });
      socket.onerror = () => socket?.close();
    } catch {
      connected.value = false;
      scheduleReconnect();
    }
  }

  async function refresh() {
    const [usersResult, conversationsResult, unreadResult] =
      await Promise.allSettled([
        getMessageUsersApi(),
        getMessageConversationsApi(),
        getMessageUnreadApi(),
      ]);
    users.value =
      usersResult.status === 'fulfilled' && Array.isArray(usersResult.value)
        ? usersResult.value
        : [];
    conversations.value =
      conversationsResult.status === 'fulfilled' &&
      Array.isArray(conversationsResult.value)
        ? conversationsResult.value
        : [];
    sortConversations();
    unreadCount.value =
      unreadResult.status === 'fulfilled'
        ? Number(unreadResult.value?.count || 0)
        : 0;
  }

  async function start() {
    if (started.value) return;
    started.value = true;
    stopped = false;
    await refresh();
    connect();
  }

  function stop() {
    stopped = true;
    started.value = false;
    clearConnectionTimers();
    socket?.close();
    socket = undefined;
    connected.value = false;
  }

  async function selectPeer(peerId: number) {
    if (activePeerId.value === peerId) return;
    activePeerId.value = peerId;
    await loadHistory(peerId);
    markConversationRead(peerId);
  }

  async function loadHistory(
    peerId: number,
  ): Promise<MessageHistoryResult | undefined> {
    historyLoading.value = true;
    try {
      const data = await getMessageHistoryApi(peerId);
      if (activePeerId.value === peerId) history.value = data.list;
      return data;
    } finally {
      historyLoading.value = false;
    }
  }

  function markConversationRead(peerId: number) {
    if (sendSocketEvent('message.read', { peer_id: peerId })) return;
    markMessageConversationReadApi(peerId)
      .then((data) => {
        applyReadReceipt({
          message_ids: data.message_ids,
          peer_id: peerId,
          read_at: data.read_at,
          reader_id: currentUserId(),
        });
      })
      .catch(() => undefined);
  }

  function sendMessage(recipientId: number, content: string) {
    const clientId = createClientId();
    const sent = sendSocketEvent('message.send', {
      client_id: clientId,
      content,
      recipient_id: recipientId,
    });
    if (!sent) throw new Error('消息连接未建立');
    return clientId;
  }

  return {
    activePeerId,
    connected,
    conversations,
    history,
    historyLoading,
    markConversationRead,
    refresh,
    selectPeer,
    sendMessage,
    start,
    stop,
    unreadCount,
    users,
  };
});
