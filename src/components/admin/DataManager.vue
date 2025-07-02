<template>
  <div class="data-view-wrapper">
    <p class="update-time">上次更新时间：{{ lastUpdateTime }}</p>

    <div class="search-bar">
      <button class="clear-all-btn" @click="$emit('clear-all-filters')">
        清空全部筛选
      </button>
      <input
        type="text"
        v-model="localSearchKeyword"
        placeholder="按关键词搜索..."
        class="search-input"
        @input="onSearchInput"
      />
    </div>

    <div class="table-wrapper">
      <ChartSpinner :visible="isLoading" :show-watermark="false" />
      <template v-if="!isLoading">
        <table class="data-table" v-if="pagedData.length > 0">
          <thead>
            <tr>
              <th>序号</th>
              <th v-for="colKey in headers" :key="colKey" style="position: relative;">
                <div class="th-wrapper">
                  {{ colKey === 'status' ? '状态' : (colKey === 'updated_at' ? '更新时间' : colKey) }}
                  
                  <template v-if="isColumnFilterable(colKey)">
                    <span class="filter-icon" @click.stop="toggleFilterDropdown(colKey)" :data-filter-icon="colKey">⏷</span>
                    
                    <div v-show="showFilterDropdown[colKey]" class="filter-dropdown" :data-dropdown="colKey" @click.stop>
                      <input
                        class="filter-search-input"
                        v-model="filterSearch[colKey]"
                        placeholder="搜索该列..."
                      />
                      <div class="filter-options">
                        <label v-for="val in getFilteredOptions(colKey)" :key="val">
                          <input type="checkbox" :value="val" v-model="pendingFilters[colKey]" />
                          {{ colKey === 'status' ? (statusDisplayMap[val] || val) : val }}
                        </label>
                      </div>
                      <div class="filter-footer">
                        <button @click="clearColumnFilter(colKey)">清空筛选</button>
                        <button @click="confirmFilter(colKey)">确定</button>
                      </div>
                    </div>
                  </template>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, index) in pagedData" :key="row.id || index" :class="getRowClass(row)">
              <td style="text-align: center;">{{ (currentPage - 1) * pageSize + index + 1 }}</td>
              <td
                v-for="colName in headers"
                :key="colName"
                :class="{ 'status-cell': colName === 'status', 'text-right': isNumericColumn(colName) }"
              >
                <template v-if="colName === 'status'">
                  <div v-if="row.status === 'repeat'" class="status-display status-repeat">
                    <span class="status-text">重复</span>
                    <div class="action-buttons-group">
                      <button @click="$emit('update-status', { row, status: 'delete' })" class="action-btn delete-btn-small" :disabled="!isEditing">删除</button>
                      <button @click="$emit('update-status', { row, status: 'kept' })" class="action-btn keep-btn-small" :disabled="!isEditing">保留</button>
                    </div>
                  </div>
                  <div v-else-if="row.status === 'delete'" class="status-display status-deleted">
                    <span class="status-text">已删除</span>
                    <div class="action-buttons-group">
                      <button @click="$emit('update-status', { row, status: 'kept' })" class="action-btn keep-btn-small" :disabled="!isEditing">保留</button>
                    </div>
                  </div>
                  <div v-else-if="row.status === 'kept'" class="status-display status-kept">
                    <span class="status-text">已保留</span>
                    <div class="action-buttons-group">
                      <button @click="$emit('update-status', { row, status: 'delete' })" class="action-btn delete-btn-small" :disabled="!isEditing">删除</button>
                      <button @click="$emit('update-status', { row, status: null })" class="action-btn restore-btn-small" :disabled="!isEditing">恢复</button>
                    </div>
                  </div>
                  <div v-else class="status-display status-normal">
                    <div class="action-buttons-group">
                      <button @click="$emit('update-status', { row, status: 'delete' })" class="action-btn delete-btn-small" :disabled="!isEditing">删除</button>
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
      v-if="totalPages > 0 && !isLoading && pagedData.length > 0"
      :current-page="currentPage"
      :total-pages="totalPages"
      :page-size="pageSize"
      @page-changed="(page) => $emit('page-changed', page)"
    />

    <div class="export-controls">
      <label class="upload-btn" :class="{ 'is-disabled': !isEditing }" v-if="isUploadVisible">
        上传数据
        <input type="file" accept=".xlsx" @change="onFileSelect" hidden ref="fileInput" :disabled="!isEditing"/>
      </label>
      <button class="export-btn" @click="$emit('export-excel')">导出 Excel</button>
    </div>
  </div>
</template>

<script>
import ChartSpinner from '@/components/common/ChartSpinner.vue';
import PaginationControls from '@/components/common/PaginationControls.vue';
import { formatToChineseYearMonth, formatToYYYYMMDD, formatNumber, formatPercentage, formatToDateTimeSec } from '@/utils/formatters.js';

