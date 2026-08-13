<script setup lang="ts">
import type { MessageUser } from '#/api';

import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';
import { useUserStore } from '@vben/stores';

import {
  Avatar,
  Button,
  Empty,
  Input,
  message,
  Spin,
  Tag,
  Tooltip,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import { X } from '@vben/icons';

import { useMessageStore } from '#/store';

const messageStore = useMessageStore();
const userStore = useUserStore();
const route = useRoute();
const router = useRouter();
const draft = ref('');
const sending = ref(false);
const messageListRef = ref<HTMLElement>();
const selectedPeerId = computed(() => messageStore.activePeerId);
const currentUserId = computed(() =>
  Number((userStore.userInfo as null | { user_id?: number })?.user_id || 0),
);

const selectedPeer = computed<MessageUser | undefined>(() => {
  const peerId = selectedPeerId.value;
  if (!peerId) return undefined;
  return (
    (messageStore.users ?? []).find((item) => item.id === peerId) ??
    (messageStore.conversations ?? []).find((item) => item.peer.id === peerId)
      ?.peer
  );
});

const contacts = computed(() => {
  const conversations = new Map(
    (messageStore.conversations ?? []).map((item) => [item.peer.id, item]),
  );
  return [...(messageStore.users ?? [])]
    .sort((first, second) => {
      const firstSequence =
        conversations.get(first.id)?.last_message.sequence || 0;
      const secondSequence =
        conversations.get(second.id)?.last_message.sequence || 0;
      return (
        secondSequence - firstSequence ||
        first.nickname.localeCompare(second.nickname)
      );
    })
    .map((peer) => ({ peer, conversation: conversations.get(peer.id) }));
});

function avatarOf(user?: MessageUser) {
  return user?.avatar || undefined;
}

function avatarText(user?: MessageUser) {
  return (user?.nickname || user?.username || '?').slice(-2).toUpperCase();
}

function formatTime(value: string) {
  const time = dayjs(value);
  return time.isSame(dayjs(), 'day')
    ? time.format('HH:mm')
    : time.format('MM-DD HH:mm');
}

function scrollToBottom() {
  nextTick(() => {
    const element = messageListRef.value;
    if (element) element.scrollTop = element.scrollHeight;
  });
}

async function selectPeer(peerId: number) {
  try {
    await messageStore.selectPeer(peerId);
    scrollToBottom();
  } catch {
    message.error('加载消息记录失败');
  }
}

async function send() {
  const content = draft.value.trim();
  if (!content || !selectedPeerId.value || sending.value) return;
  try {
    sending.value = true;
    messageStore.sendMessage(selectedPeerId.value, content);
    draft.value = '';
  } catch (error) {
    message.error(error instanceof Error ? error.message : '消息发送失败');
  } finally {
    sending.value = false;
  }
}

function handleEnter(event: KeyboardEvent) {
  if (event.shiftKey) return;
  event.preventDefault();
  send();
}

function closeConversation() {
  draft.value = '';
  messageStore.clearSelection();
  const { peerId: _peerId, ...query } = route.query;
  void router.replace({ path: route.path, query });
}

watch(() => messageStore.history.length, scrollToBottom);

async function selectRoutePeer(value: unknown) {
  const peerId = Number(value || 0);
  if (peerId > 0) {
    await selectPeer(peerId);
  } else {
    messageStore.clearSelection();
  }
}

watch(
  () => route.query.peerId,
  (peerId, previousPeerId) => {
    if (peerId !== previousPeerId) void selectRoutePeer(peerId);
  },
);

onMounted(async () => {
  await messageStore.start();
  await selectRoutePeer(route.query.peerId);
});
</script>

<template>
  <Page auto-content-height title="消息中心">
    <div class="message-workspace">
      <aside class="conversation-sidebar">
        <div class="sidebar-heading">
          <span>联系人</span>
          <Tag :color="messageStore.connected ? 'success' : 'default'">
            {{ messageStore.connected ? '已连接' : '连接中' }}
          </Tag>
        </div>
        <div class="contact-list">
          <button
            v-for="item in contacts"
            :key="item.peer.id"
            class="contact-row"
            :class="{ active: item.peer.id === selectedPeerId }"
            type="button"
            @click="selectPeer(item.peer.id)"
          >
            <Avatar :src="avatarOf(item.peer)" :size="40">{{
              avatarText(item.peer)
            }}</Avatar>
            <span class="contact-main">
              <span class="contact-name">{{ item.peer.nickname }}</span>
              <span class="contact-preview">{{
                item.conversation?.last_message.content || item.peer.username
              }}</span>
            </span>
            <span class="contact-meta">
              <time v-if="item.conversation">{{
                formatTime(item.conversation.last_message.created_at)
              }}</time>
              <span
                v-if="item.conversation?.unread_count"
                class="unread-badge"
                >{{
                  item.conversation.unread_count > 99
                    ? '99+'
                    : item.conversation.unread_count
                }}</span
              >
            </span>
          </button>
          <Empty
            v-if="contacts.length === 0"
            description="暂无可联系人员"
            :image="Empty.PRESENTED_IMAGE_SIMPLE"
          />
        </div>
      </aside>

      <section class="conversation-panel">
        <template v-if="selectedPeer">
          <header class="conversation-header">
            <div class="conversation-peer">
              <Avatar :src="avatarOf(selectedPeer)" :size="36">{{
                avatarText(selectedPeer)
              }}</Avatar>
              <div>
                <h2>{{ selectedPeer.nickname }}</h2>
                <p>{{ selectedPeer.username }}</p>
              </div>
            </div>
            <Tooltip title="关闭会话">
              <Button
                aria-label="关闭会话"
                class="close-conversation"
                type="text"
                @click="closeConversation"
              >
                <X :size="18" />
              </Button>
            </Tooltip>
          </header>
          <Spin :spinning="messageStore.historyLoading" class="history-loading">
            <div ref="messageListRef" class="message-list">
              <div
                v-for="item in messageStore.history"
                :key="item.id"
                class="message-row"
                :class="{ mine: item.sender_id === currentUserId }"
              >
                <Avatar :src="avatarOf(item.sender)" :size="32">{{
                  avatarText(item.sender)
                }}</Avatar>
                <div class="message-body">
                  <div class="message-content">{{ item.content }}</div>
                  <div class="message-state">
                    <time>{{ formatTime(item.created_at) }}</time>
                    <span v-if="item.sender_id === currentUserId">{{
                      item.read_at ? '已读' : '未读'
                    }}</span>
                  </div>
                </div>
              </div>
              <Empty
                v-if="
                  messageStore.history.length === 0 &&
                  !messageStore.historyLoading
                "
                description="还没有消息"
                :image="Empty.PRESENTED_IMAGE_SIMPLE"
              />
            </div>
          </Spin>
          <footer class="composer">
            <Input.TextArea
              v-model:value="draft"
              :auto-size="{ minRows: 3, maxRows: 5 }"
              :maxlength="2000"
              placeholder="输入消息"
              @keydown.enter="handleEnter"
            />
            <div class="composer-actions">
              <span>{{ draft.length }}/2000</span>
              <Button
                type="primary"
                :disabled="!draft.trim() || !messageStore.connected"
                :loading="sending"
                @click="send"
              >
                发送
              </Button>
            </div>
          </footer>
        </template>
        <div v-else class="conversation-empty">
          <Empty description="选择一位联系人开始沟通" />
        </div>
      </section>
    </div>
  </Page>
</template>

<style scoped>
.message-workspace {
  display: grid;
  grid-template-columns: minmax(248px, 300px) minmax(0, 1fr);
  height: min(720px, calc(100vh - 184px));
  min-height: 520px;
  overflow: hidden;
  color: hsl(var(--foreground));
  background: hsl(var(--card));
  border: 1px solid hsl(var(--border));
  border-radius: 6px;
}

.conversation-sidebar {
  min-width: 0;
  background: hsl(var(--muted));
  border-right: 1px solid hsl(var(--border));
}

.sidebar-heading,
.conversation-header,
.composer-actions {
  display: flex;
  align-items: center;
}

.sidebar-heading {
  justify-content: space-between;
  height: 60px;
  padding: 0 16px;
  font-weight: 600;
  border-bottom: 1px solid hsl(var(--border));
}

.contact-list {
  height: calc(100% - 60px);
  overflow-y: auto;
}

.contact-row {
  display: flex;
  gap: 10px;
  width: 100%;
  min-height: 68px;
  padding: 12px 14px;
  color: inherit;
  text-align: left;
  cursor: pointer;
  background: transparent;
  border: 0;
  border-bottom: 1px solid hsl(var(--border));
}

.contact-row:hover,
.contact-row.active {
  background: hsl(var(--accent));
}

.contact-main,
.contact-meta,
.message-body {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
}

.contact-name,
.contact-preview {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.contact-name {
  font-weight: 500;
  line-height: 20px;
}

.contact-preview,
.contact-meta time,
.message-state {
  font-size: 12px;
  color: hsl(var(--muted-foreground));
}

.contact-preview {
  margin-top: 3px;
}

.contact-meta {
  flex: 0 0 auto;
  gap: 6px;
  align-items: flex-end;
}

.unread-badge {
  min-width: 18px;
  padding: 0 5px;
  font-size: 11px;
  line-height: 18px;
  color: #fff;
  text-align: center;
  background: hsl(var(--destructive));
  border-radius: 9px;
}

.conversation-panel {
  display: flex;
  flex-direction: column;
  min-width: 0;
  background: hsl(var(--card));
}

.conversation-header {
  justify-content: space-between;
  min-height: 60px;
  padding: 0 18px;
  border-bottom: 1px solid hsl(var(--border));
}

.conversation-peer {
  display: flex;
  gap: 10px;
  align-items: center;
  min-width: 0;
}

.close-conversation {
  display: inline-flex;
  flex: 0 0 32px;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  color: hsl(var(--muted-foreground));
}

.close-conversation:hover {
  color: hsl(var(--foreground));
  background: hsl(var(--accent));
}

.conversation-header h2 {
  margin: 0;
  font-size: 14px;
  line-height: 20px;
}

.conversation-header p {
  margin: 0;
  font-size: 12px;
  line-height: 18px;
  color: hsl(var(--muted-foreground));
}

.conversation-empty {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  min-height: 0;
}

.history-loading {
  display: flex;
  flex: 1;
  min-height: 0;
}

:deep(.history-loading .ant-spin-container) {
  display: flex;
  flex: 1;
  min-height: 0;
}

.message-list {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 16px;
  min-height: 0;
  padding: 20px;
  overflow-y: auto;
  background: hsl(var(--background-deep));
}

.message-row {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  max-width: 80%;
}

.message-row.mine {
  flex-direction: row-reverse;
  align-self: flex-end;
}

.message-content {
  width: fit-content;
  max-width: 100%;
  padding: 9px 12px;
  line-height: 21px;
  overflow-wrap: anywhere;
  white-space: pre-wrap;
  color: hsl(var(--card-foreground));
  background: hsl(var(--card));
  border: 1px solid hsl(var(--border));
  border-radius: 5px;
  box-shadow: 0 1px 2px rgb(0 0 0 / 6%);
}

.mine .message-content {
  color: hsl(var(--primary-foreground));
  background: hsl(var(--primary));
  border-color: hsl(var(--primary));
}

.message-state {
  display: flex;
  gap: 6px;
  margin-top: 3px;
}

.mine .message-state {
  justify-content: flex-end;
}

.composer {
  padding: 12px 16px;
  background: hsl(var(--card));
  border-top: 1px solid hsl(var(--border));
}

.composer-actions {
  gap: 12px;
  justify-content: flex-end;
  margin-top: 8px;
  font-size: 12px;
  color: hsl(var(--muted-foreground));
}

@media (max-width: 768px) {
  .message-workspace {
    grid-template-columns: 108px minmax(0, 1fr);
    height: calc(100vh - 144px);
    min-height: 420px;
  }

  .sidebar-heading {
    padding: 0 10px;
    font-size: 12px;
  }

  .sidebar-heading :deep(.ant-tag) {
    display: none;
  }

  .contact-row {
    justify-content: center;
    min-height: 62px;
    padding: 10px;
  }

  .contact-main,
  .contact-meta {
    display: none;
  }

  .message-row {
    max-width: 92%;
  }

  .message-list {
    padding: 14px;
  }

  .composer {
    padding: 10px;
  }
}
</style>
