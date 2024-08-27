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
            <a-select v-model:value="value" style="width: 100%" :placeholder="placeholder" :options="options"
              :show-arrow="false" @change="titleChange"></a-select>
          </div>
        </a-col>
        <a-col :span="6" style="display: flex;justify-content: flex-end;">
          <div class="functionalarea" >
            <a-range-picker :presets="rangePresets" @change="onRangeChange"  style="width: 15vw;"/>
          </div>
        </a-col>
      </a-row>
      <a-row>
        <a-col :span="24">
          <div class="cardscontent">
            <a-skeleton v-show="loadKLine" active :paragraph="{ rows: 15 }" />
            <CommonKlineChart v-if="!loadKLine" :stockCode="stockCode" :stockTitle="stockTitle" @closeSkeleton="handleEmitEven"
              ref="commonKlineChart" />
          </div>
        </a-col>
      </a-row>
    </a-layout-content>
    <a-float-button type="primary" :style="{ right: '20px', bottom: '20px' }" @click="openDrawer">
      <template #icon>
        <RadarChartOutlined />
      </template>
    </a-float-button>
    <a-drawer title="候选股" :width="520" :open="opendrawer" :body-style="{ paddingBottom: '80px' }"
      :footer-style="{ textAlign: 'right' }" @close="closeDrawer">
      <a-table :columns="columns" :data-source="tabledata">
        <template #emptyText>
          <a-empty description="暂无数据" />
        </template>
        <template #bodyCell="{ column, record }">
          <template v-if="column.dataIndex === 'operation'">
            <a-popconfirm v-if="tabledata.length" title="确认删除" ok-text="是" cancel-text="否"
              @confirm="onDeleteRecord(record.key)">
              <a>
                <DeleteIcon />
              </a>
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
import CommonKlineChart from "@/components/CommonKlineChart.vue";
import { ref, Ref, watch, nextTick, onMounted} from "vue";
import axios from "axios";
import dayjs, { Dayjs } from 'dayjs';

const checked = ref<boolean>(false);
const opendrawer = ref<boolean>(false);
const stockTitle = ref('');
// 标题选项控制
const titleChange = (value: string) => {
  stockCode.value = value.split(' ')[0];
  stockTitle.value = value;
};
const value = ref([]);

const options = ref([]);
let placeholder = ref('');
async function fetchOptions(startDate: string, endDate: string) {
  try {
    const response = await axios.post('/api/getStockAnalyseDate', {
      startDate: startDate,
      endDate: endDate
    });
    return response.data.data.rows.map((cell: any[]) => ({
      value: `${cell[0]} ${cell[1]} ${cell[2]}`
    }));
  } catch (error) {
    // 处理错误
    console.error('Failed to fetch data:', error);
    // throw error;
  }
}



// 获取最新交易日
const getLatestTradeDate = async () => {
  try {
    const response = await axios.get('/api/getLatestTradeDate');
    return response.data.data;
  } catch (error) {
    console.error('getLatestTradeDate Failed:', error);
  }
}

//日期选择器区
const rangePresets = ref([
  { label: 'Last 7 Days', value: [dayjs().add(-7, 'd'), dayjs()] },
  { label: 'Last 14 Days', value: [dayjs().add(-14, 'd'), dayjs()] },
  { label: 'Last 30 Days', value: [dayjs().add(-30, 'd'), dayjs()] },
  { label: 'Last 90 Days', value: [dayjs().add(-90, 'd'), dayjs()] },
]);
type RangeValue = [Dayjs, Dayjs];
const onRangeChange = async (dates: RangeValue, dateStrings: string[]) => {
  if (dates) {
    options.value = await fetchOptions(dateStrings[0], dateStrings[1]);
    placeholder.value = options.value[0].value;
  } else {
    console.log('Clear');
  }
};



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


//K线区
const stockCode = ref('')
const commonKlineChart = ref<InstanceType<typeof CommonKlineChart> | null>(null);
const loadKLine = ref<boolean>(true)
const handleEmitEven = () => {
  loadKLine.value = false;
}
watch(loadKLine, async () => {
  await nextTick();
  commonKlineChart.value.handleResize();
});


onMounted(async () => {
  const latestTradeDate = await getLatestTradeDate(); 
  options.value = await fetchOptions(latestTradeDate,latestTradeDate);
  placeholder.value = options.value[0].value;
  stockCode.value = placeholder.value.split(' ')[0]
  stockTitle.value = placeholder.value
  loadKLine.value = false;
})
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
