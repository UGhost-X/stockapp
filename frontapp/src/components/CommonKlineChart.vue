<template>
    <article class="main" @mousewheel="scrollWheelEvent">
        <section ref="chartContainer" class="chart">
        </section>
    </article>
</template>

<script setup>
import { ref, onMounted, watch, defineProps, defineEmits, reactive } from 'vue';
import { debounce } from 'lodash';
import * as echarts from 'echarts/core';
import 'vue3-toastify/dist/index.css';
import {
    ToolboxComponent,
    TooltipComponent,
    GridComponent,
    VisualMapComponent,
    LegendComponent,
    BrushComponent,
    DataZoomComponent,
    TitleComponent
} from 'echarts/components';
import { CandlestickChart, LineChart, BarChart } from 'echarts/charts';
import { UniversalTransition } from 'echarts/features';
import { CanvasRenderer } from 'echarts/renderers';
import axios from 'axios';
echarts.use([
    ToolboxComponent,
    TooltipComponent,
    GridComponent,
    VisualMapComponent,
    LegendComponent,
    BrushComponent,
    DataZoomComponent,
    CandlestickChart,
    LineChart,
    BarChart,
    CanvasRenderer,
    UniversalTransition,
    TitleComponent
]);

// Define props
const props = defineProps({
    stockCode: String,
    startDate: {
        type: String,
        default: '2020-01-01'
    },
    endDate: {
        type: String,
        default: '2050-01-30'
    },
    stockTitle: String
});

const chartContainer = ref();
const storeData = reactive([])
const startValue = ref(0)
const endValue = ref(100)
const stockSelectIndex = ref(0)
let nowDataZoomStartIndex;
let nowDataZoomEndIndex;
const switchValue = ref(false)

const emit = defineEmits(['closeSkeleton', 'errorFetchingData']);


let myChart;

const getStockInfoForCondidator = async (stockCode, startDate, endDate) => {
    try {
        const response = await axios.post('api/getKlineDateFromDB', {
            code: stockCode,
            startDate: startDate,
            endDate: endDate
        });
        storeData.length = 0;
        storeData.push(...response.data.data);
        startValue.value = storeData.length - 160;
        endValue.value = storeData.length;
    } catch (error) {
        console.error('Error fetching stock info:', error);
        emit('errorFetchingData', error);
    }
}

const nextStockSelectIndex = (e) => {
    if (e.ctrlKey === false) {
        if (e.wheelDeltaY < 0) {
            stockSelectIndex.value++
        } else {
            stockSelectIndex.value--
        }
        if (stockSelectIndex.value > storeData.length - 1) {
            stockSelectIndex.value = 0
        }
        if (stockSelectIndex.value < 0) {
            stockSelectIndex.value = storeData.length - 1
        }
        switchValue.value = false
    }
}
const scrollWheelEvent = debounce(nextStockSelectIndex, 500);

