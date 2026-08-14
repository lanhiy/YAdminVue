<script setup lang="ts">
import type { MessageUser } from '#/api';

import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Page, VbenAvatar } from '@vben/common-ui';
import { LogOut, X } from '@vben/icons';
import { useUserStore } from '@vben/stores';

import {
  Button,
  Empty,
  Input,
  message,
  Modal,
  Spin,
  Tag,
  Tooltip,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import { useMessageStore } from '#/store';

const messageStore = useMessageStore();
const userStore = useUserStore();
const route = useRoute();
const router = useRouter();
const draft = ref('');
const sending = ref(false);
const activeList = ref<'contacts' | 'online'>('contacts');
const messageListRef = ref<HTMLElement>();
const selectedPeerId = computed(() => messageStore.activePeerId);
const currentUserId = computed(() =>
  Number((userStore.userInfo as null | { user_id?: number })?.user_id || 0),
);
const canKick = computed(() => currentUserId.value === 1);
const onlineUsers = computed(() => messageStore.onlineUsers ?? []);

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
    .map((peer) => {
      const conversation = conversations.get(peer.id);
      return {
        conversation,
        peer,
        unreadLabel: formatUnread(conversation?.unread_count || 0),
      };
    });
});

function avatarOf(user?: MessageUser) {
  return user?.avatar || '';
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

function formatUnread(count: number) {
  return count > 99 ? '99+' : count;
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

async function kickUser(user: MessageUser) {
  try {
    await messageStore.kickUser(user.id);
    message.success(`${user.nickname} 已下线`);
  } catch (error) {
    message.error(error instanceof Error ? error.message : '踢下线失败');
  }
}

function confirmKick(user: MessageUser) {
  Modal.confirm({
    cancelText: '取消',
    content: '该账号的所有登录和消息连接都会立即失效。',
    okButtonProps: { danger: true },
    okText: '踢下线',
    onOk: () => kickUser(user),
    title: `确认踢出 ${user.nickname}？`,
  });
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
          <span>{{ activeList === 'online' ? '在线人员' : '联系人' }}</span>
          <Tag :color="messageStore.connected ? 'success' : 'default'">
            {{ messageStore.connected ? '已连接' : '连接中' }}
          </Tag>
        </div>
        <div class="sidebar-tabs" role="tablist">
          <button
            class="sidebar-tab"
            :class="{ active: activeList === 'contacts' }"
            type="button"
            role="tab"
            :aria-selected="activeList === 'contacts'"
            @click="activeList = 'contacts'"
          >
            联系人
          </button>
          <button
            class="sidebar-tab"
            :class="{ active: activeList === 'online' }"
            type="button"
            role="tab"
            :aria-selected="activeList === 'online'"
            @click="activeList = 'online'"
          >
            在线 {{ onlineUsers.length }}
          </button>
        </div>
        <div v-if="activeList === 'contacts'" class="contact-list">
          <button
            v-for="item in contacts"
            :key="item.peer.id"
            class="contact-row"
            :class="{ active: item.peer.id === selectedPeerId }"
            type="button"
            @click="selectPeer(item.peer.id)"
          >
            <VbenAvatar
              :alt="avatarText(item.peer)"
              :src="avatarOf(item.peer)"
              class="size-10"
            />
            <span
              class="presence-dot"
              :class="{ online: item.peer.online }"
              :title="item.peer.online ? '在线' : '离线'"
            ></span>
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
                v-text="item.unreadLabel"
              ></span>
            </span>
          </button>
          <Empty
            v-if="contacts.length === 0"
            description="暂无可联系人员"
            :image="Empty.PRESENTED_IMAGE_SIMPLE"
          />
        </div>
        <div v-else class="contact-list online-list">
          <div
            v-for="user in onlineUsers"
            :key="user.id"
            class="online-row"
            :class="{ active: user.id === selectedPeerId }"
            @click="selectPeer(user.id)"
          >
            <VbenAvatar
              :alt="avatarText(user)"
              :src="avatarOf(user)"
              class="size-10"
            />
            <span class="contact-main">
              <span class="contact-name">{{ user.nickname }}</span>
              <span class="contact-preview">{{ user.username }} · 在线</span>
            </span>
            <Tooltip v-if="canKick" title="踢出下线">
              <Button
                danger
                class="kick-button"
                size="small"
                aria-label="踢出下线"
                @click.stop="confirmKick(user)"
              >
                <LogOut :size="16" />
              </Button>
            </Tooltip>
          </div>
          <Empty
            v-if="onlineUsers.length === 0"
            description="暂无在线人员"
            :image="Empty.PRESENTED_IMAGE_SIMPLE"
          />
        </div>
      </aside>

      <section class="conversation-panel">
        <template v-if="selectedPeer">
          <header class="conversation-header">
            <div class="conversation-peer">
              <VbenAvatar
                :alt="avatarText(selectedPeer)"
                :src="avatarOf(selectedPeer)"
                class="size-9"
              />
              <div>
                <h2>{{ selectedPeer.nickname }}</h2>
                <p>
                  <span
                    class="presence-dot"
                    :class="{ online: selectedPeer.online }"
                  ></span>
                  {{ selectedPeer.online ? '在线' : '离线' }} ·
                  {{ selectedPeer.username }}
                </p>
              </div>
            </div>
            <Tooltip title="关闭会话">
              <Button
                aria-label="关闭会话"
                class="close-conversation"
                @click="closeConversation"
              >
                <X :size="18" />
                <span>关闭</span>
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
                <VbenAvatar
                  :alt="avatarText(item.sender)"
                  :src="avatarOf(item.sender)"
                  class="size-8"
                />
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
.sidebar-tabs,
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

.sidebar-tabs {
  gap: 4px;
  height: 44px;
  padding: 6px 8px;
  border-bottom: 1px solid hsl(var(--border));
}

.sidebar-tab {
  flex: 1;
  border: 0;
  border-radius: 4px;
  color: hsl(var(--muted-foreground));
  background: transparent;
  cursor: pointer;
  font-size: 12px;
}

.sidebar-tab.active {
  color: hsl(var(--foreground));
  background: hsl(var(--card));
  box-shadow: 0 1px 2px rgb(0 0 0 / 8%);
}

.contact-list {
  box-sizing: border-box;
  height: calc(100% - 104px);
  padding: 8px;
  overflow-y: auto;
}

.online-row {
  display: flex;
  gap: 10px;
  align-items: center;
  min-height: 68px;
  margin-bottom: 8px;
  padding: 10px 8px 10px 12px;
  border: 1px solid hsl(var(--border));
  border-radius: 6px;
  cursor: pointer;
  background: hsl(var(--card));
}

.online-row:hover,
.online-row.active {
  border-color: hsl(var(--primary) / 55%);
  background: hsl(var(--primary) / 10%);
}

.kick-button {
  flex: 0 0 auto;
  color: hsl(var(--destructive));
}

.presence-dot {
  display: inline-block;
  flex: 0 0 auto;
  width: 7px;
  height: 7px;
  border: 1px solid hsl(var(--card));
  border-radius: 50%;
  background: hsl(var(--muted-foreground) / 50%);
}

.presence-dot.online {
  background: #22c55e;
}

.contact-row {
  display: flex;
  gap: 10px;
  width: 100%;
  min-height: 68px;
  margin-bottom: 8px;
  padding: 12px;
  color: inherit;
  text-align: left;
  cursor: pointer;
  background: hsl(var(--card));
  border: 1px solid hsl(var(--border));
  border-radius: 6px;
}

.contact-row:hover {
  background: hsl(var(--accent));
  border-color: hsl(var(--primary) / 35%);
}

.contact-row.active {
  background: hsl(var(--primary) / 12%);
  border-color: hsl(var(--primary) / 60%);
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
  flex: 0 0 auto;
  gap: 6px;
  align-items: center;
  justify-content: center;
  min-width: 72px;
  height: 32px;
  padding: 0 10px;
  color: hsl(var(--foreground));
  background: hsl(var(--card));
  border-color: hsl(var(--border));
}

.close-conversation:hover {
  color: hsl(var(--destructive));
  background: hsl(var(--destructive) / 8%);
  border-color: hsl(var(--destructive) / 45%);
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

  .sidebar-tabs {
    padding: 6px 4px;
  }

  .sidebar-heading :deep(.ant-tag) {
    display: none;
  }

  .contact-row {
    justify-content: center;
    min-height: 62px;
    margin-bottom: 6px;
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
