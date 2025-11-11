<!-- src/views/system/config/index.vue -->
<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { Page } from '@vben/common-ui';
import { Card, Tabs, TabPane, Form, FormItem, Input, InputNumber, Select, SelectOption, Radio, RadioGroup, Switch, Button, message, Slider } from 'ant-design-vue';
import { getSystemConfigApi, updateSystemConfigApi, type SystemConfigInfo } from '#/api/system/config';

// 数据
const loading = ref(false);
const activeTab = ref('app');
const formRef = ref();

// 表单数据
const formData = reactive<SystemConfigInfo>({
  // 应用配置
  app_name: '',
  app_default_home_path: '',
  app_access_mode: 'frontend',
  app_login_expired_mode: 'modal',
  app_locale: 'zh-CN',
  app_watermark: false,
  app_watermark_content: '',
  app_default_avatar: '',
  app_enable_refresh_token: true,
  app_dynamic_title: true,

  // Logo配置
  logo_enable: true,
  logo_source: '',
  logo_fit: 'contain',

  // 主题配置
  theme_mode: 'light',
  theme_color_primary: '#1890ff',
  theme_color_success: '#52c41a',
  theme_color_warning: '#faad14',
  theme_color_destructive: '#ff4d4f',
  theme_builtin_type: 'default',
  theme_radius: '8',

  // 版权配置
  copyright_enable: true,
  copyright_company_name: '',
  copyright_company_site_link: '',
  copyright_date: '',
  copyright_icp: '',
  copyright_icp_link: '',

  // 布局配置
  layout_type: 'sidebar',
  content_compact: 'wide',
  content_compact_width: 1200,

  // 标签页配置
  tabbar_enable: true,
  tabbar_keep_alive: true,
  tabbar_persist: true,
  tabbar_show_icon: true,
  tabbar_style_type: 'card',

  // 侧边栏配置
  sidebar_enable: true,
  sidebar_width: 220,
  sidebar_collapsed_button: true,
  sidebar_expand_on_hover: false,

  // 头部配置
  header_enable: true,
  header_height: 64,
  header_mode: 'fixed',

  // 面包屑配置
  breadcrumb_enable: true,
  breadcrumb_show_icon: true,
  breadcrumb_show_home: true,

  // 页脚配置
  footer_enable: true,
  footer_height: 48,
});

// 加载配置
const loadConfig = async () => {
  try {
    loading.value = true;
    const data = await getSystemConfigApi();
    Object.assign(formData, data);
  } catch (error: any) {
    message.error(error.message || '加载配置失败');
  } finally {
    loading.value = false;
  }
};

// 保存配置
const handleSubmit = async () => {
  try {
    await formRef.value?.validate();
    loading.value = true;
    await updateSystemConfigApi(formData);
    message.success('保存成功');
    await loadConfig();
  } catch (error: any) {
    if (error.errorFields) {
      message.error('请检查表单填写是否正确');
    } else {
      message.error(error.message || '保存失败');
    }
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadConfig();
});
</script>

