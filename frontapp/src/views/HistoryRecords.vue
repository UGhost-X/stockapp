<template>
  <!-- (index:number) => (index%2===1?'ant-table-row':null) -->
  <a-layout class="layout">
    <a-layout-content class="content">
      <a-table
        class="tablestyle"
        :columns="columns"
        :pagination="pagination"
        size="large"
        :scroll="{y:'calc(66vh)'}"
        :data-source="tabledata">
        <template #emptyText>
          <a-empty description="暂无数据" />
        </template>
        <template #bodyCell="{ column, record }">
          <template v-if="column.dataIndex === 'operation'">
            <a-popconfirm
              v-if="tabledata.length"
              title="确认删除"
              ok-text="是"
              cancel-text="否"
              @confirm="onDeleteRecord(record.key)">
              <a><DeleteIcon /></a>
            </a-popconfirm>
          </template>
        </template>
      </a-table>
      <!-- <a-pagination v-model:current="current" :total="500" /> -->
    </a-layout-content>
  </a-layout>
</template>
<script setup lang="ts">
import { onMounted, ref, Ref } from "vue";
import { computed } from "vue";
import type { TableProps } from "ant-design-vue";

// 表格控制区
const columns = [
  {
    title: "选中日期",
    dataIndex: "pickdate",
    key: "pickdate",
    align: "center",
    filters: [
      {
        text: "2024/01/02",
        value: "2024/01/02",
      },
    ],
  },
  {
    title: "代码",
    dataIndex: "code",
    key: "code",
    align: "center",
    filters: [
      {
        text: "60000x",
        value: "60000x",
      },
    ],
  },
  {
    title: "名称",
    dataIndex: "name",
    key: "code",
    align: "center",
    filters: [
      {
        text: "xxxxxx",
        value: "xxxxxx",
      },
    ],
  },
  {
    title: "当前涨幅",
    dataIndex: "currentlyshave",
    key: "currentlyshave",
    align: "center",
    sorter: true,
  },
  {
    title: "三日涨幅",
    dataIndex: "thirdday",
    key: "thirdday",
    align: "center",
    sorter: true,
  },
  {
    title: "七日涨幅",
    dataIndex: "thirdday",
    key: "seventhday",
    align: "center",
    sorter: true,
  },
  {
    title: "双周涨幅",
    dataIndex: "dualweeks",
    key: "dualweeks",
    align: "center",
    sorter: true,
  },
  {
    title: "10%达到日期",
    dataIndex: "10%arrivedate",
    key: "arrivedate",
    align: "center",
    sorter: true,
    width: 150,
  },
  {
    title: "耗费天数",
    dataIndex: "consumedays",
    key: "consumedays",
    align: "center",
    sorter: true,
  },
  {
    title: "操作",
    dataIndex: "operation",
    key: "operation",
    align: "center",
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
  },  {
    key: "1",
    code: "6020000",
    name: "xxxxxxx",
  },  {
    key: "1",
    code: "6020000",
    name: "xxxxxxx",
  },  {
    key: "1",
    code: "6020000",
    name: "xxxxxxx",
  },  {
    key: "1",
    code: "6020000",
    name: "xxxxxxx",
  },  {
    key: "1",
    code: "6020000",
    name: "xxxxxxx",
  },  {
    key: "1",
    code: "6020000",
    name: "xxxxxxx",
  },  {
    key: "1",
    code: "6020000",
    name: "xxxxxxx",
  },  {
    key: "1",
    code: "6020000",
    name: "xxxxxxx",
  },  {
    key: "1",
    code: "6020000",
    name: "xxxxxxx",
  },  {
    key: "1",
    code: "6020000",
    name: "xxxxxxx",
  },  {
    key: "1",
    code: "6020000",
    name: "xxxxxxx",
  },  {
    key: "1",
    code: "6020000",
    name: "xxxxxxx",
  },  {
    key: "1",
    code: "6020000",
    name: "xxxxxxx",
  },

]);
const onDeleteRecord = (key: string) => {
  tabledata.value = tabledata.value.filter((item) => item.key !== key);
};

const current = ref(6);

// const {
//   data: dataSource,
//   run,
//   loading,
//   current,
//   pageSize,
// } = usePagination(queryData, {
//   formatResult: res => res.data.results,
//   pagination: {
//     currentKey: 'page',
//     pageSizeKey: 'results',
//   },
// });


const pagination = computed(() => ({
  total: 200,
  current: 1, //current.value,
  pageSize: 10, //pageSize.value,
}));
</script>
<style scoped>

:deep(.ant-table-body){
  min-height: calc(66vh);
}

:deep(.ant-table-tbody) {
  background-color: rgba(255, 255, 255, 0.3);
}

:deep(.ant-table-wrapper .ant-table-pagination.ant-pagination) {
  /* position: relative; */
  padding: 15px 20px 15px 0;
  margin: 0;
  border-top: dashed 1px #ced6e0;
  /* bottom: 0px; */
  /* top: 20px; */
  /* bottom: 10px; */
  background: #ffffff;
}

.tablestyle {
  background-color: rgb(255, 255, 255);
  /* border: rgba(0, 0, 0, 0.1) solid 2px; */
  border-radius: 2px;
  max-height: calc(100vh - 83px);
  box-shadow: 5px 5px 4px rgba(0, 0, 0, 0.1);
}

.content {
  margin-top: 10px;
  /* border-style: solid;
  border-color: #ebebeb;
  border-width: 2px;
  border-radius: 15px; */
  /* height: 75vh; */
  min-height: 60vh;
  padding: 5px 5px;
}
</style>