const splitData = (rawData) => {
    let categoryData = [];
    let values = [];
    let volumes = [];

    for (let i = 0; i < rawData.length; i++) {
        categoryData.push(rawData[i].splice(0, 1)[0]);
        values.push(rawData[i]);
        volumes.push([i, rawData[i][5], rawData[i][4] >= 0 ? 1 : -1]);
    }
    return {
        categoryData: categoryData,
        values: values,
        volumes: volumes
    };
}
//格式化y轴数字
const formatNumber = new Intl.NumberFormat('en-US', {
    notation: 'compact', // 使用紧凑表示法，如 1.23k, 4.56M
    maximumFractionDigits: 2 // 最多保留两位小数
});
const chartOption = (data, startValue, endValue, stocktitle) => {
    return {
        title: {
            text: stocktitle,
            left: 'center',
            top: 'top',
            textStyle: {
                color: '#333',
                fontSize: 18,
                fontWeight: 'bold'
            }
        },
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'cross'
            },
            borderWidth: 1,
            borderColor: '#ccc',
            padding: 10,
            textStyle: {
                color: '#000'
            },
            position: function (pos, params, el, elRect, size) {
                const obj = {
                    top: 10
                };
                obj[['left', 'right'][+(pos[0] < size.viewSize[0] / 2)]] = pos[0] < size.viewSize[0] / 2 ? size.viewSize[0] / 30 : size.viewSize[0] / 6;
                return obj;
            },

            formatter: function (data) {
                let result = '';
                let content = '';
                let pointDate = ''
                data.map((item, index) => {
                    let marker = item.marker;
                    let markerSub = '';
                    let seriesName = item.seriesName;
                    pointDate = item.axisValue
                    let name = ['开盘价', '收盘价', '最低价', '最高价', '涨幅']
                    if (item.data.empty) {
                        result = ''
                    } else {
                        if (index === 0 && item.componentIndex === 0) {
                            content += `<span style='font-size:16px;'>${pointDate}</span><br/>`
                            content += `<span style='font-size:16px;'>${marker} ${seriesName}</span><br/>`
                            markerSub = marker.replaceAll('10px', '5px')
                            for (let i = 0; i < item.data.length - 2; i++) {
                                content += `${markerSub} ${name[i]}<div style='font-size:16px; float:right;font-weight: bold;font-family: 微软雅黑'>${item.data[i + 1]}</div><br/>`
                            }
                            return
                        }

                        if (index === 1 && item.componentIndex === 0) {
                            content += `<span style='font-size:16px;'>${marker} ${seriesName}</span><br/>`
                            markerSub = marker.replaceAll('10px', '5px')
                            for (let i = 0; i < item.data.length - 2; i++) {
                                content += `${markerSub} ${name[i]}<div style='font-size:16px; float:right;font-weight: bold;font-family: 微软雅黑'>${item.data[i + 1]}</div><br/>`
                            }
                            return
                        }

                        if (seriesName !== 'Volume' && seriesName !== 'upCount') {
                            content += `${marker} ${seriesName}<div style='font-size:16px; float:right;font-weight: bold;font-family: 微软雅黑'>${item.data}</div><br/>`
                        }
                        if (seriesName === 'MA169') {
                            content += `<br/>`
                        }
                        if (seriesName === 'Volume') {
                            content += `<span style='font-size:16px;'>${pointDate}</span><br/>`
                            content += `<span style='font-size:16px;'>${marker}  交易量</span><div style='font-size:16px; float:right;font-weight: bold;font-family: 微软雅黑'>${formatNumber.format(item.data[1])}</div><br/><br/>`
                        }
                        if (seriesName === 'upCount') {
                            content += `<span style='font-size:16px;'>${pointDate}</span><br/>`
                            content += `<span style='font-size:16px;'>${marker}  上涨家数</span><div style='font-size:16px; float:right;font-weight: bold;font-family: 微软雅黑'>${item.data}</div><br/><br/>`
                        }

                    }

                    result = `${content}`;

                })

                return result;
            }

        },
        axisPointer: {
            type: 'cross',
            link: [
                {
                    xAxisIndex: 'all'
                }
            ],
            label: {
                backgroundColor: '#777'
            }
        },
        legend: {
            data: ['MA5', 'MA21', 'MA169'],
            bottom: '0%',
            show: false
        },

        animation: true,

        visualMap: {
            show: true,
            seriesIndex: 4,
            dimension: 2,
            pieces: [
                {
                    value: 1,
                    color: '#EC0000'
                },
                {
                    value: -1,
                    color: '#2ECC71'
                }
            ]
        },
        grid: [{
            left: '15%',
            right: '2%',
            bottom: '20%',
            top: '5%'
        },
        {
            left: '15%',
            right: '2%',
            top: '85%',
            height: '10%'
        }],

        xAxis: [
            {
                type: 'category',
                data: data.categoryData,
                boundaryGap: false,
                axisLine: { onZero: false },
                splitLine: { show: false },
                min: 'dataMin',
                max: 'dataMax',
                axisPointer: {
                    z: 100
                },
                show: true
            },
            {
                type: 'category',
                gridIndex: 1,
                data: data.categoryData,
                boundaryGap: false,
                axisLine: { onZero: false },
                axisTick: { show: false },
                splitLine: { show: false },
                axisLabel: { show: false },
                min: 'dataMin',
                max: 'dataMax'
            }
        ],
        yAxis: [
            {
                scale: true,
                splitArea: {
                    show: true
                }
            },
            {
                scale: true,
                gridIndex: 1,
                splitNumber: 3,
                axisLabel: { show: false },
                axisLine: { show: false },
                axisTick: { show: false },
                splitLine: { show: false },
                axisPointer: {
                    label: {
                        formatter: (params) => {
                            return formatNumber.format(params.value)
                        }
                    }
                }
            }
        ],
        // start、end 可以调节底部滑块的位置，百分比的形式
        dataZoom: [
            {
                type: 'inside',
                startValue: startValue,
                endValue: endValue,
            },
            {
                show: false,
                xAxisIndex: [0, 1],
                type: 'slider',
                top: '85%',
                startValue: startValue,
                endValue: endValue
            }
        ],
        series: [
            {
                name: '日K',
                type: 'candlestick',
                data: data.values,
                itemStyle: {
                    color: '#ec0000',
                    color0: '#2ecc71',
                    borderColor: '#8A0000',
                    borderColor0: '#008F28'
                }
            },
            {
                name: 'MA5',
                type: 'line',
                data: calculateMA(5, data),
                smooth: true,
                showSymbol: false,
                lineStyle: {
                    opacity: 1
                }
            },
            {
                name: 'MA21',
                type: 'line',
                data: calculateMA(21, data),
                showSymbol: false,
                smooth: true,
                lineStyle: {
                    opacity: 1
                }
            },
            {
                name: 'MA169',
                type: 'line',
                data: calculateMA(169, data),
                showSymbol: false,
                smooth: true,
                lineStyle: {
                    opacity: 1
                }
            },
            {
                name: 'Volume',
                type: 'bar',
                xAxisIndex: 1,
                yAxisIndex: 1,
                data: data.volumes
            }
        ]
    }
}

