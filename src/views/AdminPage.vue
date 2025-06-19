<template>
  <div class="admin-container">
    <AdminSidebar
      :is-collapsed="isSidebarCollapsed"
      :active-tab="currentTab"
      @toggle="toggleSidebar"
      @switch-tab="switchTab"
    />

    <main class="content">
      <h1 class="content-title">{{ currentContentTitle }}</h1>

      <ReportManager
        v-if="currentTab === 'reports'"
        :reports="reportsData"
        :is-loading="tableLoadingState.reports"
        @delete-report="handleDelete"
        @replace-report="openUploadModal"
        @open-upload-modal="() => openUploadModal(null)"
        @move-report="handleMoveReport"
      />

      <DataManager
        v-else
        :is-loading="tableLoadingState[currentTab]"
        :paged-data="tableData"
        :headers="processedTableHeaders"
        :unique-column-values="uniqueColumnValues"
        :last-update-time="formattedLastUpdate"
        :current-page="currentPage"
        :page-size="pageSize"
        :total-rows="tableDataTotalRows"
        :is-upload-visible="currentTab !== 'finance-bank'"
        :active-filters="filters"
        :search-keyword="searchKeyword"
        @search-input="handleSearch"
        @apply-filters="handleApplyFilter"
        @clear-all-filters="clearAllFilters"
        @page-changed="changePage"
        @update-status="handleUpdateStatus"
        @upload-excel="handleExcelUpload"
        @export-excel="exportExcel"
      />
    </main>

    <PdfReportUpload
      :visible="isUploadModalVisible"
      :file-to-replace="reportToReplace"
      @close="() => { 
        isUploadModalVisible = false;
        reportToReplace = null;
      }"
      @upload-success="handleReportUploadSuccess"
    />
  </div>
</template>

<script>
import AdminSidebar from '@/components/admin/AdminSidebar.vue';
import ReportManager from '@/components/admin/ReportManager.vue';
import DataManager from '@/components/admin/DataManager.vue';
import PdfReportUpload from '@/components/admin/PdfReportUpload.vue'; 
import * as adminService from '@/services/adminApiService.js';
import axios from 'axios';
import { formatToDateTimeSec } from '@/utils/formatters.js';

