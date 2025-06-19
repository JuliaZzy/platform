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

    <footer class="page-footer" v-show="!isLoading">
      {{ footerText }}
    </footer>

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
        quarter: '',
        province_area: '',
        company: '',
        dataasset_content: '',
      },
      chartRowActiveFilters: {},
      lsTableActiveFilters: { quarter: '' },

      filterDropdownOptions: { 
        quarter: [],
        province_area: [] 
      },

      lsTableData: [],
      lsTableTotalRows: 0,
      lsTableCurrentPage: 1,
      lsTablePageSize: 10,
      isLsTableLoading: false,

      footerText: '数据来源：公司财报、wind、高金智库数据资产研究课题组'
    };
  },
  methods: {
    handleFilterApplyForTable(confirmedFilters) {
      this.currentFilters = { ...confirmedFilters };

      if (confirmedFilters.quarter === '') {
        let defaultQuarterAfterClear = '';
        if (this.filterDropdownOptions.quarter && this.filterDropdownOptions.quarter.length > 0) {
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

    handleLSPageChange(newPage) {
      this.lsTableCurrentPage = newPage;
      this.fetchLSDataTableData(newPage);
    },

    handlePageSizeChange() {
      this.lsTableCurrentPage = 1;
      this.fetchLSDataTableData(this.lsTableCurrentPage);
    },

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
        console.error("获取 LSDataTable 数据失败:", error.response || error.message || error);
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
          this.filterDropdownOptions.quarter = response.data.options.quarter || [];
          if (this.filterDropdownOptions.quarter.length > 0) {
            this.filterDropdownOptions.quarter.sort((a, b) => b.localeCompare(a));
          }
          this.filterDropdownOptions.province_area = response.data.options.province_area || [];
        } else {
          this.filterDropdownOptions.quarter = [];
          this.filterDropdownOptions.province_area = [];
          console.warn('[LSDashboardPage] Initial options not found in API response. Setting dropdown options to empty.');
        }
        this.initialOptionsLoaded = true;

        let defaultQuarter = '';
        const availableQuarters = this.filterDropdownOptions.quarter;

        const preferredHardcodedQuarter = '2024Q4';
        if (availableQuarters.length > 0) {
          if (availableQuarters.includes(preferredHardcodedQuarter)) {
            defaultQuarter = preferredHardcodedQuarter;
          } else {
            defaultQuarter = availableQuarters[0]; 
            console.log(`[LSDashboardPage] Preferred default quarter '${preferredHardcodedQuarter}' not found. Defaulting to latest available: '${defaultQuarter}'.`);
          }
        } else {
          console.log('[LSDashboardPage] No quarters available to set a default.');
        }

        this.currentFilters.quarter = defaultQuarter;
        this.lsTableActiveFilters = { ...this.currentFilters }; 
        this.chartRowActiveFilters = { ...this.currentFilters };

        await this.fetchLSDataTableData(this.lsTableCurrentPage);

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
    margin: 20px 0 20px;
    padding: 30px;
    overflow-x: hidden;
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

  .slide-fade-enter-active {
    transition: all 0.3s ease-out;
  }

  .slide-fade-leave-active {
    transition: all 0.3s cubic-bezier(1, 0.5, 0.8, 1);
  }

  .slide-fade-enter-from,
  .slide-fade-leave-to {
    transform: translateY(-20px);
    opacity: 0;
    max-height: 0;
    overflow: hidden;
    margin-top: 0 !important;
    margin-bottom: 0 !important;
    padding-top: 0 !important;
    padding-bottom: 0 !important;
    border-width: 0 !important;
  }

  .slide-fade-enter-to,
  .slide-fade-leave-from {
    opacity: 1;
    transform: translateY(0);
    max-height: 500px; 
    overflow: hidden; 
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
    padding: 15px;
    font-size: 12px;
  }
}

</style>
