<template>
  <div class="table-section">
    <h3 class="section-title">搜索结果数据详情</h3>
    <div class="table-wrapper">
      <table class="data-table">
        <thead>
          <tr>
            <th style="width: 30px; text-align: center;">序号</th>
            <th>入表时间</th>
            <th>省级行政区</th>
            <th>入表企业</th>
            <th>数据资产类型</th>
            <th>会计科目</th>
            <th>评估方法</th>
            <th>数据资产登记机构</th>
            <th>账面金额（万元）</th>
            <th>融资金额（万元）</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, index) in tableData" :key="row.id">
            <td style="text-align: center;">{{ (currentPage - 1) * pageSize + index + 1 }}</td>
            <td>{{ row.month_time }}</td>
            <td>{{ row.province_area }}</td>
            <td>{{ row.company_name }}</td>
            <td>{{ row.dataasset_type }}</td>
            <td>{{ row.accounting_subject }}</td>
            <td>{{ row.valuation_method }}</td>
            <td>{{ row.dataasset_register_addr }}</td>
            <td class="number-cell">{{ formatNumber(row.book_value) }}</td>
            <td class="number-cell">{{ formatNumber(row.finance_value) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- ✅ 合并导出按钮与分页按钮 -->
    <div class="pagination">
      <!-- 左侧：导出按钮 -->
      <div class="pagination-left">
        <el-dropdown @command="handleExportCommand">
          <el-button class="export-small-btn" type="primary">
            下载 Excel<i class="el-icon-arrow-down el-icon--right"></i>
          </el-button>
          <el-dropdown-menu slot="dropdown">
            <el-dropdown-item command="all">下载全部数据</el-dropdown-item>
            <el-dropdown-item command="current">下载当前数据</el-dropdown-item>
          </el-dropdown-menu>
        </el-dropdown>
      </div>

      <!-- 中间：分页按钮 -->
      <div class="pagination-center">
        <button @click="changePage(currentPage - 1)" :disabled="currentPage === 1">上一页</button>
        <span class="page-info">{{ currentPage }} / {{ totalPages }}</span>
        <button @click="changePage(currentPage + 1)" :disabled="currentPage >= totalPages">下一页</button>
      </div>

      <!-- 右侧：占位空白 -->
      <div class="pagination-right"></div>
    </div>

  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'LSDataTable',
  props: ['filters'],
  data() {
    return {
      currentPage: 1,
      pageSize: 10,
      tableData: [],
      totalRows: 0
    };
  },
  watch: {
    filters: {
      handler() {
        this.currentPage = 1;
        this.loadData();
      },
      immediate: true,
      deep: true
    }
  },
  computed: {
    totalPages() {
      return Math.max(1, Math.ceil(this.totalRows / this.pageSize));
    }
  },
  methods: {
    loadData() {
      axios.post('/api/lasset/query', {
        page: this.currentPage,
        pageSize: this.pageSize,
        filters: this.filters
      }).then(res => {
        this.tableData = res.data.rows || [];
        this.totalRows = res.data.total || 0;
        this.$emit('page-data', this.tableData);
      }).catch(err => {
        console.error('加载表格失败:', err);
      });
    },
    changePage(page) {
      if (page < 1 || page > this.totalPages) return;
      this.currentPage = page;
      this.loadData();
    },
    formatNumber(value) {
      if (value === null || value === undefined || value === '') return '-';
      const num = parseFloat(value);
      if (isNaN(num)) return value;
      return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    },

    // ✅ Excel 导出逻辑整合
    handleExportCommand(command) {
      if (command === 'all') {
        this.downloadFull();
      } else if (command === 'current') {
        this.downloadCurrent();
      }
    },
    downloadFull() {
      axios
        .post('/api/lasset/export', { filters: this.filters }, { responseType: 'blob' })
        .then(res => this.saveBlob(res.data, '全部数据.xlsx'))
        .catch(err => console.error('导出失败:', err));
    },
    async downloadCurrent() {
      try {
        const { data } = await axios.post('/api/lasset/query', {
          page: 1,
          pageSize: 10000,
          filters: this.filters
        });

        const rows = data.rows || [];
        if (!rows.length) return;

        const ExcelJS = await import('exceljs');
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('筛选数据');

        const columns = Object.keys(rows[0]);
        worksheet.columns = columns.map(col => ({
          header: col,
          key: col,
          width: 20
        }));

        rows.forEach(row => worksheet.addRow(row));

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });

        this.saveBlob(blob, '筛选结果.xlsx');
      } catch (err) {
        console.error('下载当前数据失败:', err);
      }
    },
    saveBlob(data, filename) {
      const url = window.URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }
};
</script>

<style scoped>
  .table-section {
    background-color: white;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  }
  .section-title {
    font-size: 18px;
    font-weight: bold;
    margin-bottom: 12px;
    color: #003049;
  }

  .el-button {
    background-color: #003049;
    color: #fff;
    border: none;
    border-radius: 4px;
    padding: 15px 20px;
    transition: all 0.4s;
  }
  .el-button:hover {
    text-decoration: underline;
    background-color: #003049;
    color: #ffffff;
  }
  .el-dropdown-menu {
    min-width: 160px;
  }
  .el-dropdown-item {
    font-size: 14px;
    padding: 10px 16px;
  }
  .el-dropdown-item:hover {
    background-color: #f5f5f5;
    color: #003049;
  }

  .table-wrapper {
    overflow-x: auto;
  }
  .data-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 14px;
  }
  .data-table th,
  .data-table td {
    border: 1px solid #ccc;
    padding: 10px 12px;
    text-align: left;
    min-width: 120px;
  }
  .data-table th {
    background-color: #f4f4f4;
    color: #003049;
    font-weight: bold;
  }
  .data-table th:nth-child(1),
  .data-table td:nth-child(1) {
    width: 30px;
    min-width: 30px;
    text-align: center;
  }
  .data-table th:nth-child(2) { min-width: 100px; }
  .data-table th:nth-child(3) { min-width: 60px; }
  .data-table td:nth-child(3) { width: 70px; min-width: 70px; }
  .data-table th:nth-last-child(-n+2) {
    min-width: 120px;
    text-align: right;
  }
  .data-table td.number-cell {
    text-align: right;
    white-space: nowrap;
  }
  .pagination {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 20px;
    flex-wrap: wrap;
  }

  .pagination-left,
  .pagination-right {
    flex: 1;
    display: flex;
    align-items: center;
  }

  .pagination-center {
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 20px;
  }

  .export-small-btn {
    background-color: #003049;
    color: white;
    border: none;
    padding: 8px 14px;
    border-radius: 5px;
    font-size: 13px;
  }
  .export-small-btn:hover {
    background-color: #f0f0f0;
    color: #003049;
  }

  .pagination button {
    background-color: #003049;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 5px;
    cursor: pointer;
    transition: 0.3s;
  }
  .pagination button:hover {
    background-color: #f0f0f0;
    color: #003049;
  }
  .pagination button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .page-info {
    font-weight: bold;
    color: #003049;
  }
</style>
