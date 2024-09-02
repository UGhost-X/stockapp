<template>
    <a-layout class="layout">
        <a-layout-header style="height: 48px ;border-radius: 10px 10px 0 0;">
      <div class="logo">
        <img src="@/assets/logo.svg" style="width: 42px;height: 42px;margin-top: 4px; "/>
      </div>
      <a-menu
        v-model:selectedKeys="selectedKeys"
        theme="dark"
        mode="horizontal"
        :style="{ lineHeight: '48px',padding: '0'}"
      >
        <a-menu-item key="1"><router-link to="/stockstatus"/>大盘晴雨</a-menu-item>
        <a-menu-item key="2"><router-link to="/stockanalysis"/>候选分析</a-menu-item>
        <a-menu-item key="3"><router-link to="/stockreview"/>个股复盘</a-menu-item>
        <a-menu-item key="4"><router-link to="/historyrecords"/>历史记录</a-menu-item>
        <a-menu-item key="5"><router-link to="/logmanagement"/>日志管理</a-menu-item>
      </a-menu>
    </a-layout-header>
    </a-layout>
</template>
<script lang="ts" setup>
import { ref } from 'vue';
const selectedKeys = ref<string[]>(['1']);
</script>
<style scoped>
.layout {
  margin: 0; /* 居中布局 */
}
.logo {
  float: left;
  width: 120px;
  height: 31px;
  /* margin: 16px 24px 16px 0; */
}
</style>