<template>
  <Page
    auto-content-height
    description="系统全局配置管理"
    title="系统配置"
  >
    <Card :loading="loading">
      <Tabs v-model:active-key="activeTab">
        <!-- 应用配置 -->
        <TabPane key="app" tab="应用配置">
          <Form
            ref="formRef"
            :model="formData"
            :label-col="{ span: 5 }"
            :wrapper-col="{ span: 14 }"
          >
            <FormItem
              label="应用名称"
              name="app_name"
              :rules="[{ required: true, message: '请输入应用名称' }]"
            >
              <Input v-model:value="formData.app_name" placeholder="请输入应用名称" />
            </FormItem>

            <FormItem
              label="默认首页路径"
              name="app_default_home_path"
              :rules="[{ required: true, message: '请输入默认首页路径' }]"
            >
              <Input v-model:value="formData.app_default_home_path" placeholder="例如: /dashboard" />
              <template #extra>用户登录后默认跳转的页面路径</template>
            </FormItem>

            <FormItem label="访问模式" name="app_access_mode">
              <RadioGroup v-model:value="formData.app_access_mode">
                <Radio value="frontend">前端路由模式</Radio>
                <Radio value="backend">后端路由模式</Radio>
              </RadioGroup>
            </FormItem>

            <FormItem label="登录过期模式" name="app_login_expired_mode">
              <RadioGroup v-model:value="formData.app_login_expired_mode">
                <Radio value="modal">弹窗提示</Radio>
                <Radio value="page">跳转页面</Radio>
              </RadioGroup>
            </FormItem>

            <FormItem label="默认语言" name="app_locale">
              <Select v-model:value="formData.app_locale" placeholder="请选择默认语言">
                <SelectOption value="zh-CN">简体中文</SelectOption>
                <SelectOption value="en-US">English</SelectOption>
              </Select>
            </FormItem>

            <FormItem label="启用水印" name="app_watermark">
              <Switch v-model:checked="formData.app_watermark" />
            </FormItem>

            <FormItem v-if="formData.app_watermark" label="水印内容" name="app_watermark_content">
              <Input v-model:value="formData.app_watermark_content" placeholder="请输入水印文字" />
            </FormItem>

            <FormItem label="默认头像" name="app_default_avatar">
              <Input v-model:value="formData.app_default_avatar" placeholder="请输入默认头像URL" />
              <template #extra>用户未设置头像时显示的默认图片</template>
            </FormItem>

            <FormItem label="启用刷新Token" name="app_enable_refresh_token">
              <Switch v-model:checked="formData.app_enable_refresh_token" />
            </FormItem>

            <FormItem label="动态标题" name="app_dynamic_title">
              <Switch v-model:checked="formData.app_dynamic_title" />
              <template #extra>是否根据路由动态更改浏览器标题</template>
            </FormItem>

            <FormItem :wrapper-col="{ offset: 5 }">
              <Button type="primary" :loading="loading" @click="handleSubmit">
                保存配置
              </Button>
            </FormItem>
          </Form>
        </TabPane>

        <!-- 主题配置 -->
        <TabPane key="theme" tab="主题配置">
          <Form
            :model="formData"
            :label-col="{ span: 5 }"
            :wrapper-col="{ span: 14 }"
          >
            <FormItem label="主题模式" name="theme_mode">
              <RadioGroup v-model:value="formData.theme_mode">
                <Radio value="light">明亮模式</Radio>
                <Radio value="dark">暗黑模式</Radio>
                <Radio value="auto">跟随系统</Radio>
              </RadioGroup>
            </FormItem>

            <FormItem label="主色调" name="theme_color_primary">
              <Input v-model:value="formData.theme_color_primary" type="color" style="width: 100px;" />
              <template #extra>系统主题色，例如按钮、链接等元素的颜色</template>
            </FormItem>

            <FormItem label="成功色" name="theme_color_success">
              <Input v-model:value="formData.theme_color_success" type="color" style="width: 100px;" />
            </FormItem>

            <FormItem label="警告色" name="theme_color_warning">
              <Input v-model:value="formData.theme_color_warning" type="color" style="width: 100px;" />
            </FormItem>

            <FormItem label="危险色" name="theme_color_destructive">
              <Input v-model:value="formData.theme_color_destructive" type="color" style="width: 100px;" />
            </FormItem>

            <FormItem label="内置主题" name="theme_builtin_type">
              <Select v-model:value="formData.theme_builtin_type" placeholder="请选择内置主题">
                <SelectOption value="default">默认主题</SelectOption>
                <SelectOption value="dark">暗黑主题</SelectOption>
                <SelectOption value="blue">蓝色主题</SelectOption>
              </Select>
            </FormItem>

            <FormItem label="圆角大小" name="theme_radius">
              <Slider
                v-model:value="formData.theme_radius"
                :min="0"
                :max="20"
                :marks="{ 0: '0px', 5: '5px', 10: '10px', 15: '15px', 20: '20px' }"
              />
              <template #extra>组件圆角的大小，单位为像素</template>
            </FormItem>

            <FormItem :wrapper-col="{ offset: 5 }">
              <Button type="primary" :loading="loading" @click="handleSubmit">
                保存配置
              </Button>
            </FormItem>
          </Form>
        </TabPane>

        <!-- 布局配置 -->
        <TabPane key="layout" tab="布局配置">
          <Form
            :model="formData"
            :label-col="{ span: 5 }"
            :wrapper-col="{ span: 14 }"
          >
            <FormItem label="布局类型" name="layout_type">
              <RadioGroup v-model:value="formData.layout_type">
                <Radio value="sidebar">侧边菜单布局</Radio>
                <Radio value="header">顶部菜单布局</Radio>
                <Radio value="mix">混合布局</Radio>
              </RadioGroup>
            </FormItem>

            <FormItem label="内容区域模式" name="content_compact">
              <RadioGroup v-model:value="formData.content_compact">
                <Radio value="wide">宽松</Radio>
                <Radio value="compact">紧凑</Radio>
              </RadioGroup>
            </FormItem>

            <FormItem v-if="formData.content_compact === 'compact'" label="紧凑模式宽度" name="content_compact_width">
              <InputNumber
                v-model:value="formData.content_compact_width"
                :min="800"
                :max="1600"
                :step="100"
                addon-after="px"
              />
            </FormItem>

            <FormItem :wrapper-col="{ offset: 5 }">
              <Button type="primary" :loading="loading" @click="handleSubmit">
                保存配置
              </Button>
            </FormItem>
          </Form>
        </TabPane>

        <!-- Logo配置 -->
        <TabPane key="logo" tab="Logo配置">
          <Form
            :model="formData"
            :label-col="{ span: 5 }"
            :wrapper-col="{ span: 14 }"
          >
            <FormItem label="显示Logo" name="logo_enable">
              <Switch v-model:checked="formData.logo_enable" />
            </FormItem>

            <FormItem v-if="formData.logo_enable" label="Logo图片地址" name="logo_source">
              <Input v-model:value="formData.logo_source" placeholder="请输入Logo图片URL" />
            </FormItem>

            <FormItem v-if="formData.logo_enable" label="图片适应方式" name="logo_fit">
              <Select v-model:value="formData.logo_fit" placeholder="请选择图片适应方式">
                <SelectOption value="fill">填充</SelectOption>
                <SelectOption value="contain">包含</SelectOption>
                <SelectOption value="cover">覆盖</SelectOption>
                <SelectOption value="none">无缩放</SelectOption>
                <SelectOption value="scale-down">缩小</SelectOption>
              </Select>
            </FormItem>

            <FormItem :wrapper-col="{ offset: 5 }">
              <Button type="primary" :loading="loading" @click="handleSubmit">
                保存配置
              </Button>
            </FormItem>
          </Form>
        </TabPane>

        <!-- 版权配置 -->
        <TabPane key="copyright" tab="版权配置">
          <Form
            :model="formData"
            :label-col="{ span: 5 }"
            :wrapper-col="{ span: 14 }"
          >
            <FormItem label="显示版权信息" name="copyright_enable">
              <Switch v-model:checked="formData.copyright_enable" />
            </FormItem>

            <FormItem v-if="formData.copyright_enable" label="公司名称" name="copyright_company_name">
              <Input v-model:value="formData.copyright_company_name" placeholder="请输入公司名称" />
            </FormItem>

            <FormItem v-if="formData.copyright_enable" label="公司网站链接" name="copyright_company_site_link">
              <Input v-model:value="formData.copyright_company_site_link" placeholder="https://example.com" />
            </FormItem>

            <FormItem v-if="formData.copyright_enable" label="版权年份" name="copyright_date">
              <Input v-model:value="formData.copyright_date" placeholder="2024" />
            </FormItem>

            <FormItem v-if="formData.copyright_enable" label="ICP备案号" name="copyright_icp">
              <Input v-model:value="formData.copyright_icp" placeholder="京ICP备xxxxxxxx号" />
            </FormItem>

            <FormItem v-if="formData.copyright_enable" label="ICP备案链接" name="copyright_icp_link">
              <Input v-model:value="formData.copyright_icp_link" placeholder="https://beian.miit.gov.cn" />
            </FormItem>

            <FormItem :wrapper-col="{ offset: 5 }">
              <Button type="primary" :loading="loading" @click="handleSubmit">
                保存配置
              </Button>
            </FormItem>
          </Form>
        </TabPane>

        <!-- 头部配置 -->
        <TabPane key="header" tab="头部配置">
          <Form
            :model="formData"
            :label-col="{ span: 5 }"
            :wrapper-col="{ span: 14 }"
          >
            <FormItem label="显示头部" name="header_enable">
              <Switch v-model:checked="formData.header_enable" />
            </FormItem>

            <FormItem v-if="formData.header_enable" label="头部高度" name="header_height">
              <InputNumber
                v-model:value="formData.header_height"
                :min="48"
                :max="100"
                :step="4"
                addon-after="px"
              />
            </FormItem>

            <FormItem v-if="formData.header_enable" label="头部模式" name="header_mode">
              <RadioGroup v-model:value="formData.header_mode">
                <Radio value="fixed">固定</Radio>
                <Radio value="static">静态</Radio>
              </RadioGroup>
            </FormItem>

            <FormItem :wrapper-col="{ offset: 5 }">
              <Button type="primary" :loading="loading" @click="handleSubmit">
                保存配置
              </Button>
            </FormItem>
          </Form>
        </TabPane>

        <!-- 侧边栏配置 -->
        <TabPane key="sidebar" tab="侧边栏配置">
          <Form
            :model="formData"
            :label-col="{ span: 5 }"
            :wrapper-col="{ span: 14 }"
          >
            <FormItem label="显示侧边栏" name="sidebar_enable">
              <Switch v-model:checked="formData.sidebar_enable" />
            </FormItem>

            <FormItem v-if="formData.sidebar_enable" label="侧边栏宽度" name="sidebar_width">
              <InputNumber
                v-model:value="formData.sidebar_width"
                :min="180"
                :max="300"
                :step="10"
                addon-after="px"
              />
            </FormItem>

            <FormItem v-if="formData.sidebar_enable" label="显示折叠按钮" name="sidebar_collapsed_button">
              <Switch v-model:checked="formData.sidebar_collapsed_button" />
            </FormItem>

            <FormItem v-if="formData.sidebar_enable" label="鼠标悬停展开" name="sidebar_expand_on_hover">
              <Switch v-model:checked="formData.sidebar_expand_on_hover" />
              <template #extra>侧边栏折叠时，鼠标悬停是否自动展开</template>
            </FormItem>

            <FormItem :wrapper-col="{ offset: 5 }">
              <Button type="primary" :loading="loading" @click="handleSubmit">
                保存配置
              </Button>
            </FormItem>
          </Form>
        </TabPane>

        <!-- 标签页配置 -->
        <TabPane key="tabbar" tab="标签页配置">
          <Form
            :model="formData"
            :label-col="{ span: 5 }"
            :wrapper-col="{ span: 14 }"
          >
            <FormItem label="显示标签页" name="tabbar_enable">
              <Switch v-model:checked="formData.tabbar_enable" />
            </FormItem>

            <FormItem v-if="formData.tabbar_enable" label="页面缓存" name="tabbar_keep_alive">
              <Switch v-model:checked="formData.tabbar_keep_alive" />
              <template #extra>切换标签页时是否缓存页面状态</template>
            </FormItem>

            <FormItem v-if="formData.tabbar_enable" label="持久化标签页" name="tabbar_persist">
              <Switch v-model:checked="formData.tabbar_persist" />
              <template #extra>刷新页面后是否保留标签页</template>
            </FormItem>

            <FormItem v-if="formData.tabbar_enable" label="显示图标" name="tabbar_show_icon">
              <Switch v-model:checked="formData.tabbar_show_icon" />
            </FormItem>

            <FormItem v-if="formData.tabbar_enable" label="标签页样式" name="tabbar_style_type">
              <RadioGroup v-model:value="formData.tabbar_style_type">
                <Radio value="card">卡片式</Radio>
                <Radio value="button">按钮式</Radio>
                <Radio value="line">线条式</Radio>
              </RadioGroup>
            </FormItem>

            <FormItem :wrapper-col="{ offset: 5 }">
              <Button type="primary" :loading="loading" @click="handleSubmit">
                保存配置
              </Button>
            </FormItem>
          </Form>
        </TabPane>

        <!-- 面包屑配置 -->
        <TabPane key="breadcrumb" tab="面包屑配置">
          <Form
            :model="formData"
            :label-col="{ span: 5 }"
            :wrapper-col="{ span: 14 }"
          >
            <FormItem label="显示面包屑" name="breadcrumb_enable">
              <Switch v-model:checked="formData.breadcrumb_enable" />
            </FormItem>

            <FormItem v-if="formData.breadcrumb_enable" label="显示图标" name="breadcrumb_show_icon">
              <Switch v-model:checked="formData.breadcrumb_show_icon" />
            </FormItem>

            <FormItem v-if="formData.breadcrumb_enable" label="显示首页" name="breadcrumb_show_home">
              <Switch v-model:checked="formData.breadcrumb_show_home" />
              <template #extra>是否在面包屑中显示首页链接</template>
            </FormItem>

            <FormItem :wrapper-col="{ offset: 5 }">
              <Button type="primary" :loading="loading" @click="handleSubmit">
                保存配置
              </Button>
            </FormItem>
          </Form>
        </TabPane>

        <!-- 页脚配置 -->
        <TabPane key="footer" tab="页脚配置">
          <Form
            :model="formData"
            :label-col="{ span: 5 }"
            :wrapper-col="{ span: 14 }"
          >
            <FormItem label="显示页脚" name="footer_enable">
              <Switch v-model:checked="formData.footer_enable" />
            </FormItem>

            <FormItem v-if="formData.footer_enable" label="页脚高度" name="footer_height">
              <InputNumber
                v-model:value="formData.footer_height"
                :min="32"
                :max="100"
                :step="4"
                addon-after="px"
              />
            </FormItem>

            <FormItem :wrapper-col="{ offset: 5 }">
              <Button type="primary" :loading="loading" @click="handleSubmit">
                保存配置
              </Button>
            </FormItem>
          </Form>
        </TabPane>
      </Tabs>
    </Card>
  </Page>
</template>

<style scoped lang="less">
:deep(.ant-tabs-content) {
  padding-top: 24px;
}
</style>
