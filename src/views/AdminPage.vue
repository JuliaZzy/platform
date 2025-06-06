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
      </nav>
    </aside>

    <button v-if="isSidebarCollapsed" class="expand-btn" @click="toggleSidebar">▶</button>

    <main class="content">
      <h1 class="content-title">{{ currentContentTitle }}</h1>
      <p class="update-time">上次更新时间：{{ formattedLastUpdate }}</p> <div class="search-bar">
        <button class="clear-all-btn" @click="clearAllFilters">清空全部筛选</button>
        <label>关键词检索：</label>
        <input v-model="searchKeyword" @input="handleSearchDebounced" placeholder="请输入关键词..." />
      </div>

      <div class="table-wrapper"> 
        <ChartSpinner 
          :visible="tableLoadingState[currentTab]" 
          :show-watermark="false" 
        />
        
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
    </main> 
  </div> 
</template>

<script>
import * as adminService from '@/services/adminApiService.js';
import ChartSpinner from '@/components/common/ChartSpinner.vue';
import PaginationControls from '@/components/common/PaginationControls.vue';
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
      tableLoadingState: {
        listed: true,
        nonlisted: true,
        'finance-bank': true,
        'finance-stock': true,
        'finance-other': true,
      },
      statusDisplayMap: {
        'repeat': '重复',
        'delete': '已删除',
        'kept': '已保留',
        null: '正常'
      },
      columnFormattersConfig: {
        // === 日期格式化 ===
        'register_date': formatToYYYYMMDD, 
        'updated_at': formatToDateTimeSec,

        'month_time': formatToChineseYearMonth, 
        '入股时间': formatToChineseYearMonth,
        '日期': formatToChineseYearMonth,

        // === 数字格式化 (保留两位小数, 带千分位) ===
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

        // === 百分比格式化 (乘以100, 保留一位小数, 加%) ===
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
        default: return '数据明细管理';
      }
    },

    displayableTableHeaders() {
      return this.processedTableHeaders;
    },

    formattedLastUpdate() { // 用于将 lastUpdate 格式化为 "xxxx年xx月"
      const lastUpdateTimeForCurrentTab = this.tableLastUpdateTimes[this.currentTab];
      if (!lastUpdateTimeForCurrentTab) return '暂无记录'; // 或其他默认文本

      const d = new Date(lastUpdateTimeForCurrentTab);
      if (isNaN(d.getTime())) return '无效日期';
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
    formatToChineseYearMonth,
    formatToYYYYMMDD,
    formatNumber,
    formatPercentage,
    formatToDateTimeSec,

    applyCellFormatting(value, columnName) {
      const formatter = this.columnFormattersConfig[columnName];
      if (typeof formatter === 'function') {
        return formatter(value);
      }
      return this.highlight(String(value !== null && value !== undefined ? value : ''), columnName);
    },

    isColumnFilterable(columnKey) {
      
      let normalizedKey = String(columnKey);
      normalizedKey = normalizedKey.replace(/"/g, '');

      return Object.prototype.hasOwnProperty.call(this.uniqueColumnValues, normalizedKey) &&
            this.uniqueColumnValues[normalizedKey] &&
            this.uniqueColumnValues[normalizedKey].length > 0;
    },

    currentTabUsesBackendProcessing() {
      return true;
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
    async switchTab(tab) {
      if (this.currentTab === tab) return;
    
      this.currentTab = tab;
      this.clearAllFilters(false);
      this.currentPage = 1;
      this.tableData = [];
      this.tableDataTotalRows = 0;
      this.uniqueColumnValues = {};
    
      if (Object.prototype.hasOwnProperty.call(this.tableLoadingState, this.currentTab)) {
        this.tableLoadingState[this.currentTab] = true;
      }
    
      try {
        await this.loadFilterOptions();
      } finally {
        this.loadData();
      }
    },
    async loadData() {
      if (Object.prototype.hasOwnProperty.call(this.tableLoadingState, this.currentTab) && !this.tableLoadingState[this.currentTab]) {
        this.tableLoadingState[this.currentTab] = true;
      }
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

        // 更新特定tab的最后更新时间
        this.$set(this.tableLastUpdateTimes, this.currentTab, response.tableLastUpdate);

        // 1. 获取原始表头 (这部分不变)
        this.tableHeaders = this.tableData.length > 0 ? Object.keys(this.tableData[0]) : [];

        // 2. 【新增】处理和排序表头以生成 processedTableHeaders
        let newProcessedHeaders = [...this.tableHeaders]; // 创建副本

        // *** 新增：处理 'updated_at' 列，将其移到末尾 ***
        const updatedAtIndex = newProcessedHeaders.indexOf('updated_at');
        if (updatedAtIndex > -1) {
          // 从当前位置移除 'updated_at'
          const updatedAtHeader = newProcessedHeaders.splice(updatedAtIndex, 1)[0];
          // 将它添加到数组的末尾
          newProcessedHeaders.push(updatedAtHeader);
        }

        // 2a. 移除 'id' 列 (因为它不直接显示在主要数据区)
        const idIndex = newProcessedHeaders.indexOf('id');
        if (idIndex > -1) {
          newProcessedHeaders.splice(idIndex, 1);
        }

        // 2b. 特殊处理 'finance-bank' tab：它不应该有 'status' 列
        if (this.currentTab === 'finance-bank') {
          const statusIdxFinanceBank = newProcessedHeaders.indexOf('status');
          if (statusIdxFinanceBank > -1) {
            newProcessedHeaders.splice(statusIdxFinanceBank, 1);
          }
        } else {
          // 2c. 对于其他 tab，将 'status' 列（如果存在）移动到最前面
          const statusIndexGeneral = newProcessedHeaders.indexOf('status');
          if (statusIndexGeneral > -1) {
            const statusHeader = newProcessedHeaders.splice(statusIndexGeneral, 1)[0]; // 从原位置取出 'status'
            newProcessedHeaders.unshift(statusHeader); // 将 'status' 插入到数组的开头
          }
        }
        
        this.processedTableHeaders = newProcessedHeaders; // 更新排序后的表头
      
      } catch (error) {
        const errorMessage = error.message || '数据加载失败！';
        if (this.$message && typeof this.$message.error === 'function') {
            this.$message.error(errorMessage);
        } else {
            alert(errorMessage);
        }
        this.tableData = []; 
        this.tableHeaders = []; 
        this.tableDataTotalRows = 0;
      } finally {
        if (Object.prototype.hasOwnProperty.call(this.tableLoadingState, this.currentTab)) {
          this.tableLoadingState[this.currentTab] = false;
        }
      }
    },

    async updateRowStatus(row, newStatus) {
      if (!row || typeof row.id === 'undefined') {
        this.$message ? this.$message.error('行数据无效（缺少ID），无法更新状态。') : alert('行数据无效（缺少ID），无法更新状态。');
        return;
      }
      const rowId = row.id;

      const tableNameForApi = this.tableNameMap[this.currentTab]; // 使用映射
      if (!tableNameForApi) {
        this.$message ? this.$message.error('当前数据类型未知或不支持状态更新。') : alert('当前数据类型未知或不支持状态更新。');
        return;
      }

      try {
        await adminService.updateRowStatusInDb(tableNameForApi, rowId, newStatus);
        this.$message ? this.$message.success('状态更新成功！') : alert('状态更新成功！');
        await this.loadData(); 
      } catch (error) {
        this.$message ? this.$message.error(error.message) : alert(error.message);
      }
    },

    async handleUpload(event) {
      const file = event.target.files[0];
      if (!this.$refs.fileInput) return; 
      if (!file) {
        if (this.$refs.fileInput) this.$refs.fileInput.value = '';
        return;
      }
      const formData = new FormData();
      formData.append('file', file);

      const tableName = this.tableNameMap[this.currentTab];
      if (!tableName || this.currentTab === 'finance-bank') {
        this.$message ? this.$message.error('当前数据类型不支持上传。') : alert('当前数据类型不支持上传。');
        if (this.$refs.fileInput) this.$refs.fileInput.value = '';
        return;
      }
      
      if (Object.prototype.hasOwnProperty.call(this.tableLoadingState, this.currentTab)) {
        this.tableLoadingState[this.currentTab] = true;
      }
      try {
        const response = await adminService.uploadExcelData(tableName, formData);
        this.$message ? this.$message.success(response.message || '上传处理完成！') : alert(response.message || '上传处理完成！');

        if (this.filterOptionsCache[this.currentTab]) {
          delete this.filterOptionsCache[this.currentTab];
          console.log(`[AdminPage] Cleared filter options cache for tab: ${this.currentTab} after upload.`);
        }

        this.currentPage = 1; 

        await this.loadFilterOptions(); // <-- 先加载筛选器选项
        await this.loadData();         // <-- 后加载表格数据

      } catch (error) {
        this.$message ? this.$message.error(error.message) : alert(error.message);
      } finally {
        if (Object.prototype.hasOwnProperty.call(this.tableLoadingState, this.currentTab)) {
          this.tableLoadingState[this.currentTab] = false;
        }
        if (this.$refs.fileInput) this.$refs.fileInput.value = '';
      }
    },
    async loadFilterOptions() {
      if (!this.currentTab) {
        console.warn("[AdminPage] Cannot load filter options: currentTab is not set.");
        return;
      }
      // 可以加一个简单的标志位，防止重复加载筛选选项，除非tab切换
      // if (this.areFilterOptionsLoadedForCurrentTab) return;
      if (this.filterOptionsCache[this.currentTab]) {
        this.uniqueColumnValues = this.filterOptionsCache[this.currentTab];
        console.log(`[AdminPage] Using cached filter options for tab: ${this.currentTab}`);
        return; 
      }
  
      console.log(`[AdminPage] Loading filter options for tab: ${this.currentTab} from API.`);
      try {
        const distinctValuesData = await adminService.loadDistinctColumnValues(this.currentTab);
        // distinctValuesData 结构是 { "列名1": ["值A", "值B"], ... }
        // 这里的键名 "列名1" 必须与你前端 this.displayableTableHeaders 中的项匹配，
        // 或者与你 this.filters 对象中实际使用的键 (colKey) 匹配。
        this.uniqueColumnValues = distinctValuesData || {};
        this.filterOptionsCache[this.currentTab] = this.uniqueColumnValues;
        // this.areFilterOptionsLoadedForCurrentTab = true; // 设置标志位
        console.log("[AdminPage] Filter options loaded:", this.uniqueColumnValues);
      } catch (error) {
        const errorMessage = error.message || '筛选选项加载失败！';
        if (this.$message && typeof this.$message.error === 'function') {
            this.$message.error(errorMessage);
        } else {
            alert(errorMessage);
        }
        this.uniqueColumnValues = {}; // 出错时清空
      }
    },
    clearAllFilters(shouldLoadData = true) {
      this.filters = {};
      this.pendingFilters = {};
      this.filterSearch = {};
      this.searchKeyword = '';
      this.currentPage = 1;
      if (shouldLoadData) {
        this.loadData();
      }
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
    if (Object.prototype.hasOwnProperty.call(this.tableLoadingState, this.currentTab)) {
      this.tableLoadingState[this.currentTab] = true;
    }
    await this.loadFilterOptions(); // 先加载筛选选项
    this.loadData();                // 再加载数据
    document.addEventListener('mousedown', this.handleClickOutside);
  },
  beforeDestroy() {
    document.removeEventListener('mousedown', this.handleClickOutside);
    clearTimeout(this.searchDebounceTimer);
  }
};
</script>


<style scoped>
  /* === 页面整体布局 === */
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
    background-color: #003049;
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
    background-color: #003049;
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
    color: #003049;
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
    font-size: 24px;
    font-weight: bold;
    margin-bottom: 8px;
  }
  .update-time {
    color: #888;
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
    color: #003049;
    border: 1px solid #ccc;
    padding: 6px 12px;
    border-radius: 4px;
    font-size: 13px;
    cursor: pointer;
    margin-right: 12px;
  }
  .clear-all-btn:hover {
    background-color: #003049;
    color: white;
    border-color: #003049;
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
    color: #003049;
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
    background-color: #003049;
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
    background-color: #003049;
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
    color: #003049;
    border: 1px solid #003049;
  }
  .upload-btn {
    background-color: #003049;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 5px;
    cursor: pointer;
  }

  /* === 无数据提示 === */
  .no-data {
    color: #888;
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
    color: #003049;
    font-weight: bold;
  }

</style>
