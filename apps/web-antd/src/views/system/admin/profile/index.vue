<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Page } from '@vben/common-ui';
import { Card, Tabs, TabPane, message } from 'ant-design-vue';
import BasicInfo from './components/basic-info.vue';
import SecuritySettings from './components/security-settings.vue';
import { useUserStore } from '@vben/stores';

defineOptions({
  name: 'AccountProfile',
});

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

// 从 URL 参数读取初始 tab,默认为 'basic'
const activeTab = ref((route.query.tab as string) || 'basic');

const userInfo = ref({
  username: '',
  nickname: '',
  mobile: '',
  email: '',
  gender: 0,
  avatar: '',
  remark: '',
});

// 加载用户信息
const loadUserInfo = async () => {
  try {
    const info = userStore.userInfo;
    if (info) {
      userInfo.value = {
        username: info.username || '',
        nickname: info.nickname || '',
        mobile: info.mobile || '',
        email: info.email || '',
        gender: info.gender || 0,
        avatar: info.avatar || '',
        remark: info.remark || '',
      };
    }
  } catch (error) {
    message.error('加载用户信息失败');
  }
};

// 更新用户信息成功
const handleUpdateSuccess = () => {
  message.success('更新成功');
  loadUserInfo();
};

// 监听 tab 切换,同步更新 URL
const handleTabChange = (key: string) => {
  router.replace({
    query: { tab: key },
  });
};

onMounted(() => {
  loadUserInfo();
});
</script>

<template>
  <Page
    auto-content-height
    description="管理您的个人信息和账号安全设置"
    title="个人中心"
  >
    <Card :bordered="false">
      <Tabs
        v-model:active-key="activeTab"
        type="card"
        @change="handleTabChange"
      >
        <TabPane key="basic" tab="基本信息">
          <BasicInfo
            :user-info="userInfo"
            @success="handleUpdateSuccess"
          />
        </TabPane>

        <TabPane key="security" tab="安全设置">
          <SecuritySettings @success="handleUpdateSuccess" />
        </TabPane>
      </Tabs>
    </Card>
  </Page>
</template>

<style scoped>
:deep(.ant-card-body) {
  padding: 0;
}

:deep(.ant-tabs-nav) {
  padding: 0 24px;
  margin-bottom: 0;
}

:deep(.ant-tabs-content) {
  padding: 24px;
}
</style>
