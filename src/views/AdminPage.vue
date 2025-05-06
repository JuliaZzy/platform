<template>
  <div class="admin-container">
    <!-- 左侧侧边栏 -->
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
      </nav>
    </aside>

    <button v-if="isSidebarCollapsed" class="expand-btn" @click="toggleSidebar">▶</button>

    <!-- 右侧内容区域 -->
    <main class="content">
      <h1 class="content-title">{{ currentTab === 'listed' ? '上市公司数据' : '非上市公司数据' }}</h1>
      <p class="update-time">上次更新时间：{{ lastUpdate }}</p>

      <!-- 搜索栏 -->
      <div class="search-bar">
        <button class="clear-all-btn" @click="clearAllFilters">清空全部筛选</button>
        <label>关键词检索：</label>
        <input v-model="searchKeyword" @input="handleSearch" placeholder="请输入关键词..." />
      </div>

      <!-- 表格 -->
      <div class="table-wrapper" v-if="pagedData.length > 0">
        <table class="data-table">
          <thead>
            <tr>
              <th>序号</th> <!-- ✅ 自动编号列 -->
              <th
                v-for="col in tableHeaders.filter(h => h !== 'id')"
                :key="col"
                style="position: relative;"
              >
                <div class="th-wrapper">
                  {{ col }}
                  <span
                    class="filter-icon"
                    @click.stop="toggleFilterDropdown(col)"
                    :data-filter-icon="col"
                  >⏷</span>
                  <div
                    v-show="showFilterDropdown[col]"
                    class="filter-dropdown"
                    :data-dropdown="col"
                    @click.stop
                  >
                    <input
                      class="filter-search-input"
                      v-model="filterSearch[col]"
                      placeholder="搜索该列..."
                    />
                    <div class="filter-options">
                      <label
                        v-for="val in getFilteredOptions(col)"
                        :key="val"
                      >
                        <input type="checkbox" :value="val" v-model="pendingFilters[col]" />
                        {{ val }}
                      </label>
                    </div>
                    <div class="filter-footer">
                      <button @click="clearFilter(col)">清空筛选</button>
                      <button @click="confirmFilter(col)">确定</button>
                    </div>
                  </div>
                </div>
              </th>
            </tr>
          </thead>


          <tbody>
            <tr
              v-for="(row, index) in pagedData"
              :key="index"
              :class="getRowClass(row)"
            >
              <!-- 自动编号列 + 状态按钮 -->
              <td @click="toggleRowState(row)">
                <div style="display: flex; align-items: center; gap: 6px;">
                  <span>{{ (currentPage - 1) * pageSize + index + 1 }}</span>
                  <button
                    v-if="getRowButton(row)"
                    class="row-status-btn"
                    :class="getRowButton(row)?.color"
                  >
                    {{ getRowButton(row)?.label }}
                  </button>
                </div>
              </td>

              <!-- 数据列 -->
              <td
                v-for="(value, key) in row"
                :key="key"
                v-show="key !== 'id'"
                :class="getCellClass(row, key)"
              >
                <button
                  v-if="isCellChanged(row, key)"
                  class="cell-status-btn red"
                  @click="toggleCellState(row, key)"
                >
                  {{ getCellStatusLabel(row, key) }}
                </button>
                <span v-html="highlight(value, key)"></span>
              </td>
            </tr>
          </tbody>

        </table>
      </div>

      <p v-else class="no-data">暂无数据</p>

      <!-- 分页 -->
      <div class="pagination" v-if="totalPages > 1">
        <button v-if="currentPage > 1" @click="changePage(currentPage - 1)">上一页</button>
        <span class="page-info">{{ currentPage }} / {{ totalPages }}</span>
        <button v-if="currentPage < totalPages" @click="changePage(currentPage + 1)">下一页</button>
      </div>

      <!-- 上传与导出 -->
      <div class="export-controls">
        <label class="upload-btn">
          上传数据
          <input type="file" accept=".xlsx" @change="handleUpload" hidden />
        </label>
        <button class="export-btn" @click="exportExcel">导出 Excel</button>
      </div>
    </main>
  </div>
</template>


