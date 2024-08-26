<template>
    <a-layout class="layout">
        <a-layout-content class="content">
            <a-table class="tablestyle" :columns="columns" :pagination="pagination" size="large"
                :scroll="{ y: 'calc(30vh)' }" :data-source="data" :title="tableTitle">
                <template #emptyText>
                    <a-empty description="暂无数据" />
                </template>
                <template v-for="slotName in Object.keys($slots)" #[slotName]="slotScope">
                    <slot :name="slotName" v-bind="slotScope"></slot>
                </template>
            </a-table>
        </a-layout-content>
    </a-layout>
</template>

<script setup lang="ts">
// import { defineProps, computed } from "vue";
import type { TableProps } from "ant-design-vue";

const props = defineProps<{
    columns: TableProps['columns'];
    data: TableProps['dataSource'];
    pagination: TableProps['pagination'];
    tableTitle: TableProps['title'];
}>();

</script>

<style scoped>
:deep(.ant-table-body) {
    max-height: 10vh;
    min-height: 5vh;
}

:deep(.ant-table-thead>tr>th) {
    text-align: center;
    font-weight: bold;
    font-size: 16px;
    font-family: 'Microsoft YaHei';
}

/* 表格单元格样式 */
:deep(.ant-table-tbody>tr>td) {
    text-align: center;
    font-family: 'Microsoft YaHei';

}

:deep(.ant-table-pagination) {
    padding: 0 16px;
}

:deep(.ant-table-wrapper .ant-table-pagination.ant-pagination) {
    margin: 0;
    background-color: #FFFFFF;
}

:deep(.ant-table-title) {
    padding: 16px;
    color: #333;
    font-size: 20px;
    font-weight: 600;
    text-align: center;
}
</style>