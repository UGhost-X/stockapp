<template>
  <a-layout class="layout">
    <a-layout-content style="margin: 10px 10px 5px 10px">
      <a-row :gutter="[16, 24]">
        <a-col :span="24">
          <div class="cardscontent">
            <a-skeleton v-show="loadingMainPannel" active :paragraph="{ rows: 8 }" />
            <KlineChart v-show="!loadingMainPannel" ref="klineChart" @closeSkeleton="changeSkeletonStatus" />
          </div>
        </a-col>
        <a-col :span="12">
          <div class="cardscontent">
            <a-skeleton v-show="loadingStockWarning" active :paragraph="{ rows: 5 }" />
            <CommonTable v-show="!loadingStockWarning" :columns="columns" :data="tabledata" :pagination="pagination" :tableTitle="tableTitle">
              <template #bodyCell="{ column, record }">
                <template v-if="column.dataIndex === 'operation'">
                  <a-popconfirm title="确认删除" ok-text="是" cancel-text="否" @confirm="onDeleteRecord(record.key)">
                    <a-icon type="delete" />
                  </a-popconfirm>
                </template>
              </template>
            </CommonTable>
          </div>
        </a-col>
        <a-col :span="12">
          <div class="cardscontent">
            <a-skeleton v-show="loadingStockHistoryMInWarning" active :paragraph="{ rows: 5 }" />
            <CommonTable v-show="!loadingStockHistoryMInWarning" :columns="columnsHist" :data="tabledataHist" :pagination="pagination" :tableTitle="tableTitleHist">
              <template #bodyCell="{ column, record }">
                <template v-if="column.dataIndex === 'operation'">
                  <a-popconfirm title="确认删除" ok-text="是" cancel-text="否" @confirm="onDeleteRecord(record.key)">
                    <a-icon type="delete" />
                  </a-popconfirm>
                </template>
              </template>
            </CommonTable>
          </div>
        </a-col>
      </a-row>
    </a-layout-content>
  </a-layout>
</template>

<script lang="ts" setup>
import { ref, watch, nextTick, onMounted, } from 'vue';
import KlineChart from '@/components/KlineChart.vue';
import CommonTable from '@/components/CommonTable.vue';
import axios from 'axios';

const loadingMainPannel = ref<boolean>(true);
const loadingStockWarning = ref<boolean>(true);
const loadingStockHistoryMInWarning = ref<boolean>(true);
const klineChart = ref<InstanceType<typeof KlineChart> | null>(null);

const changeSkeletonStatus = (data: boolean) => {
  loadingMainPannel.value = data;
}

watch(loadingMainPannel, async () => {
  await nextTick();
  klineChart.value.handleResize();
});


interface DataItem {
  key: string;
  [key: string]: string | number;
}

// 响应式变量定义
const columns = ref<DataItem[]>([]);
const columnsHist = ref<DataItem[]>([]);
const tabledata = ref<DataItem[]>([]);
const tabledataHist = ref<DataItem[]>([]);
const totalCount = ref<number>(0);
const pagination = ref({
  total: totalCount.value,
});
// 获取5日预警板数据的异步函数
const getStockWarningData = async (warningDate: String, warningCreteria: String) => {
  try {
    const response = await axios.post('/api/getStockWaringData', {
      warningDate: warningDate,
      warningCreteria: warningCreteria,
    });
    return response.data.data;
  } catch (error) {
    console.error('getStockWarningData Failed:', error);
  }
};

// 获取历史最低预警板数据的异步函数
const getStockHistoryMinWarningData = async (warningDate: String) => {
  try {
    const response = await axios.post('/api/getStockWaringhistoryMinData', {
      warningDate: warningDate,
    });
    return response.data.data;
  } catch (error) {
    console.error('getStockHistoryMinWarningData Failed:', error);
  }
};

// 获取最新交易日
const getLatestTradeDate = async () => {
  try {
    const response = await axios.get('/api/getLatestTradeDate');
    return response.data.data;
  } catch (error) {
    console.error('getLatestTradeDate Failed:', error);
  }
}

// 删除记录的函数
const onDeleteRecord = (key: string) => {
  tabledata.value = tabledata.value.filter(item => item.key !== key);
};

// 加载数据
const loadData = async () => {
  const latestTradeDate = await getLatestTradeDate();
  const warningData = await getStockWarningData(latestTradeDate, '5');
  if (warningData) {
    const tableHeaderChName = ['代码', '名称', '收盘价', '预警日期'];
    columns.value = warningData.headers.map((header: string, headIndex: number) => ({
      title: tableHeaderChName[headIndex],
      dataIndex: header.toLowerCase(),
      key: header.toLowerCase(),
    }));
    tabledata.value = warningData.rows.map((row: any, rowIndex: number) => {
      const item: DataItem = { key: rowIndex.toString() };
      row.forEach((cell: any, cellIndex: number) => {
        const key = warningData.headers[cellIndex].toLowerCase();
        item[key] = cell;
      });
      return item;
    });
  }
  totalCount.value = warningData.totalCount;
  loadingStockWarning.value = false;
};

// 加载数据
const loadHistoryMinData = async () => {
  const latestTradeDate = await getLatestTradeDate();
  const warningData = await getStockHistoryMinWarningData(latestTradeDate);
  if (warningData) {
    const tableHeaderChName = ['代码', '名称', '收盘价', '预警日期'];
    columnsHist.value = warningData.headers.map((header: string, headIndex: number) => ({
      title: tableHeaderChName[headIndex],
      dataIndex: header.toLowerCase(),
      key: header.toLowerCase(),
    }));
    tabledataHist.value = warningData.rows.map((row: any, rowIndex: number) => {
      const item: DataItem = { key: rowIndex.toString() };
      row.forEach((cell: any, cellIndex: number) => {
        const key = warningData.headers[cellIndex].toLowerCase();
        item[key] = cell;
      });
      return item;
    });
  }
  totalCount.value = warningData.totalCount;
  loadingStockHistoryMInWarning.value = false;
};


// 表格标题
const tableTitle = () => {
  return '5日预警';
};

const tableTitleHist = () => {
  return '历史最低预警';
};

// 在组件挂载后调用 loadData
onMounted(loadData);
onMounted(loadHistoryMinData);
</script>

<style scoped>
.cardscontent {
  border-radius: 10px;
  background: #fff;
  padding: 12px;
  overflow: hidden;
}


</style>