<script>
  import axios from 'axios';

  export default {
    name: 'AdminPage',
    data() {
      return {
        currentTab: 'listed',
        tableData: [],
        tableHeaders: [],
        lastUpdate: '',
        currentPage: 1,
        totalPages: 1,
        pageSize: 15,
        isSidebarCollapsed: false,
        filters: {},
        pendingFilters: {},
        filterSearch: {},
        uniqueColumnValues: {},
        searchKeyword: '',
        showFilterDropdown: {},
        rowStatus: {}  // { rowKey: { changed: [col1, col2], rowState: 'active'|'deleted', cellState: { col1: 'active'|'deleted' } } }
      };
    },
    computed: {
      filteredData() {
        return this.tableData.filter(row => {
          return Object.keys(this.filters).every(col => {
            const selected = this.filters[col];
            return !selected || selected.length === 0 || selected.includes(row[col]);
          });
        });
      },
      searchedData() {
        if (!this.searchKeyword) return this.filteredData;
        const keyword = this.searchKeyword.toLowerCase();
        return this.filteredData.filter(row =>
          Object.values(row).some(val =>
            String(val).toLowerCase().includes(keyword)
          )
        );
      },
      pagedData() {
        const start = (this.currentPage - 1) * this.pageSize;
        const end = this.currentPage * this.pageSize;
        return this.searchedData.slice(start, end);
      }
    },
    methods: {
      getRowKey(row) {
        return `${row.company_name}_${row.year_month}`;
      },
      getRowClass(row) {
        const status = this.rowStatus[this.getRowKey(row)];
        return status?.rowState === 'deleted' ? 'row-deleted' : '';
      },
      getRowButton(row) {
        const status = this.rowStatus[this.getRowKey(row)];
        if (!status || !status.changed?.length) return null;
        const state = status.rowState || 'active';
        return {
          label: state === 'deleted' ? '删除' : '变动',
          color: state === 'deleted' ? 'red' : 'blue'
        };
      },
      toggleRowState(row) {
        const key = this.getRowKey(row);
        const status = this.rowStatus[key];
        const next = status?.rowState === 'deleted' ? 'active' : 'deleted';
        if (status) {
          this.$set(status, 'rowState', next);
        }
      },
      isCellChanged(row, col) {
        const key = this.getRowKey(row);
        return this.rowStatus[key]?.changed?.includes(col);
      },
      getCellClass(row, col) {
        return this.isCellChanged(row, col) ? 'cell-changed' : '';
      },
      toggleCellState(row, col) {
        const key = this.getRowKey(row);
        if (!this.rowStatus[key]?.cellState) {
          this.$set(this.rowStatus[key], 'cellState', {});
        }
        const current = this.rowStatus[key].cellState[col];
        const next = current === 'deleted' ? 'active' : 'deleted';
        this.$set(this.rowStatus[key].cellState, col, next);
      },
      getCellStatusLabel(row, col) {
        const key = this.getRowKey(row);
        const state = this.rowStatus[key]?.cellState?.[col];
        return state === 'deleted' ? '使用' : '变动';
      },

      async handleUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        const formData = new FormData();
        formData.append('file', file);
        const tableName = this.currentTab === 'listed'
          ? 'non_listed_companies_20250414'
          : 'non_listed_companies_2025q1';

        try {
          const res = await axios.post(`/api/upload/append?tableName=${tableName}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });

          const newRows = res.data?.newRows || [];
          newRows.forEach(newRow => {
            const key = this.getRowKey(newRow);
            const existing = this.tableData.find(row =>
              row.company_name === newRow.company_name &&
              row.year_month === newRow.year_month
            );
            if (existing) {
              const changed = [];
              Object.keys(newRow).forEach(k => {
                if (k !== 'id' && newRow[k] !== existing[k]) {
                  changed.push(k);
                }
              });
              if (changed.length) {
                this.tableData.push({ ...newRow });
                this.$set(this.rowStatus, key, {
                  changed,
                  rowState: 'active',
                  cellState: {}
                });
              }
            } else {
              this.tableData.push({ ...newRow });
            }
          });

          this.totalPages = Math.ceil(this.tableData.length / this.pageSize);
        } catch (err) {
          alert('上传失败：' + (err.response?.data?.error || err.message));
        }
      },

      // UI 控制方法
      toggleSidebar() {
        this.isSidebarCollapsed = !this.isSidebarCollapsed;
      },
      switchTab(tab) {
        this.currentTab = tab;
        this.clearAllFilters();
        this.loadData();
      },
      async loadData() {
        try {
          const url = this.currentTab === 'listed'
            ? '/api/company/listed-companies-detail'
            : '/api/company/non-listed-companies-detail';
          const res = await axios.get(url);
          this.tableData = res.data;
          this.tableHeaders = res.data.length > 0 ? Object.keys(res.data[0]) : [];

          const colVals = {};
          res.data.forEach(row => {
            for (const key in row) {
              if (!colVals[key]) colVals[key] = new Set();
              if (row[key] !== null && row[key] !== '') colVals[key].add(row[key]);
            }
          });
          this.uniqueColumnValues = Object.fromEntries(
            Object.entries(colVals).map(([k, set]) => [k, Array.from(set)])
          );

          this.totalPages = Math.max(1, Math.ceil(res.data.length / this.pageSize));

          const now = new Date();
          this.lastUpdate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
            now.getDate()
          ).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(
            now.getMinutes()
          ).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
        } catch (error) {
          console.error('数据加载失败：', error);
          this.tableData = [];
          this.tableHeaders = [];
        }
      },
      clearAllFilters() {
        this.filters = {};
        this.pendingFilters = {};
        this.filterSearch = {};
        this.searchKeyword = '';
        this.currentPage = 1;
      },

      // 列名称筛选
      toggleFilterDropdown(col) {
        this.closeAllDropdowns();
        this.$set(this.showFilterDropdown, col, true);
        this.$set(this.pendingFilters, col, [...(this.filters[col] || [])]);
        
        this.$nextTick(() => {
          const icon = this.$el.querySelector(`[data-filter-icon="${col}"]`);
          const dropdown = this.$el.querySelector(`[data-dropdown="${col}"]`);
          if (icon && dropdown) {
            const rect = icon.getBoundingClientRect();
            dropdown.style.position = 'fixed';
            dropdown.style.left = `${rect.left - dropdown.offsetWidth + icon.offsetWidth}px`;
            dropdown.style.top = `${rect.bottom + 4}px`;
            dropdown.style.zIndex = '9999';
          }
        });
      },
      confirmFilter(col) {
        this.$set(this.filters, col, [...(this.pendingFilters[col] || [])]);
        this.$set(this.showFilterDropdown, col, false);
        this.currentPage = 1;
      },
      clearFilter(col) {
        this.$set(this.pendingFilters, col, []);
        this.$set(this.filters, col, []);
        this.$set(this.showFilterDropdown, col, false);
        this.currentPage = 1;
      },
      closeAllDropdowns() {
        Object.keys(this.showFilterDropdown).forEach(col => {
          this.$set(this.showFilterDropdown, col, false);
        });
      },
      handleClickOutside(e) {
        const dropdowns = this.$el.querySelectorAll('.filter-dropdown');
        for (let el of dropdowns) {
          if (el.contains(e.target)) return;
        }
        this.closeAllDropdowns();
      },
      getFilteredOptions(col) {
        const search = (this.filterSearch[col] || '').toLowerCase();
        return this.uniqueColumnValues[col].filter(val =>
          String(val).toLowerCase().includes(search)
        );
      },
      handleSearch() {
        this.currentPage = 1;
      },
      highlight(value, key) {
        // 用于防止 ESLint 报告未使用变量 key
        if (key) void key;
        if (!this.searchKeyword || typeof value !== 'string') return value;
        const safeKeyword = this.searchKeyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(${safeKeyword})`, 'gi');
        return value.replace(regex, '<mark>$1</mark>');
      },
      changePage(page) {
        if (page < 1 || page > this.totalPages) return;
        this.currentPage = page;
      },
      exportExcel() {
        const table = this.currentTab === 'listed'
          ? 'non_listed_companies_20250414'
          : 'non_listed_companies_2025q1';
        window.open(`/api/export/${table}`);
      }
    },
    watch: {
      searchedData(newVal) {
        this.totalPages = Math.max(1, Math.ceil(newVal.length / this.pageSize));
        if (this.currentPage > this.totalPages) {
          this.currentPage = 1;
        }
      }
    },
    mounted() {
      this.loadData();
      document.addEventListener('mousedown', this.handleClickOutside);
    },
    beforeDestroy() {
      document.removeEventListener('mousedown', this.handleClickOutside);
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
    vertical-align: top;
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

  /* === 行按钮状态 === */
  .row-status-btn {
    font-size: 12px;
    padding: 4px 8px;
    border-radius: 4px;
    border: none;
    cursor: pointer;
  }
  .row-status-btn.blue {
    color: #1e90ff;
    background-color: #e6f0ff;
  }
  .row-status-btn.red {
    color: red;
    background-color: #f0f0f0;
  }
  .row-status-btn.green {
    color: green;
    background-color: #e7f9e7;
  }

  /* === 单元格按钮状态 === */
  .cell-status-btn {
    font-size: 12px;
    padding: 2px 6px;
    border-radius: 4px;
    margin-right: 4px;
    border: none;
    cursor: pointer;
  }
  .cell-status-btn.red {
    color: red;
    background-color: #fce2e2;
  }
  .cell-status-btn.green {
    color: green;
    background-color: #e7f9e7;
  }

  /* === 状态样式 === */
  .cell-changed {
    background-color: #fff0f0 !important;
  }
  .row-deleted {
    background-color: #e0e0e0 !important;
  }

  /* === 分页 === */
  .pagination {
    display: flex;
    justify-content: center;
    align-items: center;
    margin-top: 20px;
    gap: 20px;
  }
  .pagination .page-info {
    font-size: 16px;
    color: #003049;
  }
  .pagination button {
    background-color: #f5f3f4;
    color: #003049;
    border: none;
    padding: 8px 16px;
    border-radius: 5px;
    cursor: pointer;
  }
  .pagination button:hover {
    background-color: #003049;
    color: white;
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
  }

  /* === 高亮关键词 === */
  mark {
    background-color: yellow;
    font-weight: bold;
  }
</style>
