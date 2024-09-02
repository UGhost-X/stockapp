<template>
    <a-layout class="layout">

        <a-layout-content style="margin: 10px 10px 3px 10px">
            <a-row>
                <a-col :span="6">

                </a-col>
                <a-col :span="12">
                    <div class="functionalarea">
                        <a-select v-model:value="selectedValue" style="width: 100%" :options="options"
                            :show-arrow="false" :filterOption="filterOption" showSearch
                            @change="titleChange"></a-select>
                    </div>
                </a-col>
                <a-col :span="6" style="display: flex;justify-content: flex-end;">

                </a-col>
            </a-row>
            <a-row>
                <a-col :span="24" @keydown.enter="nextOption" tabindex="0" @wheel="handleEvent">
                    <div class="cardscontent">
                        <a-skeleton v-show="loadKLine" active :paragraph="{ rows: 15 }" />
                        <CommonKlineChart v-if="!loadKLine" :stockCode="stockCode" :stockTitle="stockTitle"
                            startDate="1900-01-01" endDate="2050-12-31" @closeSkeleton="handleEmitEven"
                            @click.middle="handleEvent" ref="commonKlineChart" />
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
                                        :datetime="item.datetime" class="comment-content-item" style="position: relative;">
                                        <!-- 添加删除图标 -->
                                        <DeleteOutlined @click="handleCommentDelete(item.uuid)"
                                            style="font-size:22px;position: absolute;right: 1vw;bottom: 10px;color: #c8161d;" />
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
                                    <a-button html-type="submit" :loading="submitting" type="primary"
                                        @click="handleCommentSubmit" style="margin-left: 30px;">
                                        发表
                                    </a-button>
                                </a-form-item>
                            </template>
                        </a-comment>
                    </div>
                </a-col>
            </a-row>
        </a-layout-content>


    </a-layout>

</template>
<script setup lang="ts">
import { RadarChartOutlined, DeleteOutlined } from "@ant-design/icons-vue";
import CommonKlineChart from "@/components/CommonKlineChart.vue";
import { ref, Ref, watch, nextTick, onMounted } from "vue";
import axios from "axios";
import dayjs, { Dayjs } from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);

import 'dayjs/locale/zh-cn';
import { v4 as uuidv4 } from 'uuid';
// 设置 dayjs 的全局语言为中文
dayjs.locale('zh-cn');


const checked = ref<boolean>(false);
const stockTitle = ref('');

// 标题选项控制
const titleChange = (value: string) => {
    stockCode.value = value.split(' ')[0];
    stockTitle.value = value;
};
const selectedValue = ref('');

const options = ref<Option[]>([]);
interface Option {
    value: string;
}

const fetchOptions = async () => {
    try {
        const response = await axios.post('/api/getStockBasicInfoFromDB', {
            "fields": ["stock_code", "stock_ch_name"]
        });
        const rows = response.data.data;

        // 对结果进行排序
        const sortedRows = rows.sort((a, b) => {
            // 比较 stock_code 属性
            if (a.stock_code !== b.stock_code) {
                // 将 stock_code 转换为数字进行比较
                const numA = parseFloat(a.stock_code);
                const numB = parseFloat(b.stock_code);
                if (numA < numB) return -1;
                if (numA > numB) return 1;
            }

            // 如果 stock_code 相同，则比较 stock_ch_name
            const startsWith0Or6 = (str) => str.startsWith('0') || str.startsWith('6');
            const codeA = a.stock_code;
            const codeB = b.stock_code;
            if (startsWith0Or6(codeA)) return -1; // 0 或 6 开头的排在前面
            if (startsWith0Or6(codeB)) return 1;
            return a.stock_ch_name.localeCompare(b.stock_ch_name); // 其他情况按字母顺序排列
        });

        // 映射并排除包含 "." 的 stock_code
        return sortedRows
            .filter(cell => !cell.stock_code.includes('.'))
            .map(cell => ({
                value: `${cell.stock_code} ${cell.stock_ch_name}`
            }));

    } catch (error) {
        console.error('Failed to fetch data:', error);
    }
};

const filterOption = (input: string, option: { value: string; label: string }) => {
    return option.value.toLowerCase().includes(input.toLowerCase());
};

//K线区
const stockCode = ref('')
const commonKlineChart = ref<InstanceType<typeof CommonKlineChart> | null>(null);
const loadKLine = ref<boolean>(true)
const handleEmitEven = () => {
    loadKLine.value = false;
}
const nextOption = async () => {
    const currentIndex = options.value.findIndex(option => option.value === selectedValue.value);
    if (currentIndex === -1) return; // 如果当前值不在选项中，则不做任何事情
    // 从除当前索引外的所有索引中随机选择一个
    let nextIndex = currentIndex;
    while (nextIndex === currentIndex) {
        nextIndex = Math.floor(Math.random() * options.value.length);
    }

    selectedValue.value = options.value[nextIndex].value;
    const parts = selectedValue.value.split(' ');
    stockCode.value = parts[0];
    stockTitle.value = selectedValue.value;
    await fetchStockComments(stockCode.value, '1900-01-01', 'generalReview', 'UGhost');
};

const handleEvent = () => {
    nextOption()
}

watch(loadKLine, async () => {
    await nextTick();
    commonKlineChart.value.handleResize();
});

//评论区
type Comment = Record<string, string>;
const comments = ref<Comment[]>([]);
const submitting = ref<boolean>(false);
const commentValue = ref<string>('');
const handleCommentSubmit = async () => {
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
            analyseDate: '1900-01-01',
            analyseMethod: 'generalReview',
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
    const fetchedOptions = await fetchOptions();
    if (fetchedOptions && fetchedOptions.length > 0) {
        options.value = fetchedOptions;
        selectedValue.value = options.value[0]?.value;

        if (selectedValue.value) {
            const parts = selectedValue.value.split(' ');
            stockCode.value = parts[0];
            stockTitle.value = selectedValue.value;
        }
    }
    loadKLine.value = false;
    await fetchStockComments(stockCode.value, '1900-01-01', 'generalReview', 'UGhost');
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
    width: 95vw;
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