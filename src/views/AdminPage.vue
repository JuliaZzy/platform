<template>
  <div class="admin-container">
    <AdminSidebar
      :is-collapsed="isSidebarCollapsed"
      :active-tab="currentTab"
      @toggle="toggleSidebar"
      @switch-tab="switchTab"
    />

    <main class="content">
      <div class="page-header">
        <h1 class="content-title">{{ currentContentTitle }}</h1>

        <div class="page-actions">
          <button v-if="!isEditMode" @click="enterEditMode(currentTab === 'reports' ? reportsData : tableData)" class="btn btn-edit">
            修改
          </button>
          <div v-else class="edit-actions">
            <button @click="performSaveChanges" class="btn btn-save">保存</button>
            <button @click="cancelChanges" class="btn btn-cancel">取消</button>
          </div>
        </div>
      </div>

      <ReportManager
        v-if="currentTab === 'reports'"
        :reports="reportsData"
        :is-loading="isReportsLoading"
        :is-editing="isEditMode"
        @delete-report="handleDeleteInReports"
        @replace-report="openUploadModalInReports"
        @open-upload-modal="() => openUploadModalInReports(null)"
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
        :is-editing="isEditMode"
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
import { editModeMixin } from '@/utils/editModeMixin.js'; 
import { reportManagerMixin } from '@/utils/reportManagerMixin.js'; 
import { dataTableMixin } from '@/utils/dataTableMixin.js';

export default {
  name: 'AdminPage',
  mixins: [editModeMixin, reportManagerMixin, dataTableMixin], 
  components: {
    AdminSidebar,
    ReportManager,
    DataManager,
    PdfReportUpload,
  },
  data() {
    return {
      currentTab: 'listed',
      isSidebarCollapsed: false,
      tableNameMap: {
        'listed': 'dataasset_listed_companies_2024',
        'nonlisted': 'dataasset_non_listed_companies',
        'finance-bank': 'dataasset_finance_bank',
        'finance-stock': 'dataasset_finance_stock',
        'finance-other': 'dataasset_finance_other'
      },
      searchKeyword: '',
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
  },
  methods: {
    handleSearch(keyword) {
      // 更新搜索词，重置页码，然后加载数据
      this.searchKeyword = keyword;
      this.currentPage = 1;
      this.loadData(); // loadData 方法已经包含了发送 searchKeyword 的逻辑
    },

    toggleSidebar() {
      this.isSidebarCollapsed = !this.isSidebarCollapsed;
    },
    
    async performSaveChanges() {
      if (this.currentTab === 'reports') {
        const apiCall = () => adminService.saveReportOrder(this.reportsData.map(r => r.id));
        await this.saveChanges(apiCall)
          .then(() => {
            alert('报告顺序保存成功！');
            this.loadReports();
          })
          .catch(err => {
            alert(`报告保存失败: ${err.message}`);
            this.$emit('data-restored', this.originalDataForBackup);
          });
      } else {
        const changedRows = this.tableData.filter((currentRow) => {
          if (!this.originalDataForBackup) return false;
          const originalRow = this.originalDataForBackup.find(r => r.id === currentRow.id);
          return !originalRow || currentRow.status !== originalRow.status;
        });

        if (changedRows.length === 0) {
          alert('没有检测到任何修改。');
          this.isEditMode = false;
          return;
        }

        const updatePromises = changedRows.map(row => {
            const tableName = this.tableNameMap[this.currentTab];
            return adminService.updateRowStatusInDb(tableName, row.id, row.status);
        });

        await this.saveChanges(() => Promise.all(updatePromises))
          .then(() => {
            alert('数据状态更新成功！');
            this.loadData();
          })
          .catch(err => {
            alert(`数据状态保存失败: ${err.message}`);
            this.$emit('data-restored', this.originalDataForBackup);
          });
      }
    },

    async switchTab(tab) {
      if (this.isEditMode) {
        this.cancelChanges();
      }
      if (this.currentTab === tab) return;
      this.currentTab = tab;

      if (tab === 'reports') {
        this.loadReports();
      } else {
        this.clearAllFilters(false);
        await this.loadFilterOptions();
        await this.loadData();
      }
    },
  },

  async mounted() {
    // 直接执行 'listed' 标签页首次加载需要的逻辑
    this.currentTab = 'listed'; // 确保初始状态
    this.clearAllFilters(false); // 清理可能存在的旧筛选
    await this.loadFilterOptions(); // 加载筛选选项
    await this.loadData(); // 加载表格数据

    // 原有的事件监听器保持不变
    this.$on('data-restored', (backupData) => {
        if (this.currentTab === 'reports') {
            this.reportsData = backupData;
        } else {
            this.tableData = backupData;
        }
    });
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

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
}

.content-title {
  color: #2e3968;
  font-size: 24px;
  font-weight: bold;
  margin: 0;
}

.page-actions .btn,
.edit-actions .btn {
  border: 1px solid #2e3968;
  border-radius: 4px;
  padding: 6px 18px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 80px;
  text-align: center;
}

.edit-actions {
  display: flex;
  gap: 12px;
}

.btn-edit {
  background-color: #fff;
  color: #2e3968;
}
.btn-edit:hover {
  background-color: #f5f5f5;
}

.btn-save {
  background-color: #2e3968;
  color: #fff;
}
.btn-save:hover {
  opacity: 0.85;
}

.btn-cancel {
  background-color: #f5f5f5;
  color: #333;
  border-color: #ccc;
}
.btn-cancel:hover {
  background-color: #e0e0e0;
}
</style>