export default {
  name: 'DataManager',
  components: { ChartSpinner, PaginationControls },
  props: {
    isLoading: Boolean,
    pagedData: { type: Array, default: () => [] },
    headers: { type: Array, default: () => [] },
    uniqueColumnValues: { type: Object, default: () => ({}) },
    lastUpdateTime: String,
    currentPage: Number,
    pageSize: Number,
    totalRows: Number,
    isUploadVisible: Boolean,
    activeFilters: { type: Object, default: () => ({}) },
    searchKeyword: String,
    isEditing: {
      type: Boolean,
      default: false
    },
  },
  emits: [
    'clear-all-filters', 'search-input', 'apply-filters', 'page-changed',
    'upload-excel', 'export-excel', 'update-status'
  ],
  data() {
    return {
      localSearchKeyword: this.searchKeyword || '',
      searchDebounceTimer: null,
      showFilterDropdown: {},
      pendingFilters: {},
      filterSearch: {},
      statusDisplayMap: {
        'repeat': '重复', 'delete': '已删除', 'kept': '已保留', null: '正常'
      },
      columnFormattersConfig: {
        'register_date': formatToYYYYMMDD, 'updated_at': formatToDateTimeSec,
        'month_time': formatToChineseYearMonth, '入股时间': formatToChineseYearMonth,
        '日期': formatToChineseYearMonth, '数据资源入表总额（万元）': (val) => formatNumber(val, 2),
        '市值（亿元）': (val) => formatNumber(val, 2), '无形资产-数据资源入表金额（万元）': (val) => formatNumber(val, 2),
        '开发支出-数据资源入表金额（万元）': (val) => formatNumber(val, 2), '存货-数据资源入表金额（万元）': (val) => formatNumber(val, 2),
        'book_value': (val) => formatNumber(val, 2), 'assess_value': (val) => formatNumber(val, 2),
        'finance_value': (val) => formatNumber(val, 2), '融资金额（万元）': (val) => formatNumber(val, 2),
        '注册资本（万元）': (val) => formatNumber(val, 2), '数据资产占总资产比例': (val) => formatPercentage(val, 1),
        '股权占比': (val) => formatPercentage(val, 1)
      },
      numericColumns: new Set([
        '数据资源入表总额（万元）', '市值（亿元）', '无形资产-数据资源入表金额（万元）', '开发支出-数据资源入表金额（万元）',
        '存货-数据资源入表金额（万元）', 'book_value', 'assess_value', 'finance_value', '融资金额（万元）', '注册资本（万元）',
        '数据资产占总资产比例', '股权占比'
      ])
    };
  },
  computed: {
    totalPages() {
      if (!this.totalRows || !this.pageSize) return 0;
      return Math.max(1, Math.ceil(this.totalRows / this.pageSize));
    },
  },
  watch: {
    searchKeyword(newVal) {
      if (newVal !== this.localSearchKeyword) this.localSearchKeyword = newVal;
    }
  },
  methods: {
    onSearchInput() {
      clearTimeout(this.searchDebounceTimer);
      this.searchDebounceTimer = setTimeout(() => {
        this.$emit('search-input', this.localSearchKeyword);
      }, 500);
    },
    onFileSelect(event) {
      const file = event.target.files[0];
      if (file) {
        this.$emit('upload-excel', file);
        this.$refs.fileInput.value = '';
      }
    },
    isNumericColumn(colName) {
      return this.numericColumns.has(colName);
    },
    toggleFilterDropdown(col) {
      const currentVisibility = this.showFilterDropdown[col];
      this.closeAllDropdowns();
      this.showFilterDropdown = { ...this.showFilterDropdown, [col]: !currentVisibility };
      if (!currentVisibility) {
        this.pendingFilters = { ...this.pendingFilters, [col]: [...(this.activeFilters[col] || [])] };
        this.filterSearch = { ...this.filterSearch, [col]: '' };
      }
    },
    confirmFilter(col) {
      this.$emit('apply-filters', { column: col, values: this.pendingFilters[col] });
      this.closeAllDropdowns();
    },
    clearColumnFilter(col) {
      this.pendingFilters[col] = [];
      this.$emit('apply-filters', { column: col, values: [] });
      this.closeAllDropdowns();
    },
    closeAllDropdowns() {
      this.showFilterDropdown = {};
    },
    handleClickOutside(event) {
      const isInsideDropdown = event.target.closest('.filter-dropdown, .filter-icon');
      if (!isInsideDropdown) this.closeAllDropdowns();
    },
    getFilteredOptions(col) {
      const options = this.uniqueColumnValues[col] || [];
      const search = (this.filterSearch[col] || '').toLowerCase();
      if (!search) return options;
      return options.filter(val => String(val).toLowerCase().includes(search));
    },
    getRowClass(row) {
      if (!row || typeof row.status === 'undefined') return 'row-normal';
      return `row-${row.status || 'normal'}`;
    },
    applyCellFormatting(value, columnName) {
      const formatter = this.columnFormattersConfig[columnName];
      const formattedValue = typeof formatter === 'function' ? formatter(value) : (value ?? '');
      return this.highlight(String(formattedValue));
    },
    highlight(value) {
      if (!this.searchKeyword || !value) return value;
      const regex = new RegExp(`(${this.searchKeyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
      return value.replace(regex, '<mark>$1</mark>');
    },
    isColumnFilterable(columnKey) {
      return this.uniqueColumnValues[columnKey]?.length > 0;
    }
  },
  mounted() {
    document.addEventListener('mousedown', this.handleClickOutside);
  },
  beforeDestroy() {
    document.removeEventListener('mousedown', this.handleClickOutside);
    clearTimeout(this.searchDebounceTimer);
  }
};
</script>

<style scoped>
.update-time { color: #2e3968; font-size: 14px; margin-bottom: 24px; }
.search-bar { display: flex; justify-content: flex-end; align-items: center; margin-top: 60px; margin-bottom: 12px; gap: 10px; }
.search-bar input { padding: 6px 12px; border: 1px solid #ccc; border-radius: 4px; width: 200px; }
.clear-all-btn { background-color: #f0f0f0; color: #2e3968; border: 1px solid #ccc; padding: 6px 12px; border-radius: 4px; font-size: 13px; cursor: pointer; margin-right: 12px; }
.clear-all-btn:hover { background-color: #2e3968; color: white; border-color: #2e3968; }
.table-wrapper { margin-bottom: 20px; margin-top:40px; overflow-x: auto; }
.data-table { border-collapse: collapse; width: max-content; min-width: 100%; font-size: 14px; white-space: nowrap; }
.data-table th, .data-table td { border: 1px solid #ccc; padding: 8px 12px; text-align: left; color: #2e3968; vertical-align: middle; min-width: 120px; word-break: break-word; white-space: normal; }
.data-table th { background-color: #f4f4f4; }
.data-table td:first-child, .data-table th:first-child { width: 50px; min-width: 50px; max-width: 60px; text-align: center; }
.data-table th:nth-child(2), .data-table td.status-cell { min-width: 80px; width: 140px; text-align: center; }
.data-table td.text-right { text-align: right; }
.th-wrapper { display: flex; align-items: center; justify-content: space-between; position: relative; overflow: visible; z-index: 1; }
.filter-icon { margin-left: 6px; cursor: pointer; font-size: 13px; color: #2e3968; }
.filter-dropdown { 
  position: absolute; z-index: 100; background: white; border: 1px solid #ccc; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); 
  border-radius: 6px; width: 220px; max-height: 300px; display: flex; flex-direction: column; top: 100%; left: 0;}
.filter-search-input { padding: 6px 10px; margin: 8px; font-size: 13px; border: 1px solid #ccc; border-radius: 4px; }
.filter-options { flex: 1; overflow-y: auto; padding: 0 10px 10px; font-size: 13px; display: flex; flex-direction: column; gap: 6px; }
.filter-options label { display: flex; align-items: center; gap: 5px; }
.filter-options input[type="checkbox"] { margin-right: 5px; }
.filter-footer { position: sticky; bottom: 0; background: #f9f9f9; border-top: 1px solid #ddd; padding: 8px 10px; display: flex; justify-content: space-between; gap: 10px; }
.filter-footer button { background-color: #f0f0f0; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 13px; }
.filter-footer button:hover { background-color: #2e3968; color: white; }
.row-deleted td { text-decoration: line-through; color: #a0aec0 !important; background-color: #fff5f5 !important; }
.row-deleted td.status-cell .status-text { color: #f56c6c !important; }
.row-repeat td { background-color: #ecf5ff !important; }
.row-repeat td.status-cell .status-text { color: #409eff !important; }
.row-kept td { background-color: #f0f9eb !important; }
.row-kept td.status-cell .status-text { color: #67c23a !important; }
.row-normal td { background-color: white !important; }
.status-cell { vertical-align: middle !important; }
.status-display { display: flex; align-items: center; justify-content: space-between; width: 100%; gap: 8px; }
.status-text { font-weight: bold; flex-shrink: 0; }
.action-buttons-group { display: inline-flex; gap: 6px; flex-shrink: 0; }
.action-btn { font-size: 12px !important; padding: 3px 7px !important; min-width: auto !important; height: auto !important; line-height: normal !important; border-radius: 3px; border: 1px solid transparent; cursor: pointer; color: white !important; }
.action-btn:hover { opacity: 0.85; }
.delete-btn-small { background-color: #f56c6c !important; border-color: #f56c6c !important; }
.delete-btn-small:hover { background-color: #f78989 !important; border-color: #f78989 !important; }
.keep-btn-small, .restore-btn-small { background-color: #67c23a !important; border-color: #67c23a !important; }
.keep-btn-small:hover, .restore-btn-small:hover { background-color: #85ce61 !important; border-color: #85ce61 !important; }
.export-controls { display: flex; justify-content: flex-end; margin-top: 20px; gap: 10px; }
.export-btn, .upload-btn { background-color: #2e3968; color: white; border: 1px solid transparent; padding: 8px 16px; border-radius: 5px; font-size: 14px; cursor: pointer; transition: all 0.2s ease; }
.export-btn:hover, .upload-btn:hover { background-color: white; color: #2e3968; border: 1px solid #2e3968; }
.no-data { color: #2e3968; margin-top: 20px; text-align: center; padding: 40px; }
:deep(mark) { background-color: yellow; font-weight: bold; padding: 0 2px; border-radius: 2px; }
</style>