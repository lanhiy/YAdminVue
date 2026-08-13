<script setup lang="ts">
import type { MessageUser } from '#/api';

import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

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
} from 'ant-design-vue';
import dayjs from 'dayjs';

import { useMessageStore } from '#/store';

const messageStore = useMessageStore();
const userStore = useUserStore();
const route = useRoute();
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
    messageStore.users.find((item) => item.id === peerId) ??
    messageStore.conversations.find((item) => item.peer.id === peerId)?.peer
  );
});

const contacts = computed(() => {
  const conversations = new Map(
    messageStore.conversations.map((item) => [item.peer.id, item]),
  );
  return [...messageStore.users]
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
  return (
    user?.avatar ||
    `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(user?.nickname || user?.username || 'Y')}`
  );
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

watch(() => messageStore.history.length, scrollToBottom);

onMounted(async () => {
  await messageStore.start();
  const queryPeer = Number(route.query.peerId || 0);
  const initialPeer = queryPeer > 0
    ? queryPeer
    : messageStore.conversations[0]?.peer.id ?? messageStore.users[0]?.id;
  if (initialPeer) await selectPeer(initialPeer);
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
            <Avatar :src="avatarOf(item.peer)" :size="40" />
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
            <Avatar :src="avatarOf(selectedPeer)" :size="36" />
            <div>
              <h2>{{ selectedPeer.nickname }}</h2>
              <p>{{ selectedPeer.username }}</p>
            </div>
          </header>
          <Spin :spinning="messageStore.historyLoading" class="history-loading">
            <div ref="messageListRef" class="message-list">
              <div
                v-for="item in messageStore.history"
                :key="item.id"
                class="message-row"
                :class="{ mine: item.sender_id === currentUserId }"
              >
                <Avatar :src="avatarOf(item.sender)" :size="32" />
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
        <Empty v-else description="选择一位联系人开始沟通" />
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
  background: var(--ant-color-bg-container);
  border: 1px solid var(--ant-color-border-secondary);
  border-radius: 6px;
}

.conversation-sidebar {
  min-width: 0;
  background: var(--ant-color-fill-quaternary);
  border-right: 1px solid var(--ant-color-border-secondary);
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
  border-bottom: 1px solid var(--ant-color-border-secondary);
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
  border-bottom: 1px solid var(--ant-color-border-secondary);
}

.contact-row:hover,
.contact-row.active {
  background: var(--ant-color-bg-text-hover);
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
  color: var(--ant-color-text-secondary);
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
  background: var(--ant-color-error);
  border-radius: 9px;
}

.conversation-panel {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.conversation-header {
  gap: 10px;
  min-height: 60px;
  padding: 0 18px;
  border-bottom: 1px solid var(--ant-color-border-secondary);
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
  color: var(--ant-color-text-secondary);
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
  background: var(--ant-color-bg-layout);
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
  background: var(--ant-color-bg-container);
  border-radius: 5px;
  box-shadow: 0 1px 2px rgb(0 0 0 / 6%);
}

.mine .message-content {
  color: #fff;
  background: var(--ant-color-primary);
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
  background: var(--ant-color-bg-container);
  border-top: 1px solid var(--ant-color-border-secondary);
}

.composer-actions {
  gap: 12px;
  justify-content: flex-end;
  margin-top: 8px;
  font-size: 12px;
  color: var(--ant-color-text-secondary);
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
