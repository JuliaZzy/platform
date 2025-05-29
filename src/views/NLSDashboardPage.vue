<template>
  <div class="dashboard-page">
    <!-- ✅ 整页加载动画 -->
    <LoadingSpinner :visible="isLoading" />

    <div class="dashboard-title-block" v-show="!isLoading">
      <h1 class="dashboard-title">非上市公司数据资产情况</h1>
      <p class="dashboard-subtitle">Overview of Non-listed Company Data Assets</p>
    </div>

    <!-- ✅ 筛选区 -->
    <FilterSection
      v-show="!isLoading"
      :apiPrefix="'/api/nlasset'"
      :options="options"
      :filters="pendingFilters"
      @filter-change="handleFilterChange"
    />

    <!-- ✅ 主体图表和表格 -->
    <div class="dashboard-container" v-show="!isLoading">
      <ChartRow :filters="filters" :mode="'nls'" :charts="charts" />
      <DataTable
        ref="dataTable"
        :filters="filters"
        :tableData="currentPageData"
        :totalRows="totalRows"
        :apiPrefix="'/api/nlasset'"
        @page-change="handlePageChange"
      />
    </div>
  </div>
</template>

<script>
import FilterSection from '@/components/dashboard/filters/NLFilterSection.vue';
import ChartRow from '@/components/dashboard/NLChartRow.vue';
import DataTable from '@/components/dashboard/NLDataTable.vue';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';
import axios from 'axios';

export default {
  name: 'NLSDashboardPage',
  components: {
    FilterSection,
    ChartRow,
    DataTable,
    LoadingSpinner
  },
  data() {
    return {
      isLoading: true, // ✅ 控制整页大 loading
      filters: {},
      pendingFilters: {},
      pageSize: 10,
      currentPageData: [],
      totalRows: 0,
      charts: {},
      options: {}
    };
  },
  methods: {
    async handleFilterChange(newFilters) {
      // ✨ 关键日志 ✨
      console.log('【前端 NLSDashboardPage】handleFilterChange 接收到 newFilters:', JSON.stringify(newFilters, null, 2));
      this.filters = { ...newFilters };
      console.log('【前端 NLSDashboardPage】this.filters 更新为:', JSON.stringify(this.filters, null, 2));
      await this.fetchSummaryData(1);
    },
    async handlePageChange(page) {
      await this.fetchSummaryData(page);
    },
    async fetchSummaryData(page) {
      // ✨ 关键日志 ✨
      console.log('【前端 NLSDashboardPage】fetchSummaryData 发送的 filters:', JSON.stringify(this.filters, null, 2), '请求页码:', page);
      try {
        const res = await axios.post('/api/nlasset/summary', {
          filters: this.filters, // 这里的 this.filters 是否包含了正确的日期？
          page,
          pageSize: this.pageSize
        });
        this.charts = res.data.charts || {};
        this.currentPageData = res.data.table.rows || [];
        this.totalRows = res.data.table.total || 0;
        this.options = res.data.options || {};
        this.pendingFilters = { ...this.filters };
      } catch (err) {
        console.error('❌ 加载 summary 数据失败:', err);
      } finally {
        this.isLoading = false;
        this.$refs.dataTable?.stopLoading?.(); // ✅ 通知子表格关闭局部 loading
      }
    }
  },
  mounted() {
    this.fetchSummaryData(1);
  }
};
</script>

<style scoped>
.dashboard-title-block {
  margin: 30px 30px 10px;
}

.dashboard-title {
  font-size: 24px;
  font-weight: bold;
  color: #003049;
  margin: 0;
}

.dashboard-subtitle {
  font-size: 18px;
  font-weight: bold;
  color: #005f73;
  margin-top: 6px;
}

.dashboard-container {
  padding: 30px;
  background: #f9f9f9;
  overflow-x: hidden; /* 彻底移除横向滚动条 */
}


</style>
