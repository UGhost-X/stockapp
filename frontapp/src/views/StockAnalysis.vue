<template>
  <a-layout class="layout">

    <a-layout-content style="margin: 10px 10px 3px 10px">
      <a-row>
        <a-col :span="6">
          <div class="functionalarea" style="padding-top: 5px">
            <a-switch v-model:checked="checked" checked-children="全部展示" un-checked-children="部分展示"
              @change="switchChangeEvent" />
          </div>
        </a-col>
        <a-col :span="12">
          <div class="functionalarea">
            <a-select v-model:value="selectedValue" style="width: 100%" :options="options" :show-arrow="false"
              :filterOption="filterOption" showSearch @change="titleChange"></a-select>
          </div>
        </a-col>
        <a-col :span="6" style="display: flex;justify-content: flex-end;">
          <a-config-provider :locale="zhCN">
            <div class="functionalarea">
              <a-range-picker :presets="rangePresets" @change="onRangeChange" style="width: 20vw; max-width: 300px;" />
            </div>
          </a-config-provider>
        </a-col>
      </a-row>
      <a-row>
        <a-col :span="24" @keydown.enter="nextOption" tabindex="0">
          <div class="cardscontent">
            <a-skeleton v-show="loadKLine" active :paragraph="{ rows: 15 }" />
            <CommonKlineChart v-if="!loadKLine" :stockCode="stockCode" :stockTitle="stockTitle" :endDate="endDate"
              @closeSkeleton="handleEmitEven" @contextmenu="showModal" ref="commonKlineChart" />
            <a-modal v-model:open="addCandidatorModal" title="是否加入后选股" centered @ok="handleModalOkEven">
              <span> 是否加入后续股 </span>
            </a-modal>
          </div>
        </a-col>
      </a-row>
      <a-row>
        <a-col :span="24">
          <div class="comment" style="margin-top: 20px">
            <div class="comment-title">评论区</div>
            <a-list v-if="comments.length" :data-source="comments">
              <template #renderItem="{ item }">
                <a-list-item class="comment-content">
                  <a-comment :author="item.author" :avatar="item.avatar" :content="item.content"
                    :datetime="item.datetime" class="comment-content-item">
                    <!-- 添加删除图标 -->
                    <DeleteOutlined @click="handleCommentDelete(item.uuid)" style="font-size:22px;" />
                  </a-comment>
                </a-list-item>
              </template>
            </a-list>
            <a-comment>
              <template #content>
                <a-form-item>
                  <div style="margin: 0 28px;">
                    <a-textarea v-model:value="commentValue" :rows="4" style="" />
                  </div>

                </a-form-item>
                <a-form-item>
                  <a-button html-type="submit" :loading="submitting" type="primary" @click="handleSubmit" style="margin-left: 30px;">
                    发表
                  </a-button>
                </a-form-item>
              </template>
            </a-comment>
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
      <a-table :columns="columns" :data-source="tabledata" :customRow="handleClickRow">
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
      <div style="position: absolute; bottom: 40px;">
        <a-space>
          <a-button type="primary" @click="openCandidatorModal" :loading='candidatorButtonloading'>候选确认</a-button>
          <a-button type="primary" @click="saveData">候选暂存</a-button>
          <a-button danger @click="clearTable">候选清空</a-button>
        </a-space>
      </div>
      <a-modal v-model:open="setCandidatorModal" title="候选股确认" centered @ok="closeCandidatorModal">
        <p>确认保存后选股数据？</p>
      </a-modal>
    </a-drawer>
  </a-layout>

</template>
<script setup lang="ts">
import { RadarChartOutlined, DeleteOutlined } from "@ant-design/icons-vue";
import DeleteIcon from "@/components/DeleteIcon.vue";
import CommonKlineChart from "@/components/CommonKlineChart.vue";
import { ref, Ref, watch, nextTick, onMounted, onBeforeUnmount } from "vue";
import axios from "axios";
import dayjs, { Dayjs } from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);
import { message } from 'ant-design-vue';
import zhCN from 'ant-design-vue/es/locale/zh_CN';
import 'dayjs/locale/zh-cn';
import { v4 as uuidv4 } from 'uuid';
// 设置 dayjs 的全局语言为中文
dayjs.locale('zh-cn');


