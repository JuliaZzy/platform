<template>
  <div class="dashboard-page">
    <LoadingSpinner :visible="isLoading" />

    <div class="dashboard-title-block" v-show="!isLoading">
      <h1 class="dashboard-title">上市公司数据资产情况</h1>
      <p class="dashboard-subtitle">Overview of Listed Company Data Assets</p>
    </div>
    
    <div class="dashboard-container" v-show="!isLoading">
      <LChartRow :filters="chartRowActiveFilters" /> 
    </div>

    <transition name="slide-fade">
      <LFilterSection
        v-if="!isLoading && initialOptionsLoaded" 
        :filters="currentFilters"   
        :options="filterDropdownOptions" 
        :api-prefix="'/api/lasset'"   
        @filter-change="handleFilterApplyForTable" ref="lFilterSectionRef"
      />
    </transition>

    <div class="data-table-container" v-show="!isLoading && initialOptionsLoaded" style="margin: 20px 30px;">
      <LSDataTable
        ref="lsDataTableRef" :filters="lsTableActiveFilters" :tableData="lsTableData"
        :totalRows="lsTableTotalRows"
        :pageSize="lsTablePageSize"
        :apiPrefix="'/api/lasset'" @page-change="handleLSPageChange"
      />
    </div>

  </div>
</template>

<script>
import LChartRow from '@/components/dashboard/LChartRow.vue';
import LFilterSection from '@/components/dashboard/filters/LFilterSection.vue'; 
import LSDataTable from '@/components/dashboard/LDataTable.vue';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';
import axios from 'axios';

