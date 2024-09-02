<template>
    <article class="main" @mousewheel="scrollWheelEvent" @mousedown="mouseButonEvent">
        <section ref="main" class="chart">
        </section>
    </article>

</template>

<script setup>
import { ref, onMounted, reactive } from "vue";
import { debounce } from "lodash"
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
import axios from "axios";

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
const main = ref() // 使用ref创建虚拟DOM引用，使用时用main.value
const storeData = reactive([])
const startValue = ref(0)
const endValue = ref(100)
const stockSelectIndex = ref(0)
let nowDataZoomStartIndex;
let nowDataZoomEndIndex;
const switchValue = ref(false)
// 获取指定个股的数据
async function getStockInfoForCondidator(stockCode, startDate) {
    try {
        const response = await axios.post('api/getKlineDateFromDB', {
            code: stockCode,
            startDate: startDate,
            endDate: '2050-01-30'

        });
        storeData.length = 0;
        storeData.push(...response.data.data);
        startValue.value = storeData.length - 160;
        endValue.value = storeData.length;
    } catch (error) {
        console.error('Error fetching stock info for condidator:', error);
    }
}
// 防抖设置
const scrollWheelEvent = debounce(nextStockSelectIndex, 500)
// 添加监听事件
function nextStockSelectIndex(e) {
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
let myChart;
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
function splitData(rawData) {
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
const stockTitle = ref('');
const chartOption = (data, startValue,endValue,stockTitle) => {
    return {
        title: {
            text: stockTitle,
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
                link: [
                    {
                        xAxisIndex: 'all'
                    }
                ],
                label: {
                    backgroundColor: '#777'
                }
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
                data.map((item, index) => {
                    if (item.data.empty) {
                        result = ''
                    } else {
                        let marker = item.marker;
                        let seriesName = item.seriesName;
                        let name = ['开盘价', '收盘价', '最低价', '最高价', '涨幅', '交易量']
                        if (index === 0) {
                            content += `<span style='font-size:16px;'>${marker} ${seriesName}</span><br/>`
                            marker = marker.replaceAll('10px', '5px')
                            for (let i = 0; i < item.data.length - 1; i++) {
                                content += `${marker} ${name[i]}<div style='font-size:16px; float:right;font-weight: bold;font-family: 微软雅黑'>${item.data[i + 1]}</div><br/>`
                            }
                            return
                        }
                        content += `${marker} ${seriesName}<div style='font-size:16px; float:right;font-weight: bold;font-family: 微软雅黑'>${item.data}</div><br/>`
                        result = `<div style='font-size: 14px;width: 150px'>${item.name}</div>${content}`;
                    }
                })
                return result;
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
            top: '80%',
            height: '16%'
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
                show: false
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
                splitLine: { show: false }
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
const chartData = ref([])
const init = async () => {
    if (myChart != null && myChart !== "" && myChart !== undefined) {
        myChart.dispose();//销毁
    }
    myChart = echarts.init(main.value);
    await getStockInfoForCondidator('1.000001', '2020-01-01')
    chartData.value = splitData(storeData);
    stockTitle.value ="上证指数  " + chartData.value.categoryData[chartData.value.categoryData.length-1];
    startValue.value = storeData.length - 160
    nowDataZoomStartIndex = startValue.value
    endValue.value = storeData.length
    nowDataZoomEndIndex = endValue.value
    myChart.setOption(chartOption(chartData.value, startValue.value, endValue.value,stockTitle.value));
}

//如果加载完毕通知父组件关闭鱼骨图
const emit = defineEmits(['closeSkeleton']);

const handleResize = () => {
    if (myChart) {
        myChart.resize();
    }
};
defineExpose({ handleResize });
onMounted(
    async () => {
        await init();
        let nowDataIndex;
        const getDataIndex = function (param) {
            nowDataIndex = param.dataIndex;
        }
        const getDatazoom = function (param) {
            // 手动移动的时候这个datazoom对象没有batch
            if (param.batch === undefined) {
                nowDataZoomStartIndex = param.startValue
                nowDataZoomEndIndex = param.endValue
                return
            }
            nowDataZoomStartIndex = (param.batch[0].start / 100) * (storeData.length - 1)
            nowDataZoomEndIndex = (param.batch[0].end / 100) * (storeData.length - 1)
        }
        myChart.on('showTip', debounce(getDataIndex, 500))
        myChart.on('dataZoom', debounce(getDatazoom, 500))
        //键盘的监听事件需要单独加,37表示左移，39对应右移 38向上 40向下
        document.onkeydown = function (e) {
            // 向左键 --》控制左移 如果按住ctrl一次移动7格
            if (e.keyCode === 37) {
                // 判断是否按了ctrl键
                nowDataIndex = e.ctrlKey === true ? nowDataIndex - 7 : nowDataIndex - 1
                if (nowDataIndex < 0) {
                    nowDataIndex = 0
                }
                // 判断是否需要平移窗口
                if (nowDataIndex < nowDataZoomStartIndex) {
                    nowDataZoomStartIndex = nowDataIndex
                    nowDataZoomEndIndex = nowDataZoomStartIndex + 160
                }
                myChart.dispatchAction({
                    type: 'showTip',
                    seriesIndex: 0,
                    dataIndex: nowDataIndex
                })
                myChart.dispatchAction({
                    type: 'dataZoom',
                    startValue: nowDataZoomStartIndex,
                    endValue: nowDataZoomEndIndex
                })
            }

            //向右键 --》控制右移
            if (e.keyCode === 39) {
                nowDataIndex = e.ctrlKey === true ? nowDataIndex + 7 : nowDataIndex + 1
                if (nowDataIndex > storeData.length - 1) {
                    nowDataIndex = storeData.length - 1
                }
                if (nowDataIndex > nowDataZoomEndIndex) {
                    nowDataZoomEndIndex = nowDataIndex
                    nowDataZoomStartIndex = nowDataZoomEndIndex - 160
                }
                myChart.dispatchAction({
                    type: 'showTip',
                    seriesIndex: 0,
                    dataIndex: nowDataIndex
                })
                myChart.dispatchAction({
                    type: 'dataZoom',
                    startValue: nowDataZoomStartIndex,
                    endValue: nowDataZoomEndIndex
                })
            }
            //向上键 --》放大
            if (e.keyCode === 38) {
                nowDataZoomStartIndex = nowDataZoomStartIndex + 2
                if (nowDataZoomStartIndex > nowDataIndex - 2) {
                    nowDataZoomStartIndex = nowDataIndex - 2
                }
                nowDataZoomEndIndex = nowDataZoomEndIndex - 2

                if (nowDataZoomEndIndex < nowDataIndex + 2) {
                    nowDataZoomEndIndex = nowDataIndex + 2
                }

                if (nowDataZoomEndIndex - nowDataZoomStartIndex === 4) {
                    nowDataZoomStartIndex = nowDataIndex
                    nowDataZoomEndIndex = nowDataIndex
                }
                myChart.dispatchAction({
                    type: 'dataZoom',
                    startValue: nowDataZoomStartIndex,
                    endValue: nowDataZoomEndIndex
                })
            }
            //向下键 --》缩小
            if (e.keyCode === 40) {
                nowDataZoomStartIndex = nowDataZoomStartIndex - 5
                nowDataZoomEndIndex = nowDataZoomEndIndex + 5
                myChart.dispatchAction({
                    type: 'dataZoom',
                    startValue: nowDataZoomStartIndex,
                    endValue: nowDataZoomEndIndex
                })
            }
        }
        //随页面变化重新加载图表
        window.addEventListener('resize', handleResize)
        //通知父组件关闭鱼骨图
        emit('closeSkeleton', false);
    }
)

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