const calculateMA = (dayCount, data) => {
    var result = [];
    var ret;
    for (var i = 0, len = data.values.length; i < len; i++) {
        if (i < dayCount) {
            result.push('-');
            continue;
        }
        var sum = 0;
        for (var j = 0; j < dayCount; j++) {
            sum += data.values[i - j][1];
        }
        ret = sum / dayCount
        result.push(ret.toFixed(2));
    }
    return result;
}
const chartTitle = ref('')
const chartData = ref([])
const initChart = async (stockCode, startDate, endDate) => {
    if (myChart != null && myChart !== "" && myChart !== undefined) {
        myChart.dispose();//销毁
    }
    myChart = echarts.init(chartContainer.value);
    await getStockInfoForCondidator(stockCode, startDate, endDate)
    chartData.value = splitData(storeData)
    startValue.value = storeData.length - 200
    nowDataZoomStartIndex = startValue.value
    endValue.value = storeData.length
    nowDataZoomEndIndex = endValue.value
    myChart.setOption(chartOption(chartData.value, startValue.value, endValue.value, props.stockTitle));
};

watch(() => [props.stockCode, props.startDate, props.endDate], async () => {
    await initChart(props.stockCode, props.startDate, props.endDate);
    chartTitle.value = props.stockTitle;
}, { immediate: false });

const handleResize = () => {
    if (myChart) {
        myChart.resize();
    }
};
window.addEventListener('resize', handleResize);
defineExpose({ handleResize });


