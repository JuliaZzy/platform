import * as adminService from '@/services/adminApiService.js';
import { formatToDateTimeSec } from '@/utils/formatters.js';

export const dataTableMixin = {
  data() {
    return {
      tableData: [],
      tableDataTotalRows: 0,
      processedTableHeaders: [],
      tableLastUpdateTimes: {},
      uniqueColumnValues: {},
      filters: {},
      searchKeyword: '',
      currentPage: 1,
      pageSize: 30,
      filterOptionsCache: {},
      tableLoadingState: {
        listed: true, nonlisted: true, 'finance-bank': true,
        'finance-stock': true, 'finance-other': true,
      },
    };
  },
  computed: {
    totalPages() {
        if (this.totalRows === 0 || this.pageSize === 0) return 0;
        return Math.max(1, Math.ceil(this.totalRows / this.pageSize));
    },
    formattedLastUpdate() {
      const lastUpdateTime = this.tableLastUpdateTimes[this.currentTab];
      return lastUpdateTime ? formatToDateTimeSec(lastUpdateTime) : '暂无记录';
    },
  },
  methods: {
    async loadData() {
      if (this.currentTab === 'reports') return;
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

        // 处理表头逻辑
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
    
    async handleUpdateStatus({ row, status }) {
      if (!this.isEditMode) {
        alert('请先进入修改模式！');
        return;
      }

      const targetRow = this.tableData.find(item => item.id === row.id);
      if (targetRow) {
        this.$set(targetRow, 'status', status);
      }
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
  }
};