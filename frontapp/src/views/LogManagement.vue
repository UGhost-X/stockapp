<template>
  <a-row :gutter="16" align="middle">
    <a-col :span="6">
      <a-card :bordered="false" class="functionalpannel">
          <a-space>
            <a-button type="primary" size="large" 
            style="display: flex;align-items: center;">
              <template #icon><RunIcon /></template>
              运行</a-button>
          </a-space>
      </a-card>
    </a-col>
    <a-col :span="18" class="logstyle">
      <div class="loginfo">
        <WebSocketLog :server-message="serverMessage"></WebSocketLog>
      </div>
    </a-col>
  </a-row>
</template>

<script setup lang="ts">
import { ref } from "vue";
import RunIcon from "@/components/RunIcon.vue";
import WebSocketLog from "@/components/WebSocketLog.vue"
const serverMessage = ref("hello!")






</script>

<style scoped>
.logstyle {
  background-image: url("@/assets/pictures/logtelevison.png");
  background-repeat: no-repeat;
  background-position: right;
  background-size: 100% 100%;
  height: calc(100vh - 83px);
  width: 100%;
  border-width: 50px 50px 0 0;
  border-style: solid;
  border-color: transparent;
  position: relative;
}

.loginfo {
  position: absolute;
  font-size: 12px;
  /* background-color: rgba(0, 0, 0, 0.336); */
  left: calc(100vw - 94vw);
  top: calc(10vh);
  bottom: calc(50vh);
  padding: 0 0 0 0;
  /* height: 100px; */
  height: calc(50vh);
  width: calc(47vw);
  overflow-y: scroll;
  overflow-wrap: break-word;
}
.functionalpannel {
  height: calc(70vh);
  width: 100%;
  background-color: rgba(101, 156, 158, 0.233);
  border-radius: 20px;
  margin: 10px 10px 10px 0;
  box-shadow: 5px 5px 5px 5px rgba(53, 49, 49, 0.137);
}

::-webkit-scrollbar-thumb {
  background-color: transparent;
}
</style>
