<script lang="ts" setup>
import type { NotificationItem } from '@vben/layouts';

import { computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';

import { AuthenticationLoginExpiredModal } from '@vben/common-ui';
import { useWatermark } from '@vben/hooks';
import { EosIconsAdminOutlined, EosIconsPatterns } from '@vben/icons';
import {
  BasicLayout,
  LockScreen,
  Notification,
  UserDropdown,
} from '@vben/layouts';
import { preferences } from '@vben/preferences';
import { useAccessStore, useUserStore } from '@vben/stores';

import { notification } from 'ant-design-vue';

import { useAuthStore, useMessageStore } from '#/store';
import LoginForm from '#/views/_core/authentication/login.vue';

const router = useRouter();
const userStore = useUserStore();
const authStore = useAuthStore();
const accessStore = useAccessStore();
const messageStore = useMessageStore();
const { destroyWatermark, updateWatermark } = useWatermark();
type MessageNotification = NotificationItem & { peerId: number };

const notifications = computed<MessageNotification[]>(() =>
  (messageStore.conversations ?? []).slice(0, 8).map((item) => ({
    avatar: item.peer.avatar || preferences.app.defaultAvatar,
    date: item.last_message.created_at,
    isRead: item.unread_count === 0,
    message: item.last_message.content,
    peerId: item.peer.id,
    title: item.peer.nickname,
  })),
);
const showDot = computed(() => messageStore.unreadCount > 0);

// ✅ 添加个人设置菜单项
const menus = computed(() => [
  {
    handler: () => {
      router.push('/account/profile');
    },
    icon: EosIconsPatterns,
    text: '个人设置',
  },
  {
    handler: () => {
      router.push('/account/profile?tab=security');
    },
    icon: EosIconsAdminOutlined,
    text: '安全设置',
  },
  // {
  //   handler: () => {
  //     openWindow(VBEN_DOC_URL, {
  //       target: '_blank',
  //     });
  //   },
  //   icon: BookOpenText,
  //   text: $t('ui.widgets.document'),
  // },
  // {
  //   handler: () => {
  //     openWindow(VBEN_GITHUB_URL, {
  //       target: '_blank',
  //     });
  //   },
  //   icon: SvgGithubIcon,
  //   text: 'GitHub',
  // },
  // {
  //   handler: () => {
  //     openWindow(`${VBEN_GITHUB_URL}/issues`, {
  //       target: '_blank',
  //     });
  //   },
  //   icon: CircleHelp,
  //   text: $t('ui.widgets.qa'),
  // },
]);

const avatar = computed(() => {
  return userStore.userInfo?.avatar ?? preferences.app.defaultAvatar;
});

async function handleLogout() {
  messageStore.stop();
  await authStore.logout({ redirect: false });
}

function handleNoticeClear() {
  Promise.all(
    (messageStore.conversations ?? [])
      .filter((item) => item.unread_count > 0)
      .map((item) => messageStore.markConversationRead(item.peer.id)),
  );
}

function handleMakeAll() {
  handleNoticeClear();
}

function handleNotificationRead(item: NotificationItem) {
  const peerId = (item as MessageNotification).peerId;
  messageStore.markConversationRead(peerId);
  router.push({ path: '/message', query: { peerId } });
}

function handleViewAll() {
  router.push('/message');
}

watch(
  () => ({
    enable: preferences.app.watermark,
    content: preferences.app.watermarkContent,
  }),
  async ({ enable, content }) => {
    if (enable) {
      await updateWatermark({
        content:
          content ||
          `${userStore.userInfo?.username} - ${userStore.userInfo?.realName}`,
      });
    } else {
      destroyWatermark();
    }
  },
  {
    immediate: true,
  },
);

watch(
  () => messageStore.kicked,
  (value) => {
    if (value) {
      notification.warning({
        description: messageStore.kickedReason,
        message: '账号已退出',
      });
      messageStore.stop();
      void authStore.logout({ notifyServer: false, redirect: false });
    }
  },
);

onMounted(() => {
  messageStore.start();
});
</script>

<template>
  <BasicLayout @clear-preferences-and-logout="handleLogout">
    <template #user-dropdown>
      <UserDropdown
        :avatar
        :menus
        :text="userStore.userInfo?.realName"
        :description="userStore.userInfo?.email"
        tag-text="Pro"
        @logout="handleLogout"
      />
    </template>
    <template #notification>
      <Notification
        :dot="showDot"
        :notifications="notifications"
        @clear="handleNoticeClear"
        @make-all="handleMakeAll"
        @read="handleNotificationRead"
        @view-all="handleViewAll"
      />
    </template>
    <template #extra>
      <AuthenticationLoginExpiredModal
        v-model:open="accessStore.loginExpired"
        :avatar
      >
        <LoginForm />
      </AuthenticationLoginExpiredModal>
    </template>
    <template #lock-screen>
      <LockScreen :avatar @to-login="handleLogout" />
    </template>
  </BasicLayout>
</template>