export default {
  name: 'AdminPage',
  components: {
    AdminSidebar,
    ReportManager,
    DataManager,
    PdfReportUpload,
  },
  data() {
    return {
      currentTab: 'listed',
      tableData: [],
      tableDataTotalRows: 0,
      reportsData: [],
      isUploadModalVisible: false,
      reportToReplace: null,
      processedTableHeaders: [],
      tableLastUpdateTimes: {},
      uniqueColumnValues: {},
      filters: {},
      searchKeyword: '',
      currentPage: 1,
      pageSize: 15,
      filterOptionsCache: {},
      isSidebarCollapsed: false,
      isUppyModalVisible: false,
      tableLoadingState: {
        listed: true, nonlisted: true, 'finance-bank': true,
        'finance-stock': true, 'finance-other': true, reports: true,
      },
      tableNameMap: {
        'listed': 'dataasset_listed_companies_2024',
        'nonlisted': 'dataasset_non_listed_companies',
        'finance-bank': 'dataasset_finance_bank',
        'finance-stock': 'dataasset_finance_stock',
        'finance-other': 'dataasset_finance_other'
      }
    };
  },
  computed: {
    currentContentTitle() {
      switch (this.currentTab) {
        case 'listed': return '上市公司数据';
        case 'nonlisted': return '非上市公司数据';
        case 'finance-bank': return '数据资产增信银行贷款';
        case 'finance-stock': return '数据资产作价入股';
        case 'finance-other': return '其他数据类融资';
        case 'reports': return '报告管理';
        default: return '数据明细管理';
      }
    },
    formattedLastUpdate() {
      const lastUpdateTime = this.tableLastUpdateTimes[this.currentTab];
      return lastUpdateTime ? formatToDateTimeSec(lastUpdateTime) : '暂无记录';
    },
  },
  methods: {
    async switchTab(tab) {
      if (this.currentTab === tab) return;
      this.currentTab = tab;

      if (tab === 'reports') {
        this.loadReports();
      } else {
        this.clearAllFilters(false);
        this.currentPage = 1;
        this.tableData = [];
        this.tableDataTotalRows = 0;
        this.uniqueColumnValues = {};
        this.tableLoadingState[this.currentTab] = true;
        await this.loadFilterOptions();
        await this.loadData();
      }
    },

    async loadData() {
      if (this.currentTab === 'reports') {
        console.warn('[AdminPage] loadData() called on "reports" tab. Aborting.');
        return;
      }
      this.tableLoadingState[this.currentTab] = true;
      try {
        const params = {
          page: this.currentPage,
          pageSize: this.pageSize,
          filters: this.filters,
          searchKeyword: this.searchKeyword.trim(),
        };
        const response = await adminService.loadAdminTableData(this.currentTab, params);
        
        this.tableData = response.data || [];
        this.tableDataTotalRows = response.total || 0;
        this.tableLastUpdateTimes = { ...this.tableLastUpdateTimes, [this.currentTab]: response.tableLastUpdate };

        let headers = this.tableData.length > 0 ? Object.keys(this.tableData[0]) : [];
        headers = headers.filter(h => h !== 'id');
        const statusIndex = headers.indexOf('status');
        if (this.currentTab !== 'finance-bank' && statusIndex > -1) {
            headers.unshift(headers.splice(statusIndex, 1)[0]);
        } else if (statusIndex > -1) {
            headers.splice(statusIndex, 1);
        }
        this.processedTableHeaders = headers;

      } catch (error) {
        alert(error.message || '数据加载失败！');
      } finally {
        this.tableLoadingState[this.currentTab] = false;
      }
    },
    
    async loadReports() {
      this.tableLoadingState.reports = true;
      try {
        const response = await axios.get(`${process.env.VUE_APP_API_URL}/api/reports`);
        this.reportsData = Array.isArray(response.data) 
          ? response.data.map(item => ({
              name: item.name || item.filename,
              size: item.size,
              uploadTime: item.uploadTime || item.mtime
            }))
          : [];
      } catch (error) {
        alert('获取报告列表失败');
      } finally {
        this.tableLoadingState.reports = false;
      }
    },

    async handleDelete(filename) {
      if (confirm(`确定要删除报告 "${filename}" 吗？此操作无法撤销。`)) {
        try {
          await axios.delete(`${process.env.VUE_APP_API_URL}/api/reports/${encodeURIComponent(filename)}`);
          alert('报告删除成功！');
          this.loadReports();
        } catch (error) {
          const errorMsg = error.response?.data?.message || '删除失败';
          alert(errorMsg);
        }
      }
    },

    openUploadModal(fileToReplace = null) {
      console.log('[DEBUG] 打开上传模态框，模式:', 
        fileToReplace ? `替换 ${fileToReplace.name}` : '新增');
      this.reportToReplace = fileToReplace;
      this.isUploadModalVisible = true;
    },

    handleReportUploadSuccess() {
      this.loadReports();
      this.reportToReplace = null;
    },

    async handleMoveReport({ index, direction }) {
      if ((direction === 'up' && index === 0) || 
          (direction === 'down' && index === this.reportsData.length - 1)) {
        return;
      }

      this.$message.info('正在更新排序...');
      
      try {
        const newReports = [...this.reportsData];
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        [newReports[index], newReports[newIndex]] = [newReports[newIndex], newReports[index]];
        this.reportsData = newReports;
        await axios.post('/api/reports/order', {
          orderedFilenames: newReports.map(r => r.name)
        });
        
        this.$message.success('排序已保存');
      } catch (error) {
        console.error('排序失败:', error);
        this.loadReports();
        this.$message.error('排序保存失败: ' + (error.response?.data?.message || '网络错误'));
      }
    },

    async handleUpdateStatus({ row, status }) {
        const tableName = this.tableNameMap[this.currentTab];
        await adminService.updateRowStatusInDb(tableName, row.id, status);
        await this.loadData();
    },

    async handleExcelUpload(file) {
      this.tableLoadingState[this.currentTab] = true;
      try {
        const tableName = this.tableNameMap[this.currentTab];
        const formData = new FormData();
        formData.append('file', file);
        await adminService.uploadExcelData(tableName, formData);
        alert('Excel 数据上传处理完成！');
        this.clearAllFilters(false);
        await this.loadFilterOptions();
        await this.loadData();
      } catch (error) {
        alert(error.message);
      } finally {
        this.tableLoadingState[this.currentTab] = false;
      }
    },

    exportExcel() {
        const dbTableName = this.tableNameMap[this.currentTab];
        adminService.exportTableToExcel(dbTableName);
    },

    async loadFilterOptions() {
      if (!this.currentTab || this.currentTab === 'reports') return;
      if (this.filterOptionsCache[this.currentTab]) {
        this.uniqueColumnValues = this.filterOptionsCache[this.currentTab];
        return; 
      }
      try {
        const distinctValuesData = await adminService.loadDistinctColumnValues(this.currentTab);
        this.uniqueColumnValues = distinctValuesData || {};
        this.filterOptionsCache[this.currentTab] = this.uniqueColumnValues;
      } catch (error) {
        alert(error.message || '筛选选项加载失败！');
        this.uniqueColumnValues = {};
      }
    },

    toggleSidebar() {
      this.isSidebarCollapsed = !this.isSidebarCollapsed;
    },
    handleSearch(keyword) {
      this.searchKeyword = keyword;
      this.currentPage = 1;
      this.loadData();
    },
    handleApplyFilter({ column, values }) {
      this.filters = { ...this.filters, [column]: values };
      this.currentPage = 1;
      this.loadData();
    },
    clearAllFilters(shouldLoadData = true) {
      this.filters = {};
      this.searchKeyword = '';
      this.currentPage = 1;
      if (shouldLoadData) this.loadData();
    },
    changePage(newPage) {
      this.currentPage = newPage;
      this.loadData();
    },
  },
  mounted() {
    this.switchTab('listed');
  },
};
</script>

<style scoped>
.admin-container {
  display: flex;
  height: 100vh;
  font-family: "Segoe UI", Roboto, sans-serif;
  overflow: hidden;
  background-color: #F5F3F4;
}

.content {
  flex: 1;
  background-color: #ffffff;
  padding: 32px;
  overflow: auto;
  transition: margin-left 0.3s ease;
}

.content-title {
  color: #2e3968;
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 8px;
}
</style>