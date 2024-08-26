<template>
  <a-layout class="layout">
    <a-layout-content style="margin: 10px 10px 3px 10px">
      <a-row>
        <a-col :span="6">
          <div class="functionalarea" style="padding-top: 5px">
            <a-switch v-model:checked="checked" />
          </div>
        </a-col>
        <a-col :span="12">
          <div class="functionalarea">
            <a-select
              v-model:value="value"
              style="width: 100%"
              placeholder="6022222 xxxxxx"
              :options="options"
              :show-arrow="false"
              @change="titleChange"
            ></a-select>
          </div>
        </a-col>
        <a-col :span="6">
          <div class="functionalarea">
            <!-- <a-switch v-model:checked="checked" /> -->
          </div>
        </a-col>
      </a-row>
      <a-row>
        <a-col :span="24">
          <div class="cardscontent">
            <a-skeleton active :paragraph="{ rows: 15 }" />
          </div>
        </a-col>
      </a-row>
    </a-layout-content>
    <a-float-button
      type="primary"
      :style="{ right: '20px', bottom: '20px' }"
      @click="openDrawer"
    >
      <template #icon>
        <RadarChartOutlined />
      </template>
    </a-float-button>
    <a-drawer
      title="候选股"
      :width="520"
      :open="opendrawer"
      :body-style="{ paddingBottom: '80px' }"
      :footer-style="{ textAlign: 'right' }"
      @close="closeDrawer"
    >
      <a-table :columns="columns" :data-source="tabledata">
        <template #emptyText>
          <a-empty description="暂无数据"/>
        </template>
        <template #bodyCell="{ column, record }">
          <template v-if="column.dataIndex === 'operation'">
            <a-popconfirm
              v-if="tabledata.length"
              title="确认删除"
              ok-text="是"
              cancel-text="否"
              @confirm="onDeleteRecord(record.key)"
            >
              <a><DeleteIcon /></a>
            </a-popconfirm>
          </template>
        </template>
      </a-table>
    </a-drawer>
  </a-layout>
</template>
<script setup lang="ts">
import { RadarChartOutlined } from "@ant-design/icons-vue";
import DeleteIcon from "@/components/DeleteIcon.vue";
import { ref,Ref } from "vue";

const checked = ref<boolean>(false);
const opendrawer = ref<boolean>(false);

// 标题选项控制
const titleChange = (value: string) => {
  console.log(`selected ${value}`);
};
const value = ref([]);
const options = [...Array(25)].map((_, i) => ({
  value: (i + 10).toString(36) + (i + 1),
}));

// 候选股记录展示控制
const closeDrawer = () => {
  opendrawer.value = false;
};

const openDrawer = () => {
  opendrawer.value = true;
};
// 抽屉表格控制区
const columns = [
  {
    title: "代码",
    dataIndex: "code",
    key: "code",
    ellipsis: true,
    align: "center",
    width: 80,
  },
  {
    title: "名称",
    dataIndex: "name",
    key: "name",
    width: 120,
    ellipsis: true,
    align: "center",
  },
  {
    title: "操作",
    dataIndex: "operation",
    key: "operation",
    align: "center",
    width: 50,
  },
];

interface DataItem {
  key: string;
  code: string;
  name: string;
}

const tabledata: Ref<DataItem[]> = ref([
  {
    key: "1",
    code: "6020000",
    name: "xxxxxxx",
  },
]);

const onDeleteRecord = (key: string) => {
  tabledata.value = tabledata.value.filter((item) => item.key !== key);
};

// const showTableEmpty = {
//   emptyText:Empty.PRESENTED_IMAGE_DEFAULT
// }
</script>
<style scoped>
.functionalarea {
  margin-bottom: 10px;
}
.cardscontent {
  border-radius: 0 0 10px 10px;
  background: #fff;
  padding: 12px;
}
</style>
