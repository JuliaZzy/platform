<template>
  <div class="admin-container">
    <aside :class="['sidebar', { collapsed: isSidebarCollapsed }]">
      <div class="sidebar-title" v-if="!isSidebarCollapsed">
        数据明细管理
        <button class="collapse-btn" @click="toggleSidebar">◀</button>
      </div>
      <nav class="menu" v-if="!isSidebarCollapsed">
        <div class="menu-item" :class="{ active: currentTab === 'listed' }" @click="switchTab('listed')">
          上市公司数据
        </div>
        <div class="menu-item" :class="{ active: currentTab === 'nonlisted' }" @click="switchTab('nonlisted')">
          非上市公司数据
        </div>
        <div class="menu-item" :class="{ active: isFinanceTabActive }">
          数据资产融资
        </div>
        <div class="menu-subitem" :class="{ active: currentTab === 'finance-bank' }" @click="switchTab('finance-bank')">
          数据资产增信银行贷款
        </div>
        <div class="menu-subitem" :class="{ active: currentTab === 'finance-stock' }" @click="switchTab('finance-stock')">
          数据资产作价入股
        </div>
        <div class="menu-subitem" :class="{ active: currentTab === 'finance-other' }" @click="switchTab('finance-other')">
          其他数据类融资
        </div>
        <div class="menu-item" :class="{ active: currentTab === 'reports' }" @click="switchTab('reports')">
          报告管理
        </div>
      </nav>
    </aside>

    <button v-if="isSidebarCollapsed" class="expand-btn" @click="toggleSidebar">▶</button>

    <main class="content">
      <h1 class="content-title">{{ currentContentTitle }}</h1>
      <!-- 视图一：报告管理 -->
      <div v-if="currentTab === 'reports'" class="report-view-wrapper">
        <div class="table-wrapper">
          <ChartSpinner :visible="tableLoadingState.reports" :show-watermark="false" />
          <table class="data-table report-table" v-if="!tableLoadingState.reports && reportsData.length > 0">
            <thead>
              <tr>
                <th>序号</th>
                <th>PDF名称</th>
                <th>上传时间</th>
                <th>文件大小</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(report, index) in reportsData" :key="report.name">
                <td class="report-table-cell-center">{{ index + 1 }}</td>
                <td>
                  <a :href="getReportDownloadUrl(report.name)" target="_blank" class="report-link">
                    {{ report.name }}
                  </a>
                </td>
                <td>{{ formatToDateTimeSec(report.uploadTime) }}</td>
                <td>{{ formatFileSize(report.size) }}</td>
                <td class="report-table-cell-center">
                  <button @click="deleteReport(report.name)" class="action-btn delete-btn-small">删除</button>
                </td>
              </tr>
            </tbody>
          </table>
          <p v-else-if="!tableLoadingState.reports && reportsData.length === 0" class="no-data">暂无报告文件。</p>
        </div>
        <div class="export-controls">
          <button class="upload-btn" @click="isReportUploadModalVisible = true">上传文件</button>
        </div>
      </div>

      <!-- 视图二：其他所有数据管理表格 -->
      <div v-else class="data-view-wrapper">
        <p class="update-time">上次更新时间：{{ formattedLastUpdate }}</p>
        <div class="search-bar">
          <button class="clear-all-btn" @click="clearAllFilters">清空全部筛选</button>
          <label>关键词检索：</label>
          <input v-model="searchKeyword" @input="handleSearchDebounced" placeholder="请输入关键词..." />
        </div>
        <div class="table-wrapper">
          <ChartSpinner :visible="tableLoadingState[currentTab]" :show-watermark="false" />
          <template v-if="!tableLoadingState[currentTab]">
            <table class="data-table" v-if="pagedData.length > 0">
            <thead>
              <tr>
                <th>序号</th>
                <template v-for="colKey in displayableTableHeaders">
                  <th :key="colKey" style="position: relative;">
                    <div class="th-wrapper">
                      {{ colKey === 'status' ? '状态' : (colKey === 'updated_at' ? '更新时间' : colKey) }}
                      
                      <template v-if="isColumnFilterable(colKey)">
                        <span
                          class="filter-icon"
                          @click.stop="toggleFilterDropdown(colKey)"
                          :data-filter-icon="colKey"
                        >⏷</span>
                        <div
                          v-show="showFilterDropdown[colKey]"
                          class="filter-dropdown"
                          :data-dropdown="colKey"
                          @click.stop
                        >
                          <input
                            class="filter-search-input"
                            v-model="filterSearch[colKey]"
                            placeholder="搜索该列..."
                          />
                          <div class="filter-options">
                            <label
                              v-for="val in getFilteredOptions(colKey)"
                              :key="val"
                            >
                              <input type="checkbox" :value="val" v-model="pendingFilters[colKey]" />
                              {{ colKey === 'status' ? (statusDisplayMap[val] || val) : val }}
                            </label>
                          </div>
                          <div class="filter-footer">
                            <button @click="clearFilter(colKey)">清空筛选</button>
                            <button @click="confirmFilter(colKey)">确定</button>
                          </div>
                        </div>
                      </template>
                      </div>
                  </th>
                </template>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(row, index) in pagedData"
                :key="row.id || index" :class="getRowClass(row)"
              >
                <td style="text-align: center;"> {{ (currentPage - 1) * pageSize + index + 1 }}
                </td>

                <td
                  v-for="colName in displayableTableHeaders" :key="colName"
                  :class="{ 'status-cell': colName === 'status',
                            'text-right': 
                              (colName === '数据资源入表总额（万元）' || colName === '市值（亿元）' || 
                               colName === '无形资产-数据资源入表金额（万元）' || colName === '开发支出-数据资源入表金额（万元）' || 
                               colName === '存货-数据资源入表金额（万元）' || colName === 'book_value' || 
                               colName === 'assess_value' || colName === 'finance_value' || 
                               colName === '融资金额（万元）' || colName === '注册资本（万元）') ||
                              (colName === '数据资产占总资产比例' || colName === '股权占比') 
                          }"
                >
                  <template v-if="colName === 'status'">
                    <div v-if="row.status === 'repeat'" class="status-display status-repeat">
                        <span class="status-text">重复</span>
                        <div class="action-buttons-group">
                            <button @click="updateRowStatus(row, 'delete')" class="action-btn delete-btn-small">删除</button>
                            <button @click="updateRowStatus(row, 'kept')" class="action-btn keep-btn-small">保留</button>
                        </div>
                    </div>
                    <div v-else-if="row.status === 'delete'" class="status-display status-deleted">
                        <span class="status-text">已删除</span>
                        <div class="action-buttons-group">
                            <button @click="updateRowStatus(row, 'kept')" class="action-btn keep-btn-small">保留</button>
                        </div>
                    </div>
                    <div v-else-if="row.status === 'kept'" class="status-display status-kept">
                        <span class="status-text">已保留</span>
                        <div class="action-buttons-group">
                            <button @click="updateRowStatus(row, 'delete')" class="action-btn delete-btn-small">删除</button>
                            <button @click="updateRowStatus(row, null)" class="action-btn restore-btn-small">恢复</button>
                        </div>
                    </div>
                    <div v-else class="status-display status-normal">
                        <div class="action-buttons-group">
                            <button @click="updateRowStatus(row, 'delete')" class="action-btn delete-btn-small">删除</button>
                        </div>
                    </div>
                  </template>

                  <template v-else>
                    <span v-html="applyCellFormatting(row[colName], colName)"></span>
                  </template>
                </td>
              </tr>
            </tbody>
          </table>
            <p v-else class="no-data">暂无数据或结果为空</p>
          </template>
        </div>
        <PaginationControls
          v-if="totalPages > 0 && !tableLoadingState[currentTab] && pagedData.length > 0"
          :current-page="currentPage"
          :total-pages="totalPages"
          :page-size="pageSize"
          @page-changed="changePage"
        />
        <div class="export-controls">
          <label class="upload-btn" v-if="currentTab !== 'finance-bank'">
            上传数据
            <input type="file" accept=".xlsx" @change="handleUpload" hidden ref="fileInput"/>
          </label>
          <button class="export-btn" @click="exportExcel">导出 Excel</button>
        </div>
      </div>
    </main> 

    <div v-if="isReportUploadModalVisible" class="upload-modal">
      <div class="upload-modal-content">
        <h2>上传报告文件</h2>
        <div class="upload-area" @dragover.prevent @drop.prevent="handleReportDrop">
          <input type="file" ref="reportFileInput" @change="handleReportFileSelect" accept=".pdf" hidden multiple />
          <i class="fas fa-cloud-upload-alt"></i>
          <p>将文件拖到此处，或<button class="browse-btn" @click="$refs.reportFileInput.click()">点击选择文件</button></p>
          <p class="upload-tip">仅支持上传 PDF 文件</p>
        </div>
        <div v-if="selectedReportFile" class="file-preview">
          <p>已选择文件：{{ selectedReportFile.name }}</p>
        </div>
        <div class="upload-modal-footer">
          <button @click="closeReportUploadModal" class="close-btn">取消</button>
          <button @click="uploadReport" class="confirm-btn" :disabled="!selectedReportFile || isUploadingReport">
            <span v-if="isUploadingReport">上传中...</span>
            <span v-else>确认上传</span>
          </button>
        </div>
      </div>
    </div>
  </div> 