const checked = ref<boolean>(false);
const opendrawer = ref<boolean>(false);
const stockTitle = ref('');
const endDate = ref('2050-12-31')
//switch按钮区
const switchChangeEvent = (e: boolean) => {
  if (!e) {
    endDate.value = stockTitle.value.split(' ')[2]
  } else {
    endDate.value = '2050-12-31'
  }

}
const switchHotkey = (event: KeyboardEvent) => {
  if (event.ctrlKey && event.altKey && event.key === '%' && event.shiftKey) {
    checked.value = !checked.value;
    if (!checked.value) {
      endDate.value = stockTitle.value.split(' ')[2]
    } else {
      endDate.value = '2050-12-31'
    }
  }
};
// 标题选项控制
const titleChange = (value: string) => {
  stockCode.value = value.split(' ')[0];
  stockTitle.value = value;
  if (!checked.value) {
    endDate.value = stockTitle.value.split(' ')[2]
  } else {
    endDate.value = '2050-12-31'
  }
};
const selectedValue = ref('');

const options = ref<Option[]>([]);
interface Option {
  value: string;
}


const fetchOptions = async (startDate: string, endDate: string) => {
  try {
    const response = await axios.post('/api/getStockAnalyseDate', {
      startDate: startDate,
      endDate: endDate
    });
    const rows = response.data.data.rows;

    // 对结果进行排序
    const sortedRows = rows.sort((a: any, b: any) => {
      // 首先比较 cell[2] 的日期字符串
      if (a[2] !== b[2]) {
        return a[2].localeCompare(b[2]);
      }

      // 如果日期相同，则比较 cell[0]
      const startsWith0Or6 = (str: string) => str.startsWith('0') || str.startsWith('6');
      if (startsWith0Or6(a[0])) return -1; // 0 或 6 开头的排在前面
      if (startsWith0Or6(b[0])) return 1;
      return a[0].localeCompare(b[0]); // 其他情况按字母顺序排列
    });

    return sortedRows.map((cell: any[]) => ({
      value: `${cell[0]} ${cell[1]} ${cell[2]}`
    }));
  } catch (error) {
    console.error('Failed to fetch data:', error);
  }
};

