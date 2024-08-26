<template>
  <a-config-provider :locale="zhCN">
  <nav-header />
  <router-view v-wechat-title="$route.meta.title" />
</a-config-provider>
</template>

<script setup lang="ts">
import { onBeforeMount } from "vue";
import NavHeader from "./components/NavHeader.vue";
import router from "./router";
import zhCN from 'ant-design-vue/es/locale/zh_CN';
// 刷新的时候回到默认路径
const refreshPage = onBeforeMount(() => {
  // 在组件挂载之前执行的代码
  if (router.currentRoute.value.path !== "/stockstatus") {
    router.replace("/stockstatus");
  }
});
</script>

<style lang="less">
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  height: 100%;
}

</style>
