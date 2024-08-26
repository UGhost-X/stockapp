<template>
  <a-layout class="layout">
    <a-layout-content style="margin: 10px 10px 3px 10px; width: 99%">
      <a-collapse v-model:activeKey="activeKey" @change="changeActivekey">
        <a-collapse-panel key="1" header="This is panel header 1">
          <a-flex :justify="justify" :wrap="wrap" >
            <template v-for="stock in stockList">
              <a-card :title="stock.title" :bordered="false" class="cardstyle">
                <p>Card content</p>
              </a-card>
            </template>
          </a-flex>
        </a-collapse-panel>
      </a-collapse>
    </a-layout-content>
  </a-layout>
</template>
<script lang="ts" setup>
import { ref, reactive } from "vue";
import type { FlexProps } from "ant-design-vue";

const justifyOptions = reactive<FlexProps["justify"][]>([
  "flex-start",
  "center",
  "flex-end",
  "space-between",
  "space-around",
  "space-evenly",
]);

const wrapoptions = reactive<FlexProps["wrap"][]>([
  "nowrap",
  "wrap",
  "wrap-reverse",
]);
const justify = ref(justifyOptions[5]);
const wrap = ref(wrapoptions[1]);

const stockList = reactive([
  {
    title: "2024/06/01-600120-xxxxxx.sh",
    date: "data",
  },
  {
    title: "2024/06/02-600121-xxxxxx.sh",
    date: "data",
  },
  {
    title: "2024/06/03-600122-xxxxxx.sh",
    date: "data",
  },
  {
    title: "2024/06/04-600123-xxxxxx.sh",
    date: "data",
  },
  {
    title: "2024/06/05-600124-xxxxxx.sh",
    date: "data",
  },
]);

const activeKey = ref(['1']);
const changeActivekey = (key: string) => {
  console.log(key);
};

</script>
<style scoped>
.layout {
  margin: 0; /* 居中布局 */
  height: 100%;
  margin: 0;
  background: #ecf1f0;
}
.cardstyle {
  margin: 10px 5px;
  height: 500px;
  min-width: 47%;
  box-shadow: 5px 5px 4px rgba(0, 0, 0, 0.1);
}

::v-deep(.ant-collapse-content-active){
    background: #dfe4ea;
}
</style>