</template>

<script>
import * as adminService from '@/services/adminApiService.js';
import ChartSpinner from '@/components/common/ChartSpinner.vue';
import PaginationControls from '@/components/common/PaginationControls.vue';
import axios from 'axios';
import { 
  formatToChineseYearMonth,
  formatToYYYYMMDD,
  formatNumber,
  formatPercentage,
  formatToDateTimeSec
} from '@/utils/formatters.js';

export default {
  name: 'AdminPage',
  components: { 
    ChartSpinner,
    PaginationControls
  },
  data() {
    return {
      currentTab: 'listed',
      tableData: [],
      tableDataTotalRows: 0,
      tableHeaders: [],
      processedTableHeaders: [],
      tableLastUpdateTimes: {},
      currentPage: 1,
      pageSize: 15,
      isSidebarCollapsed: false,
      filters: {},
      pendingFilters: {},
      filterSearch: {},
      uniqueColumnValues: {},
      filterOptionsCache: {},
      searchKeyword: '',
      searchDebounceTimer: null,
      showFilterDropdown: {}, 
      
      // 报告管理相关数据
      reportsData: [],
      isReportUploadModalVisible: false,
      selectedReportFile: null,
      isUploadingReport: false,

      tableLoadingState: {
        listed: true,
        nonlisted: true,
        'finance-bank': true,
        'finance-stock': true,
        'finance-other': true,
        reports: true,
      },
      statusDisplayMap: {
        'repeat': '重复',
        'delete': '已删除',
        'kept': '已保留',
        null: '正常'
      },
      columnFormattersConfig: {
        'register_date': formatToYYYYMMDD, 
        'updated_at': formatToDateTimeSec,
        'month_time': formatToChineseYearMonth, 
        '入股时间': formatToChineseYearMonth,
        '日期': formatToChineseYearMonth,
        '数据资源入表总额（万元）': (val) => formatNumber(val, 2),
        '市值（亿元）': (val) => formatNumber(val, 2),
        '无形资产-数据资源入表金额（万元）': (val) => formatNumber(val, 2),
        '开发支出-数据资源入表金额（万元）': (val) => formatNumber(val, 2),
        '存货-数据资源入表金额（万元）': (val) => formatNumber(val, 2),
        'book_value': (val) => formatNumber(val, 2),
        'assess_value': (val) => formatNumber(val, 2),
        'finance_value': (val) => formatNumber(val, 2),
        '融资金额（万元）': (val) => formatNumber(val, 2), 
        '注册资本（万元）': (val) => formatNumber(val, 2),
        '数据资产占总资产比例': (val) => formatPercentage(val, 1),
        '股权占比': (val) => formatPercentage(val, 1)
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
    isFinanceTabActive() {
      return ['finance-bank', 'finance-stock', 'finance-other'].includes(this.currentTab);
    },
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
    displayableTableHeaders() {
      return this.processedTableHeaders;
    },
    formattedLastUpdate() {
      const lastUpdateTimeForCurrentTab = this.tableLastUpdateTimes[this.currentTab];
      if (!lastUpdateTimeForCurrentTab) return '暂无记录';
      return this.formatToDateTimeSec(lastUpdateTimeForCurrentTab);
    },
    pagedData() {
      return this.tableData;
    },
    totalPages() {
      return Math.max(1, Math.ceil(this.tableDataTotalRows / this.pageSize));
    },
  },
  methods: {
    // =================================================================
    //  所有的方法都必须放在这个 methods 对象内部
    // =================================================================

    // --- 健壮的格式化函数 ---
    formatFileSize(bytes) {
      if (bytes == null || isNaN(bytes)) return 'N/A';
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },
    formatToDateTimeSec(dateString) {
      if (!dateString) return 'N/A';
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid Date';
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`;
    },

    // --- 标签页切换的核心逻辑 ---
    async switchTab(tab) {
      if (this.currentTab === tab) return;
      this.currentTab = tab;

      if (tab === 'reports') {
        this.tableData = []; 
        this.loadReports();
      } else {
        this.reportsData = [];
        this.clearAllFilters(false);
        this.currentPage = 1;
        this.tableData = [];
        this.tableDataTotalRows = 0;
        this.uniqueColumnValues = {};
        this.tableLoadingState[this.currentTab] = true;
        
        try {
          await this.loadFilterOptions();
        } finally {
          this.loadData();
        }
      }
    },

    // --- 报告管理相关方法 ---
    async loadReports() {
      this.tableLoadingState.reports = true;
      try {
        const response = await axios.get('/api/reports');
        this.reportsData = Array.isArray(response.data) ? response.data : [];
      } catch (error) {
        this.reportsData = [];
        console.error('获取报告列表失败:', error);
        alert('获取报告列表失败');
      } finally {
        this.tableLoadingState.reports = false;
      }
    },
    getReportDownloadUrl(filename) {
      return `/api/reports/download/${encodeURIComponent(filename)}`;
    },
    async deleteReport(filename) {
      if (confirm(`确定要删除报告 "${filename}" 吗？此操作无法撤销。`)) {
        try {
          // 调用后端的 DELETE API
          await axios.delete(`/api/reports/${encodeURIComponent(filename)}`);
          alert('报告删除成功！');
          // 重新加载列表以显示最新结果
          this.loadReports();
        } catch (error) {
          console.error('删除报告失败:', error);
          const errorMsg = error.response?.data?.message || '删除失败，请查看控制台。';
          alert(errorMsg);
        }
      }
    },
    closeReportUploadModal() {
      this.isReportUploadModalVisible = false;
      this.selectedReportFile = null;
    },
    handleReportFileSelect(event) {
      const file = event.target.files[0];
      if (file) this.selectedReportFile = file;
    },
    handleReportDrop(event) {
      const file = event.dataTransfer.files[0];
      if (file && file.type === 'application/pdf') {
        this.selectedReportFile = file;
      } else {
        alert('请拖入一个 PDF 文件。');
      }
    },
    async uploadReport() {
      if (!this.selectedReportFile) return;
      this.isUploadingReport = true;
      const formData = new FormData();
      formData.append('report', this.selectedReportFile);
      try {
        await axios.post('/api/reports/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        alert('文件上传成功！');
        this.closeReportUploadModal();
        this.loadReports();
      } catch (error) {
        console.error('报告上传失败:', error);
        alert('报告上传失败，请查看控制台获取详情。');
      } finally {
        this.isUploadingReport = false;
      }
    },
    
    // --- 原有的数据表格方法 ---
    applyCellFormatting(value, columnName) {
      const formatter = this.columnFormattersConfig[columnName];
      if (typeof formatter === 'function') {
        return formatter(value);
      }
      return this.highlight(String(value !== null && value !== undefined ? value : ''), columnName);
    },
    isColumnFilterable(columnKey) {
      let normalizedKey = String(columnKey).replace(/"/g, '');
      return Object.prototype.hasOwnProperty.call(this.uniqueColumnValues, normalizedKey) &&
             this.uniqueColumnValues[normalizedKey] &&
             this.uniqueColumnValues[normalizedKey].length > 0;
    },
    getRowClass(row) {
      if (!row || typeof row.status === 'undefined') return 'row-normal';
      switch (row.status) {
        case 'delete': return 'row-deleted';
        case 'repeat': return 'row-repeat';
        case 'kept': return 'row-kept';
        default: return 'row-normal';
      }
    },
    toggleSidebar() {
      this.isSidebarCollapsed = !this.isSidebarCollapsed;
    },
    async loadData() {
      this.tableLoadingState[this.currentTab] = true;
      try {
        const params = { 
          page: this.currentPage, 
          pageSize: this.pageSize,
          filters: this.filters, 
          searchKeyword: this.searchKeyword.trim() 
        };
        const response = await adminService.loadAdminTableData(this.currentTab, params);
        
        this.tableData = response.data || [];
        this.tableDataTotalRows = response.total || 0;
        this.$set(this.tableLastUpdateTimes, this.currentTab, response.tableLastUpdate);

        let headers = this.tableData.length > 0 ? Object.keys(this.tableData[0]) : [];
        const idIndex = headers.indexOf('id');
        if (idIndex > -1) headers.splice(idIndex, 1);

        const updatedAtIndex = headers.indexOf('updated_at');
        if (updatedAtIndex > -1) {
          headers.push(headers.splice(updatedAtIndex, 1)[0]);
        }

        const statusIndex = headers.indexOf('status');
        if (this.currentTab !== 'finance-bank' && statusIndex > -1) {
          headers.unshift(headers.splice(statusIndex, 1)[0]);
        } else if (this.currentTab === 'finance-bank' && statusIndex > -1) {
           headers.splice(statusIndex, 1);
        }
        
        this.processedTableHeaders = headers;
      } catch (error) {
        alert(error.message || '数据加载失败！');
        this.tableData = []; 
        this.tableDataTotalRows = 0;
      } finally {
        this.tableLoadingState[this.currentTab] = false;
      }
    },
    async updateRowStatus(row, newStatus) {
      const tableNameForApi = this.tableNameMap[this.currentTab];
      if (!tableNameForApi || !row || typeof row.id === 'undefined') {
        alert('无法更新状态：缺少必要信息。');
        return;
      }
      try {
        await adminService.updateRowStatusInDb(tableNameForApi, row.id, newStatus);
        alert('状态更新成功！');
        await this.loadData(); 
      } catch (error) {
        alert(error.message);
      }
    },
    async handleUpload(event) {
      const file = event.target.files[0];
      if (!this.$refs.fileInput || !file) return;
      const formData = new FormData();
      formData.append('file', file);
      const tableName = this.tableNameMap[this.currentTab];
      if (!tableName || this.currentTab === 'finance-bank') {
        alert('当前数据类型不支持上传。');
        if (this.$refs.fileInput) this.$refs.fileInput.value = '';
        return;
      }
      this.tableLoadingState[this.currentTab] = true;
      try {
        const response = await adminService.uploadExcelData(tableName, formData);
        alert(response.message || '上传处理完成！');
        if (this.filterOptionsCache[this.currentTab]) {
          delete this.filterOptionsCache[this.currentTab];
        }
        this.currentPage = 1; 
        await this.loadFilterOptions();
        await this.loadData();
      } catch (error) {
        alert(error.message);
      } finally {
        this.tableLoadingState[this.currentTab] = false;
        if (this.refs.fileInput) this.$refs.fileInput.value = '';
      }
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
    clearAllFilters(shouldLoadData = true) {
      this.filters = {};
      this.pendingFilters = {};
      this.filterSearch = {};
      this.searchKeyword = '';
      this.currentPage = 1;
      if (shouldLoadData) this.loadData();
    },
    toggleFilterDropdown(col) {
      const SPREAD_WIDTH = 220; 
      const currentVisibility = this.showFilterDropdown[col];
      this.closeAllDropdowns(); 
      this.$set(this.showFilterDropdown, col, !currentVisibility);

      if (!currentVisibility) { 
        this.$set(this.pendingFilters, col, Array.isArray(this.filters[col]) ? [...this.filters[col]] : []);
        this.$set(this.filterSearch, col, '');
        this.$nextTick(() => {
            const iconEl = this.$el.querySelector(`[data-filter-icon="${col}"]`);
            const dropdownEl = this.$el.querySelector(`[data-dropdown="${col}"]`);
            if (iconEl && dropdownEl) {
                const iconRect = iconEl.getBoundingClientRect();
                dropdownEl.style.position = 'fixed';
                dropdownEl.style.top = `${iconRect.bottom + 4}px`;
                dropdownEl.style.left = `${Math.max(0, iconRect.right - SPREAD_WIDTH)}px`; 
                dropdownEl.style.zIndex = '100';
            }
        });
      }
    },
    confirmFilter(col) {
      this.$set(this.filters, col, Array.isArray(this.pendingFilters[col]) ? [...this.pendingFilters[col]] : []);
      this.closeAllDropdowns();
      this.currentPage = 1;
      this.loadData();
    },
    clearFilter(col) {
      this.$set(this.pendingFilters, col, []);
      this.$set(this.filters, col, []); 
      this.closeAllDropdowns();
      this.currentPage = 1;
      this.loadData();
    },
    closeAllDropdowns() {
      Object.keys(this.showFilterDropdown).forEach(col => {
        this.$set(this.showFilterDropdown, col, false);
      });
    },
    handleClickOutside(event) {
      const isInsideDropdown = event.target.closest('.filter-dropdown');
      const isFilterIcon = event.target.closest('.filter-icon');
      if (!isInsideDropdown && !isFilterIcon) {
        this.closeAllDropdowns();
      }
    },
    getFilteredOptions(col) {
      if (!this.uniqueColumnValues || !Array.isArray(this.uniqueColumnValues[col])) return [];
      const search = (this.filterSearch[col] || '').toLowerCase();
      return this.uniqueColumnValues[col].filter(val =>
        String(val).toLowerCase().includes(search)
      );
    },
    handleSearchDebounced() {
      clearTimeout(this.searchDebounceTimer);
      this.searchDebounceTimer = setTimeout(() => {
        this.currentPage = 1;
        this.loadData();
      }, 500);
    },
    highlight(value, key) {
      if (key === 'id' || key === 'status') {
        return String(value !== null && value !== undefined ? value : '');
      }
      // 日期格式化已由模板 v-if 处理，这里不再重复检查
      const textValue = String(value !== null && value !== undefined ? value : '');
      if (!this.searchKeyword.trim() || !textValue) {
        return textValue;
      }
      const specialCharsRegex = /[\\.^$*+?()[\]{}|]/g; 
      const safeKeyword = this.searchKeyword.trim().replace(specialCharsRegex, '\\$&');
      const regex = new RegExp(`(${safeKeyword})`, 'gi');
      return textValue.replace(regex, '<mark>$1</mark>');
    },
    changePage(newPage) {
      if (newPage >= 1 && newPage <= this.totalPages && newPage !== this.currentPage) {
        this.currentPage = newPage;
        this.loadData();
      }
    },
    exportExcel() {
      const dbTableName = this.tableNameMap[this.currentTab]; // 使用映射

      if (!dbTableName) {
        this.$message ? this.$message.error('当前数据类型不支持导出。') : alert('当前数据类型不支持导出。');
        return;
      }

      try {
        // ✅ 导出时不再传递 filters 和 searchKeyword，因为后端 exportExcel.js 不处理它们
        adminService.exportTableToExcel(dbTableName);
      } catch (error) {
         this.$message ? this.$message.error(error.message) : alert(error.message);
      }
    }
  },
  async mounted() {
    // 页面首次加载时，只加载默认的 'listed' 标签页数据
    this.tableLoadingState.listed = true;
    await this.loadFilterOptions();
    await this.loadData(); // await 确保在添加事件监听前数据加载已启动
    
    document.addEventListener('mousedown', this.handleClickOutside);
  },
  beforeDestroy() {
    document.removeEventListener('mousedown', this.handleClickOutside);
    clearTimeout(this.searchDebounceTimer);
  }
};
</script>


<style scoped>
  .admin-container {
    display: flex;
    height: 100vh;
    font-family: "Segoe UI", Roboto, sans-serif;
    overflow: hidden;
  }

  /* === 左侧侧边栏 === */
  .sidebar {
    width: 240px;
    height: 100vh;
    background-color: #2e3968;
    color: white;
    display: flex;
    flex-direction: column;
    transition: width 0.3s ease;
    position: relative;
  }
  .sidebar.collapsed {
    width: 50px;
  }
  .expand-btn {
    position: absolute;
    left: 10px;
    top: 10px;
    z-index: 1000;
    background-color: #2e3968;
    color: white;
    border: none;
    padding: 6px 10px;
    cursor: pointer;
    border-radius: 0 5px 5px 0;
  }
  .collapse-btn {
    background: none;
    border: none;
    color: white;
    font-size: 16px;
    cursor: pointer;
    margin-left: auto;
  }
  .sidebar-title {
    font-size: 20px;
    font-weight: bold;
    padding: 20px;
    border-bottom: 1px solid white;
    display: flex;
    align-items: center;
  }
  .menu {
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    flex: 1;
  }
  .menu-item {
    padding: 10px 15px;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.2s;
  }
  .menu-item:hover {
    background-color: #1e4462;
  }
  .menu-item.active {
    background-color: white;
    color: #2e3968;
    font-weight: bold;
  }

  /* === 主内容区 === */
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
  .update-time {
    color: #2e3968;
    font-size: 14px;
    margin-bottom: 24px;
  }

  /* === 搜索栏 === */
  .search-bar {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    margin-top: 60px;
    margin-bottom: 12px;
    gap: 10px;
  }
  .search-bar input {
    padding: 6px 12px;
    border: 1px solid #ccc;
    border-radius: 4px;
    width: 200px;
  }
  .clear-all-btn {
    background-color: #f0f0f0;
    color: #2e3968;
    border: 1px solid #ccc;
    padding: 6px 12px;
    border-radius: 4px;
    font-size: 13px;
    cursor: pointer;
    margin-right: 12px;
  }
  .clear-all-btn:hover {
    background-color: #2e3968;
    color: white;
    border-color: #2e3968;
  }

  /* === 表格 === */
  .table-wrapper {
    margin-bottom: 20px;
    margin-top:40px;
    overflow-x: auto;
  }
  .data-table {
    border-collapse: collapse;
    width: max-content;
    min-width: 100%;
    font-size: 14px;
    white-space: nowrap;
  }
  .data-table th,
  .data-table td {
    border: 1px solid #ccc;
    padding: 8px 12px;
    text-align: left;
    color: #2e3968;
    vertical-align: middle;
    min-width: 120px;
    word-break: break-word;
    white-space: normal;
  }
  .data-table th {
    background-color: #f4f4f4;
  }
  .data-table td:first-child,
  .data-table th:first-child {
    width: 50px;
    min-width: 50px;
    max-width: 60px;
    text-align: center;
  }

  .data-table th:nth-child(2),
  .data-table td.status-cell {
    min-width: 80px;
    width: 140px;
    text-align: center;
  }
  .data-table td.text-right {
    text-align: right;
  }

  /* 表头筛选图标 + 弹框 */
  .th-wrapper {
    display: flex;
    align-items: center;
    justify-content: space-between;
    position: relative;
    overflow: visible;
    z-index: 1;
  }
  .filter-icon {
    margin-left: 6px;
    cursor: pointer;
    font-size: 13px;
    color: #2e3968;
  }
  .filter-dropdown {
    position: absolute;
    top: 100%;
    z-index: 9999;
    background: white;
    border: 1px solid #ccc;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    border-radius: 6px;
    width: 220px;
    max-height: 300px;
    display: flex;
    flex-direction: column;
  }

  .filter-search-input {
    padding: 6px 10px;
    margin: 8px;
    font-size: 13px;
    border: 1px solid #ccc;
    border-radius: 4px;
  }
  .filter-options {
    flex: 1;
    overflow-y: auto;
    padding: 0 10px 10px;
    font-size: 13px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .filter-options label { /* ✅ 确保 label 内的 input 和文本能正确对齐和响应点击 */
    display: flex;
    align-items: center;
    gap: 5px;
  }
  .filter-options input[type="checkbox"] {
      margin-right: 5px; /* 给复选框一点右边距 */
  }

  .filter-footer {
    position: sticky;
    bottom: 0;
    background: #f9f9f9;
    border-top: 1px solid #ddd;
    padding: 8px 10px;
    display: flex;
    justify-content: space-between;
    gap: 10px;
  }
  .filter-footer button {
    background-color: #f0f0f0;
    border: none;
    padding: 6px 12px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 13px;
  }
  .filter-footer button:hover {
    background-color: #2e3968;
    color: white;
  }

  /* === ✅ 新增/修改 行状态样式 === */
  .row-deleted td { /* 应用于被删除行的所有单元格 */
    text-decoration: line-through;
    color: #a0aec0 !important; /* 较淡的文字颜色 */
    background-color: #fff5f5 !important; /* 非常非常淡的红色背景 */
  }
  .row-deleted td.status-cell .status-text { /* 确保“已删除”文字本身清晰 */
     color: #f56c6c !important; /* Element UI 红色 */
  }

  .row-repeat td {
    /* color: #409eff; */ /* 可选：整行文字变蓝 */
    background-color: #ecf5ff !important; /* Element UI 淡蓝色背景 */
  }
  .row-repeat td.status-cell .status-text {
     color: #409eff !important; /* Element UI 蓝色 */
  }

  .row-kept td {
    /* color: #67c23a; */ /* 可选：整行文字变绿 */
    background-color: #f0f9eb !important; /* Element UI 淡绿色背景 */
  }
  .row-kept td.status-cell .status-text {
     color: #67c23a !important; /* Element UI 绿色 */
  }
  .row-normal td {
    background-color: white !important; /* 确保覆盖其他可能的背景 */
  }


  /* === ✅ 新增/修改 状态列内部样式 === */
  .status-cell {
    vertical-align: middle !important;
  }
  .status-display {
      display: flex;
      align-items: center;
      justify-content: space-between; /* 文字和按钮组分开 */
      width: 100%;
      gap: 8px;
  }
  .status-text {
    font-weight: bold;
    flex-shrink: 0; /* 防止文字被压缩 */
  }
  .action-buttons-group {
      display: inline-flex;
      gap: 6px;
      flex-shrink: 0; /* 防止按钮组被压缩 */
  }

  .action-btn { /* 用于状态列中的操作按钮 */
    font-size: 12px !important;
    padding: 3px 7px !important; /* 调整按钮大小 */
    min-width: auto !important; /* Element UI 按钮可能需要 */
    height: auto !important;
    line-height: normal !important;
    border-radius: 3px;
    border: 1px solid transparent;
    cursor: pointer;
    color: white !important; /* 默认为白色文字，背景色控制主要颜色 */
  }
  .action-btn:hover {
    opacity: 0.85;
  }

  .delete-btn-small { /* 红色按钮 */
    background-color: #f56c6c !important;  /* Element UI Danger color */
    border-color: #f56c6c !important;
  }
  .delete-btn-small:hover {
    background-color: #f78989 !important;
    border-color: #f78989 !important;
  }

  .keep-btn-small, .restore-btn-small { /* 绿色按钮 */
    background-color: #67c23a !important; /* Element UI Success color */
    border-color: #67c23a !important;
  }
  .keep-btn-small:hover, .restore-btn-small:hover {
    background-color: #85ce61 !important;
    border-color: #85ce61 !important;
  }

  /* === 导出上传 === */
  .export-controls {
    display: flex;
    justify-content: flex-end;
    margin-top: 20px;
    gap: 10px;
  }
  .export-btn,
  .upload-btn {
    background-color: #2e3968;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 5px;
    font-size: 14px;
    cursor: pointer;
  }
  .export-btn:hover,
  .upload-btn:hover {
    background-color: white;
    color: #2e3968;
    border: 1px solid #2e3968;
  }
  .upload-btn {
    background-color: #2e3968;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 5px;
    cursor: pointer;
  }

  /* === 无数据提示 === */
  .no-data {
    color: #2e3968;
    margin-top: 20px;
    text-align: center; /* ✅ 居中显示 */
    padding: 20px;      /* ✅ 增加一点内边距 */
  }

  /* === 高亮关键词 === */
  mark {
    background-color: yellow;
    font-weight: bold;
    padding: 0 2px; /* ✅ 给高亮一点呼吸空间 */
    border-radius: 2px;
  }

  .menu-subitem {
    padding: 6px 30px;
    font-size: 13px;
    color: #eee;
    cursor: pointer;
    transition: background 0.2s;
  }
  .menu-subitem:hover {
    background-color: #1e4462;
  }
  .menu-subitem.active {
    background-color: white;
    color: #2e3968;
    font-weight: bold;
  }
/* ================= 新增/修改：报告管理表格样式 ================= */
.report-table th,
.report-table td {
  text-align: left;
  padding: 12px 15px;
  vertical-align: middle; /* 确保所有单元格垂直居中 */
}

/* 针对需要居中的单元格（序号和操作列）的特殊样式 */
.report-table .report-table-cell-center {
  text-align: center;
}

/* 设置序号列和操作列的宽度 */
.report-table th:first-child,
.report-table td:first-child { /* 序号列 */
  width: 60px;
  text-align: center;
}

.report-table th:nth-child(2),
.report-table td:nth-child(2),
.report-table th:nth-child(3),
.report-table td:nth-child(3),
.report-table th:nth-child(4),
.report-table td:nth-child(4) { /* 序号列 */
  width: auto;
  text-align: center;
}

.report-table th:last-child,
.report-table td:last-child { /* 操作列 */
  width: 100px;
  text-align: center;
}


.report-link {
  color: #2e3968;
  text-decoration: none;
  font-weight: bold;
}
.report-link:hover {
  text-decoration: underline;
  color: #1e4462;
}

  .upload-modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.6);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1001; /* 比其他弹窗层级高 */
  }
  .upload-modal-content {
    background: white;
    padding: 24px;
    border-radius: 8px;
    width: 500px;
    max-width: 90%;
    box-shadow: 0 5px 15px rgba(0,0,0,0.3);
  }
  .upload-modal-content h2 {
    margin-top: 0;
    margin-bottom: 20px;
    color: #2e3968;
  }
  .upload-area {
    border: 2px dashed #ccc;
    border-radius: 8px;
    padding: 40px;
    text-align: center;
    color: #2e3968;
    transition: border-color 0.3s, background-color 0.3s;
  }
  .upload-area:hover {
    border-color: #2e3968;
    background-color: #f9f9f9;
  }
  .upload-area i {
    font-size: 48px;
    color: #ccc;
    margin-bottom: 15px;
  }
  .browse-btn {
    background: none;
    border: none;
    color: #2e3968;
    text-decoration: underline;
    cursor: pointer;
    font-size: 1em;
  }
  .upload-tip {
    font-size: 12px;
    color: #999;
    margin-top: 10px;
  }
  .file-preview {
    margin-top: 15px;
    padding: 10px;
    background-color: #f0f0f0;
    border-radius: 4px;
    font-size: 14px;
  }
  .upload-modal-footer {
    margin-top: 24px;
    display: flex;
    justify-content: flex-end;
    gap: 10px;
  }
  .upload-modal-footer .close-btn {
    background-color: #f0f0f0;
    border: 1px solid #ccc;
    padding: 8px 16px;
    border-radius: 5px;
    cursor: pointer;
  }
  .upload-modal-footer .confirm-btn {
    background-color: #2e3968;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 5px;
    cursor: pointer;
  }
  .upload-modal-footer .confirm-btn:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }

</style>
