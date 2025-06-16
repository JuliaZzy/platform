<template>
  <div class="dashboard-page">
    <LoadingSpinner :visible="isLoading" />

    <div class="dashboard-title-block" v-show="!isLoading">
      <h1 class="dashboard-title">非上市公司数据资产入表情况</h1>
    </div>

    <FilterSection
      v-show="!isLoading"
      :apiPrefix="'/api/nlasset'"
      :options="options"
      :filters="pendingFilters"
      @filter-change="handleFilterChange"
    />

    <div class="dashboard-container" v-show="!isLoading">
      <ChartRow 
        :filters="filters" 
        :mode="'nls'" 
        :charts="charts"
        :combo-chart-data="comboChartData" 
      />
      <DataTable
        ref="dataTable"
        :filters="filters"
        :tableData="currentPageData"
        :totalRows="totalRows"
        :apiPrefix="'/api/nlasset'"
        @page-change="handlePageChange"
      />
    </div>

    <footer class="page-footer" v-show="!isLoading">
      {{ footerText }}
    </footer>

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
      isLoading: true,
      filters: {},
      pendingFilters: {},
      pageSize: 10,
      currentPageData: [],
      totalRows: 0,
      charts: {},
      options: {},
      comboChartData: [],
      footerText: '数据来源：公开信息、高金智库数据资产研究课题组'
    };
  },
  methods: {
    async handleFilterChange(newFilters) {
      console.log('【前端 NLSDashboardPage】handleFilterChange 接收到 newFilters:', JSON.stringify(newFilters, null, 2));
      this.filters = { ...newFilters };
      console.log('【前端 NLSDashboardPage】this.filters 更新为:', JSON.stringify(this.filters, null, 2));
      await this.fetchSummaryData(1);
    },
    async handlePageChange(page) {
      await this.fetchSummaryData(page);
    },
    async fetchSummaryData(page) {
      console.log('【前端 NLSDashboardPage】fetchSummaryData 发送的 filters:', JSON.stringify(this.filters, null, 2), '请求页码:', page);
      try {
        const res = await axios.post('/api/nlasset/summary', {
          filters: this.filters,
          page,
          pageSize: this.pageSize
        });
        
        this.comboChartData = res.data.cumulativeComboChart || [];
        
        this.charts = res.data.charts || {};
        this.currentPageData = res.data.table.rows || [];
        this.totalRows = res.data.table.total || 0;
        this.options = res.data.options || {};
        this.pendingFilters = { ...this.filters };

      } catch (err) {
        console.error('❌ 加载 summary 数据失败:', err);
      } finally {
        this.isLoading = false;
        this.$refs.dataTable?.stopLoading?.();
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
  margin: 20px 0 20px; /* Adjusted from original to remove side margins if finance-page handles them */
  padding: 30px;
  overflow-x: hidden; /* Prevents horizontal scroll */
}

.dashboard-title {
  font-size: 28px;
  font-weight: bold;
  color: #2e3968;
  margin: 0;
}

.dashboard-container {
  padding: 30px;
  background: #f9f9f9;
  overflow-x: hidden;
}

.page-footer {
  padding: 20px 30px;
  text-align: left;
  font-size: 14px;
  color: #888;
  line-height: 1.6;
}

@media (max-width: 1200px) {
  .dashboard-content {
    width: 85%;
  }
}

@media (max-width: 992px) {
  .dashboard-content {
    width: 90%;
  }
}

@media (max-width: 768px) {
  .dashboard-page {
    padding: 10px 0;
  }
  .dashboard-content {
    width: 95%;
  }
  .dashboard-title {
    font-size: 22px;
  }
  .dashboard-container {
    padding: 15px;
  }

  .page-footer {
    padding: 15px; /* 在手机端减小边距 */
    font-size: 12px; /* 在手机端减小字体 */
  }
}

</style>