export default {
  name: 'LSDashboardPage',
  components: {
    LChartRow,
    LSDataTable,
    LFilterSection,
    LoadingSpinner
  },
  data() {
    return {
      isLoading: true,
      initialOptionsLoaded: false,
      currentFilters: { 
        quarter: 'Q4',
        province_area: '',
        company: '',
        dataasset_content: '',
      },
      chartRowActiveFilters: {},
      lsTableActiveFilters: {quarter: 'Q4', }, 

      filterDropdownOptions: { 
        quarter: ['Q1', 'Q2', 'Q3', 'Q4'], 
        province_area: [] 
      },

      // 新表格 LSDataTable 的数据和分页状态
      lsTableData: [],
      lsTableTotalRows: 0,
      lsTableCurrentPage: 1,
      lsTablePageSize: 10, // 您可以根据需要调整
      isLsTableLoading: false // 新表格的加载状态
    };
  },
  methods: {
    handleFilterApplyForTable(confirmedFilters) {
      this.currentFilters = { ...confirmedFilters };

      // 如果清除筛选后 quarter 为空，则恢复默认 Q4
      if (confirmedFilters.quarter === '') {
        this.lsTableActiveFilters = { ...confirmedFilters, quarter: 'Q4' };
        this.currentFilters.quarter = 'Q4'; // 同时更新筛选框显示为 Q4
      } else {
        this.lsTableActiveFilters = { ...confirmedFilters };
      }

      this.lsTableCurrentPage = 1;
      this.fetchLSDataTableData(this.lsTableCurrentPage);
    },

    // 新增：处理 LSDataTable 的翻页事件
    handleLSPageChange(newPage) {
      this.lsTableCurrentPage = newPage;
      this.fetchLSDataTableData(newPage);
    },

    // 新增：获取 LSDataTable 数据的函数
    async fetchLSDataTableData(page = 1) {
      if (this.$refs.lsDataTableRef && typeof this.$refs.lsDataTableRef.showLoading === 'function') {
          this.$refs.lsDataTableRef.showLoading();
      } else {
          this.isLsTableLoading = true;
      }
      
      try {
        const params = {
          filters: this.lsTableActiveFilters,
          page: page,
          pageSize: this.lsTablePageSize
        };

        console.log('[LSDashboardPage] Requesting /api/lasset/summary with params:', JSON.stringify(params)); // 添加日志
        const response = await axios.post('/api/lasset/summary', params); 
        console.log('[LSDashboardPage] Received response from /api/lasset/summary:', response.data); // 添加日志
        
        // ▼▼▼ 修正数据提取的路径 ▼▼▼
        if (response.data && response.data.table) {
          this.lsTableData = response.data.table.rows || [];
          this.lsTableTotalRows = response.data.table.total || 0;
          console.log('[LSDashboardPage] Updated lsTableData count:', this.lsTableData.length);
          console.log('[LSDashboardPage] Updated lsTableTotalRows:', this.lsTableTotalRows);
        } else {
          console.error('[LSDashboardPage] Error: Response data or response.data.table is missing!', response.data);
          this.lsTableData = [];
          this.lsTableTotalRows = 0;
        }
        // ▲▲▲ 修正数据提取的路径 ▲▲▲

      } catch (error) {
        console.error("获取 LSDataTable 数据失败:", error.response || error.message || error); // 打印更详细的错误
        this.lsTableData = [];
        this.lsTableTotalRows = 0;
      } finally {
        if (this.$refs.lsDataTableRef && typeof this.$refs.lsDataTableRef.stopLoading === 'function') {
          this.$refs.lsDataTableRef.stopLoading();
        } else {
          this.isLsTableLoading = false;
        }
      }
    },

    async fetchInitialData() {
      this.isLoading = true;
      try {
        const response = await axios.post('/api/lasset/summary', { 
          filters: {}, 
          page: 1,    
          pageSize: 1 
        }); 
        
        if (response.data && response.data.options) {
          this.filterDropdownOptions.quarter = response.data.options.quarter || ['Q1', 'Q2', 'Q3', 'Q4'];
          this.filterDropdownOptions.province_area = response.data.options.province_area || [];
          this.initialOptionsLoaded = true;
        } else {
          this.filterDropdownOptions.quarter = ['Q1', 'Q2', 'Q3', 'Q4'];
        }

        // 1. 初始化图表的筛选条件 (例如，空对象表示不筛选，图表将加载全量数据)
        this.chartRowActiveFilters = {}; 
        // LChartRow 会在其 mounted 或 watch:filters 中根据这个初始 filters 加载数据

        // 2. 初始化并加载新表格的初始数据 (使用当前的 currentFilters，初始为空)
        this.lsTableActiveFilters = { ...this.currentFilters }; 
        await this.fetchLSDataTableData(1); // 加载新表格的第一页数据

      } catch (error) {
        console.error('Error fetching initial data for LSDashboardPage:', error);
        this.filterDropdownOptions = { quarter: [], province_area: [] };
        this.initialOptionsLoaded = true; 
      } finally {
        this.isLoading = false;
      }
    }
  },
  async mounted() {
    await this.fetchInitialData();
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

  .slide-fade-enter-active {
    transition: all 0.3s ease-out; /* 定义进入动画的耗时和缓动函数 */
  }

  .slide-fade-leave-active {
    transition: all 0.3s cubic-bezier(1, 0.5, 0.8, 1); /* 定义离开动画 */
  }

  .slide-fade-enter-from,
  .slide-fade-leave-to {
    transform: translateY(-20px); /* 起始时向上偏移20px (使其有向下滑动的感觉) */
    opacity: 0;                  /* 起始时透明 */
    max-height: 0;               /* 起始时最大高度为0 (用于平滑高度展开) */
    overflow: hidden;            /* 配合max-height，确保内容不溢出 */
    margin-top: 0 !important;    /* 确保动画期间的margin正确 */
    margin-bottom: 0 !important;
    padding-top: 0 !important;
    padding-bottom: 0 !important;
    border-width: 0 !important; /* 如果有边框，也一并过渡 */
  }

  .slide-fade-enter-to,
  .slide-fade-leave-from {
    opacity: 1;
    transform: translateY(0);
    max-height: 500px; 
    overflow: hidden; 
  }

</style>
