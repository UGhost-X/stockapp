import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import StockStatus from '@/views/StockStatus.vue'
import StockAnalysis from '@/views/StockAnalysis.vue'
import HistoryForce from '@/views/HistoryForce.vue'
import HistoryRecords from '@/views/HistoryRecords.vue'
import LogManagement from '@/views/LogManagement.vue'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect:'/stockstatus',
  },
  {
    path: '/stockstatus',
    name: 'stockstatus',
    component: StockStatus,
    meta:{
      title:'大盘晴雨'
    }
  },
  {
    path: '/stockanalysis',
    name: 'stockanalysis',
    component: StockAnalysis,
    meta:{
      title:'候选分析'
    }
  },
  {
    path: '/historyforce',
    name: 'historyforce',
    component: HistoryForce,
    meta:{
      title:'历史跟踪'
    }
  },
  {
    path: '/historyrecords',
    name: 'historyrecords',
    component: HistoryRecords,
    meta:{
      title:'历史记录'
    }
  },
  {
    path: '/logmanagement',
    name: 'logmanagement',
    component: LogManagement,
    meta:{
      title:'日志管理'
    }
  },
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})


export default router