onMounted(async () => {
    await initChart(props.stockCode, props.startDate, props.endDate, props.stockTitle);
    chartTitle.value = props.stockTitle;
    let nowDataIndex;

    //鼠标在图上移动时的回调函数
    const getDataIndex = (param) => {
        nowDataIndex = param.dataIndex;
    }
    const getDatazoom = (param) => {
        // 手动移动的时候这个datazoom对象没有batch
        if (param.batch === undefined) {
            nowDataZoomStartIndex = param.startValue
            nowDataZoomEndIndex = param.endValue
            return
        }
        nowDataZoomStartIndex = (param.batch[0].start / 100) * (storeData.length - 1)
        nowDataZoomEndIndex = (param.batch[0].end / 100) * (storeData.length - 1)
    }
    myChart.on('showTip', debounce(getDataIndex, 100))
    myChart.on('dataZoom', debounce(getDatazoom, 500))
    //键盘的监听事件需要单独加,37表示左移，39对应右移 38向上 40向下
    document.onkeydown = function (e) {
        // 向左键 --》控制左移 如果按住ctrl一次移动7格
        if (e.keyCode === 37) {
            // 判断是否按了ctrl键
            nowDataIndex = e.ctrlKey === true ? nowDataIndex - 7 : nowDataIndex - 1;
            if (nowDataIndex < 0) {
                nowDataIndex = 0;
            }
            // 判断是否需要平移窗口
            if (nowDataIndex < nowDataZoomStartIndex) {
                nowDataZoomStartIndex = nowDataIndex;
                nowDataZoomEndIndex = nowDataZoomStartIndex + 160;
            }
            myChart.dispatchAction({
                type: 'showTip',
                seriesIndex: 0,
                dataIndex: nowDataIndex
            });
            myChart.dispatchAction({
                type: 'dataZoom',
                startValue: nowDataZoomStartIndex,
                endValue: nowDataZoomEndIndex
            });
            // 阻止事件冒泡
            e.stopPropagation();
        }

        // 向右键 --》控制右移
        if (e.keyCode === 39) {
            nowDataIndex = e.ctrlKey === true ? nowDataIndex + 7 : nowDataIndex + 1;
            if (nowDataIndex > storeData.length - 1) {
                nowDataIndex = storeData.length - 1;
            }
            if (nowDataIndex > nowDataZoomEndIndex) {
                nowDataZoomEndIndex = nowDataIndex;
                nowDataZoomStartIndex = nowDataZoomEndIndex - 160;
            }
            myChart.dispatchAction({
                type: 'showTip',
                seriesIndex: 0,
                dataIndex: nowDataIndex
            });
            myChart.dispatchAction({
                type: 'dataZoom',
                startValue: nowDataZoomStartIndex,
                endValue: nowDataZoomEndIndex
            });
            // 阻止事件冒泡
            e.stopPropagation();
        }

        // 向上键 --》放大
        if (e.keyCode === 38) {
            nowDataZoomStartIndex = nowDataZoomStartIndex + 2;
            if (nowDataZoomStartIndex > nowDataIndex - 2) {
                nowDataZoomStartIndex = nowDataIndex - 2;
            }
            nowDataZoomEndIndex = nowDataZoomEndIndex - 2;

            if (nowDataZoomEndIndex < nowDataIndex + 2) {
                nowDataZoomEndIndex = nowDataIndex + 2;
            }

            if (nowDataZoomEndIndex - nowDataZoomStartIndex === 4) {
                nowDataZoomStartIndex = nowDataIndex;
                nowDataZoomEndIndex = nowDataIndex;
            }
            myChart.dispatchAction({
                type: 'dataZoom',
                startValue: nowDataZoomStartIndex,
                endValue: nowDataZoomEndIndex
            });
            // 阻止事件冒泡
            e.stopPropagation();
        }

        // 向下键 --》缩小
        if (e.keyCode === 40) {
            nowDataZoomStartIndex = nowDataZoomStartIndex - 5;
            nowDataZoomEndIndex = nowDataZoomEndIndex + 5;
            myChart.dispatchAction({
                type: 'dataZoom',
                startValue: nowDataZoomStartIndex,
                endValue: nowDataZoomEndIndex
            });
            // 阻止事件冒泡
            e.stopPropagation();
        }
    };
    //随页面变化重新加载图表
    window.addEventListener('resize', handleResize)
    emit('closeSkeleton', false);
}
);

</script>

<style lang="less" scoped>
* {
    margin: 0;
    padding: 0;
    position: relative;
    width: 109vw;
    height: 30vw;
    left: -6vw;
    min-height: 800px;
    overflow: hidden;
}
</style>
