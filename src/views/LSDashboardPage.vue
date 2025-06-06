<template>
  <div class="dashboard-page">
    <LoadingSpinner :visible="isLoading" />

    <div class="dashboard-title-block" v-show="!isLoading">
      <h1 class="dashboard-title">上市公司数据资产入表情况</h1>
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
        ref="lsDataTableRef" 
        :filters="lsTableActiveFilters" 
        :tableData="lsTableData"
        :totalRows="lsTableTotalRows"
        :pageSize="lsTablePageSize"
        :apiPrefix="'/api/lasset'" 
        @page-change="handleLSPageChange"
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
        quarter: '', // 将在 fetchInitialData 中根据动态逻辑设置
        province_area: '',
        company: '',
        dataasset_content: '',
      },
      chartRowActiveFilters: {}, // 将在 fetchInitialData 中设置
      lsTableActiveFilters: { quarter: '' }, // 将在 fetchInitialData 中根据动态逻辑设置

      filterDropdownOptions: { 
        quarter: [], // ✅ 初始化为空数组，将从API动态填充
        province_area: [] 
      },

      // LSDataTable 的数据和分页状态
      lsTableData: [],
      lsTableTotalRows: 0,
      lsTableCurrentPage: 1,
      lsTablePageSize: 10,
      isLsTableLoading: false
    };
  },
  methods: {
    handleFilterApplyForTable(confirmedFilters) {
      this.currentFilters = { ...confirmedFilters };

      // 当用户清空 quarter 筛选时，可以考虑恢复到“最新”季度或不筛选
      if (confirmedFilters.quarter === '') {
        let defaultQuarterAfterClear = '';
        if (this.filterDropdownOptions.quarter && this.filterDropdownOptions.quarter.length > 0) {
          // 假设 filterDropdownOptions.quarter 已排序，第一个是最新
          defaultQuarterAfterClear = this.filterDropdownOptions.quarter[0]; 
        }
        this.lsTableActiveFilters = { ...confirmedFilters, quarter: defaultQuarterAfterClear };
        this.currentFilters.quarter = defaultQuarterAfterClear; 
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

    handlePageSizeChange() {
      this.lsTableCurrentPage = 1; // 每页条数变化，重置到第一页
      this.fetchLSDataTableData(this.lsTableCurrentPage);
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

        const response = await axios.post('/api/lasset/summary', params); 
        
        if (response.data && response.data.table) {
          this.lsTableData = response.data.table.rows || [];
          this.lsTableTotalRows = response.data.table.total || 0;
        } else {
          this.lsTableData = [];
          this.lsTableTotalRows = 0;
        }

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
        // 1. 从API获取初始数据，包括下拉选项
        const response = await axios.post('/api/lasset/summary', { 
          filters: {}, 
          page: 1,    
          pageSize: 1 // 用于获取选项，实际表格数据后续加载
        }); 
        
        // 2. 填充并排序 filterDropdownOptions.quarter
        if (response.data && response.data.options) {
          this.filterDropdownOptions.quarter = response.data.options.quarter || [];
          // ✅ 对季度进行降序排序 (确保"最新"的在最前面，例如 "2025Q1" > "2024Q4")
          if (this.filterDropdownOptions.quarter.length > 0) {
            this.filterDropdownOptions.quarter.sort((a, b) => b.localeCompare(a));
          }
          this.filterDropdownOptions.province_area = response.data.options.province_area || [];
        } else {
          this.filterDropdownOptions.quarter = []; // 确保出错时为空数组
          this.filterDropdownOptions.province_area = [];
          console.warn('[LSDashboardPage] Initial options not found in API response. Setting dropdown options to empty.');
        }
        this.initialOptionsLoaded = true; // 标记选项已加载完毕

        // 3. 根据逻辑确定默认显示的季度 (defaultQuarter)
        let defaultQuarter = '';
        const availableQuarters = this.filterDropdownOptions.quarter;

        // --- 逻辑 A: 默认 "2024Q4", 若无则最新 (当前激活) ---
        const preferredHardcodedQuarter = '2024Q4';
        if (availableQuarters.length > 0) {
          if (availableQuarters.includes(preferredHardcodedQuarter)) {
            defaultQuarter = preferredHardcodedQuarter;
          } else {
            // "2024Q4" 不可用, 则使用列表中的第一个 (即最新，因为已排序)
            defaultQuarter = availableQuarters[0]; 
            console.log(`[LSDashboardPage] Preferred default quarter '${preferredHardcodedQuarter}' not found. Defaulting to latest available: '${defaultQuarter}'.`);
          }
        } else {
          console.log('[LSDashboardPage] No quarters available to set a default.');
          // defaultQuarter 保持 ''
        }
        // --- 逻辑 A 结束 ---

        // --- 逻辑 B: 默认最新季度 (预置并注释) ---
        /*
        if (availableQuarters.length > 0) {
          // 列表已排序，第一个即为最新
          defaultQuarter = availableQuarters[0]; 
        } else {
          console.log('[LSDashboardPage] No quarters available to set a default.');
          // defaultQuarter 保持 ''
        }
        */
        // --- 逻辑 B 结束 ---
        
        // 4. 应用确定的 defaultQuarter 到相关筛选器
        this.currentFilters.quarter = defaultQuarter;
        // lsTableActiveFilters 通常应该反映 currentFilters 的初始状态
        this.lsTableActiveFilters = { ...this.currentFilters }; 
        // chartRowActiveFilters 也可能需要基于此设置
        this.chartRowActiveFilters = { ...this.currentFilters };

        // 5. 使用这些初始筛选条件加载表格数据
        await this.fetchLSDataTableData(this.lsTableCurrentPage); // lsTableCurrentPage 默认为 1

      } catch (error) {
        console.error('Error fetching initial data for LSDashboardPage:', error);
        this.filterDropdownOptions = { quarter: [], province_area: [] };
        this.currentFilters = { quarter: '', province_area: '', company: '', dataasset_content: '' };
        this.lsTableActiveFilters = { quarter: '' };
        this.chartRowActiveFilters = {};
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