const filterOption = (input: string, option: { value: string; label: string }) => {
  return option.value.toLowerCase().includes(input.toLowerCase());
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

// 定义预设日期范围
const rangePresets = ref([
  {
    label: '最近三天',
    value: [dayjs().subtract(3, 'day'), dayjs()],
  },
  {
    label: '最近一周',
    value: [dayjs().subtract(1, 'week'), dayjs()],
  },
  {
    label: '最近两周',
    value: [dayjs().subtract(2, 'week'), dayjs()],
  },
  {
    label: '最近一个月',
    value: [dayjs().subtract(1, 'month'), dayjs()],
  },
]);
type RangeValue = [Dayjs, Dayjs];
const onRangeChange = async (dates: RangeValue, dateStrings: string[]) => {
  if (dates) {
    options.value = await fetchOptions(dateStrings[0], dateStrings[1]);
    if (!options || options.value === undefined) {
      message.error("日期切换失败，没有获取到 options")
      return
    }
    selectedValue.value = options.value[0].value;
    if (selectedValue.value) {
      const parts = selectedValue.value.split(' ');
      stockCode.value = parts[0];
      stockTitle.value = selectedValue.value;
    }

    if (!checked.value) {
      endDate.value = stockTitle.value.split(' ')[2]
    } else {
      endDate.value = '2050-12-31'
    }

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
    title: "选择日期",
    dataIndex: "date",
    key: "date",
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

const handleClickRow = (record: any) => {
  return {
    onDblclick: () => {
      selectedValue.value = record.key;
      const parts = selectedValue.value.split(' ');
      stockCode.value = parts[0];
      stockTitle.value = selectedValue.value;
      if (!checked.value) {
        endDate.value = stockTitle.value.split(' ')[2]
      } else {
        endDate.value = '2050-12-31'
      }
    }

  }
}

interface DataItem {
  key: string;
  code: string;
  name: string;
  date: string;
}
const candidatorButtonloading = ref<boolean>(false);
const saveData = () => {
  localStorage.setItem('tabledata', JSON.stringify(tabledata.value));
}
const loadData = () => {
  const savedData = localStorage.getItem('tabledata');
  if (savedData) {
    tabledata.value = JSON.parse(savedData);
  }
};
const clearTable = () => {
  tabledata.value = [];
  localStorage.removeItem('tabledata');
};
const tabledata: Ref<DataItem[]> = ref([]);



//更新股票标记数据
const updateStockAnalyseIsMarkStatus = async (code: string, analyseDate: string, analyseMethod: string, isMark: number) => {
  try {
    const response = await axios.post('/api/updateStockAnalyseIsMarkStatus', {
      code: code,
      analyseDate: analyseDate,
      analyseMethod: analyseMethod,
      isMark: isMark,
    });
    return response.status;
  } catch (error) {
    console.error('updateStockAnalyseIsMarkStatus Failed:', error);
    return { status: 500 };
  }
}
const onDeleteRecord = (key: string) => {
  tabledata.value = tabledata.value.filter((item) => item.key !== key);
};
const setCandidatorModal = ref<boolean>(false)
const openCandidatorModal = () => {
  setCandidatorModal.value = true;
  candidatorButtonloading.value = true;
}

const closeCandidatorModal = async () => {
  setCandidatorModal.value = false;
  for (const item of tabledata.value) {
    const { code, date } = item;
    const analyseMethod = 'volumnEnerge';
    const isMark = 1;
    const status = await updateStockAnalyseIsMarkStatus(code, date, analyseMethod, isMark);
    if (status !== 200) {
      candidatorButtonloading.value = false;
      message.error('候选股标记失败')
    } else {
      candidatorButtonloading.value = false;
      message.success('候选股标记成功')
    }
  }
}
//K线区
const stockCode = ref('')
const commonKlineChart = ref<InstanceType<typeof CommonKlineChart> | null>(null);
const loadKLine = ref<boolean>(true)
const handleEmitEven = () => {
  loadKLine.value = false;
}
const nextOption = () => {
  const currentIndex = options.value.findIndex(option => option.value === selectedValue.value);
  if (currentIndex === -1) return; // 如果当前值不在选项中，则不做任何事情
  const nextIndex = (currentIndex + 1) % options.value.length;
  selectedValue.value = options.value[nextIndex].value;
  const parts = selectedValue.value.split(' ');
  stockCode.value = parts[0];
  stockTitle.value = selectedValue.value;
  checked.value = false
  if (!checked.value) {
    endDate.value = stockTitle.value.split(' ')[2]
  } else {
    endDate.value = '2050-12-31'
  }

}

watch(loadKLine, async () => {
  await nextTick();
  commonKlineChart.value.handleResize();
});


const addCandidatorModal = ref<boolean>(false);
const showModal = (e: MouseEvent) => {
  e.preventDefault();
  addCandidatorModal.value = true;

}
const handleModalOkEven = () => {
  addCandidatorModal.value = false;
  const newData: DataItem = {
    key: stockTitle.value,
    code: stockCode.value,
    name: stockTitle.value.split(' ')[1],
    date: stockTitle.value.split(' ')[2],
  };
  const isDuplicate = tabledata.value.some(item => item.key === newData.key);
  if (isDuplicate) {
    console.warn(`Duplicate key found: ${newData.key}`);
    return;
  }
  tabledata.value.push(newData);
}

//评论区
type Comment = Record<string, string>;

const comments = ref<Comment[]>([]);
const submitting = ref<boolean>(false);
const commentValue = ref<string>('');
const handleSubmit = async () => {
  if (!commentValue.value) {
    return;
  }
  submitting.value = true;
  try {
    comments.value = [
      {
        uuid: uuidv4(),
        author: 'UGhost',
        content: commentValue.value,
        datetime: dayjs().fromNow(),
      },
      ...comments.value,
    ];
    await axios.post('/api/addStockCommentData', {
      uuid: comments.value[0].uuid,
      code: stockCode.value,
      analyseDate: selectedValue.value.split(' ')[2],
      analyseMethod: 'volumnEnerge',
      author: 'UGhost',
      commentContent: commentValue.value,
    });
    commentValue.value = '';
  } catch (error) {
    console.error('Failed to submit comment:', error);
  } finally {
    submitting.value = false;
  }
};

// 获取股票评论
const fetchStockComments = async (code: string, analyseDate: string, analyseMethod: string, author: string) => {
  try {
    const response = await axios.post('/api/getStockCommentData', {
      code: code,
      analyseDate: analyseDate,
      analyseMethod: analyseMethod,
      author: author
    });
    comments.value = response.data.data.map((comment: Comment) => {
      const pubTime = dayjs(comment.pub_time);
      const timeFromNow = pubTime.fromNow();
      const isOlderThanTenMinutes = dayjs().diff(pubTime, 'minute') > 10;
      const formattedTime = isOlderThanTenMinutes ? pubTime.format('YYYY-MM-DD HH:mm') : timeFromNow;

      return {
        ...comment,
        datetime: formattedTime,
      };
    });
  } catch (error) {
    console.error('Failed to fetch comments:', error);
  }
};

//删除股票评论
const handleCommentDelete = async (uuid: string) => {
  try {
    await axios.post('/api/deleteStockCommentData', {
      uuid: uuid
    });
    // 从前端列表中移除对应评论
    comments.value = comments.value.filter((comment) => comment.uuid !== uuid);
  } catch (error) {
    console.error('Failed to delete comment:', error);
  }
}


onMounted(async () => {
  let latestTradeDate = await getLatestTradeDate();

  while (true) {
    const fetchedOptions = await fetchOptions(latestTradeDate, latestTradeDate);

    if (fetchedOptions && fetchedOptions.length > 0) {
      options.value = fetchedOptions;
      selectedValue.value = options.value[0]?.value;

      if (selectedValue.value) {
        const parts = selectedValue.value.split(' ');
        stockCode.value = parts[0];
        stockTitle.value = selectedValue.value;
      }
      break;
    } else {
      // 如果没有获取到数据，则将日期减去一天
      latestTradeDate = dayjs(latestTradeDate).subtract(1, 'day').format('YYYY-MM-DD');
      // 等待一段时间后重新尝试获取数据
      await new Promise(resolve => setTimeout(resolve, 1000)); // 等待1秒
    }
  }
  loadKLine.value = false;
  loadData();
  await fetchStockComments(stockCode.value, selectedValue.value.split(' ')[2], 'volumnEnerge', 'UGhost');
  window.addEventListener('keydown', switchHotkey);
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', switchHotkey);
});
</script>
<style scoped>
.layout {
  overflow: hidden;
}

.functionalarea {
  margin-bottom: 10px;
}

.cardscontent {
  border-radius: 0 0 10px 10px;
  background: #fff;
  padding: 12px;
}

.comment {
  border-radius: 10px 10px 10px 10px;
  background: #fff;
  padding: 12px;
}

.comment-title {
  font-size: 24px;
  height: 48px;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px 0 40px 0;
}

.comment-content {
  background-color: #d5ebe1;
  border-radius: 20px;
  margin: 10px 30px;
}

.comment-content-item {
  margin: 10px 0;
}

:deep(.ant-comment-content-author-name) {
  font-size: 18px !important;
}

:deep(.ant-comment-content-author-time) {
  font-size: 18px !important;
}

:deep(.ant-comment-content-detail) {
  font-size: 22px !important;
  padding: 5px 0;
}

/* enter 事件需要提供一个聚焦，聚焦产生的黑框通过这个去除 */
.ant-col:focus {
  outline: none;
}
</style>
