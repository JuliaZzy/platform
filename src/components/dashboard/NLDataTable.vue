<template>
  <div class="table-section" style="position: relative;">
    <h3 class="section-title">搜索结果数据详情</h3>

    <!-- ✅ 加载动画 -->
    <ChartSpinner :visible="loading" />

    <!-- ✅ 表格区域 -->
    <div class="table-wrapper">
      <table class="data-table">
        <thead>
          <tr>
            <th style="text-align: center;">序号</th>
            <th style="text-align: center;">入表月份</th>
            <th>省级行政区</th>
            <th>入表企业</th>
            <th>数据资产内容</th>
            <!--<th style="text-align: center;">入表会计科目</th>
            <th style="text-align: center;">评估方法</th>
            <th>账面金额<br>（万元）</th>
            <th>评估金额<br>（万元）</th>-->
            <th>数据资产登记机构</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, index) in tableData" :key="index">
            <td style="text-align: center;">{{ (currentPage - 1) * pageSize + index + 1 }}</td>
            <td>{{ formatToChineseYearMonth(row.month_time) }}</td>
            <td>{{ row.province_area }}</td>
            <td>{{ row.company_name }}</td>
            <td>{{ row.dataasset_content }}</td>
            <!--<td>{{ row.accounting_subject }}</td>
            <td>{{ row.valuation_method }}</td>
            <td class="number-cell">{{ formatNumber(row.book_value) }}</td>
            <td class="number-cell">{{ formatNumber(row.assess_value) }}</td>-->
            <td>{{ row.dataasset_register_addr }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- ✅ 分页与导出 -->
    <div class="pagination" v-if="totalPages > 0 && tableData.length > 0"> <div class="pagination-left">
        <el-dropdown @command="handleExportCommand">
          <el-button class="export-small-btn" type="primary">
            下载数据<i class="el-icon-arrow-down el-icon--right"></i>
          </el-button>
          <el-dropdown-menu slot="dropdown">
            <el-dropdown-item command="all">下载全部数据</el-dropdown-item>
            <el-dropdown-item command="current">下载当前数据</el-dropdown-item>
          </el-dropdown-menu>
        </el-dropdown>
      </div>

      <PaginationControls
        :current-page="currentPage"
        :total-pages="totalPages"
        :page-size="pageSize"
        @page-changed="changePage" 
      />
      <div class="pagination-right">
        </div>
    </div>
  </div>
</template>

<script>
import ChartSpinner from '@/components/common/ChartSpinner.vue';
import { downloadPdf } from '@/utils/pdfDownloader.js';
import PaginationControls from '@/components/common/PaginationControls.vue';
import { 
  formatToChineseYearMonth
} from '@/utils/formatters.js';

export default {
  name: 'NLDataTable',
  components: { ChartSpinner, PaginationControls },
  props: {
    filters: { type: Object, required: true },
    tableData: { type: Array, required: true },
    totalRows: { type: Number, required: true },
    pageSize: { type: Number, default: 10 },
    apiPrefix: { type: String, required: true }
  },
  data() {
    return {
      currentPage: 1,
      initialized: false,
      loading: false
    };
  },
  computed: {
    totalPages() {
      return Math.max(1, Math.ceil(this.totalRows / this.pageSize));
    }
  },
  watch: {
    filters: {
      handler() {
        if (this.initialized) {
          this.loading = true;
          this.currentPage = 1;
          this.emitPageChange();
        } else {
          this.initialized = true;
        }
      },
      immediate: true,
      deep: true
    }
  },
  methods: {
    changePage(page) {
      if (page < 1 || page > this.totalPages) return;
      this.loading = true;
      this.currentPage = page;
      this.emitPageChange();
    },
    emitPageChange() {
      this.$emit('page-change', this.currentPage);
    },

    stopLoading() {
      this.loading = false;
      this.$emit('data-loaded');
    },
    handleExportCommand(command) {
      console.log('[DataTable] handleExportCommand called with command:', command); // 新增日志
      if (command === 'all') {
        this.downloadPdfAll();
      } else if (command === 'current') {
        this.downloadPdfCurrent();
      }
    },
    // exportToPdf
    async downloadPdfAll() {
      const filename = `非上市公司数据资产入表清单_全部_${Date.now()}.pdf`;
      await downloadPdf({
          apiUrl: `${this.apiPrefix}/export`,
          filters: {}, // 发送空对象，表示下载全部
          defaultFilename: filename,
          onStart: () => { this.loading = true; },
          onFinish: () => { this.loading = false; },
          onError: (msg) => { alert(msg); }
      });
    },
    async downloadPdfCurrent() {
      const filename = `非上市公司数据资产入表清单_筛选后_${Date.now()}.pdf`;
      await downloadPdf({
          apiUrl: `${this.apiPrefix}/export`,
          filters: this.filters,
          defaultFilename: filename,
          onStart: () => { this.loading = true; },
          onFinish: () => { this.loading = false; },
          onError: (msg) => { alert(msg); }
      });
    },
    formatToChineseYearMonth
  }
}
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
    color: #2e3968;
  }

  .el-button {
    background-color: #2e3968;
    color: #fff;
    border: none;
    border-radius: 4px;
    padding: 15px 20px;
    transition: all 0.4s;
  }
  .el-button:hover {
    text-decoration: underline;
    background-color: #2e3968;
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
    color: #2e3968;
  }

  .table-wrapper {
    overflow-x: auto;
    width: 100%;
  }

  .data-table {
    width: 100%;
    min-width: 1000px;
    border-collapse: collapse;
    font-size: 14px;
  }
  
  .data-table th {
    color: #2e3968;
    border: 1px solid #ccc;
    font-weight: bold;
    padding: 11px;
    text-align: center;
    border-top: 2px solid #2e3968;
    border-bottom: 2px solid #2e3968;

  }
  .data-table td {
    color: #333;
    border: 1px solid #ccc;
    padding: 10px 12px;
  }

  .data-table tbody tr:hover {
    background-color: #f1f1f1;
  }

  .data-table th:nth-child(1),
  .data-table td:nth-child(1) {
    width: 28px;
    min-width: 25px;
    text-align: center;
  }
  .data-table th:nth-child(2), .data-table td:nth-child(2) { width: 78px; min-width: 70px; text-align: center;}
  .data-table th:nth-child(3), .data-table td:nth-child(3) { width: 70px; min-width: 40px; text-align: center;}
  
  .data-table th:nth-child(4),.data-table th:nth-child(4) { width: 180px; }
  .data-table th:nth-child(5),.data-table th:nth-child(5) { width: 220px; }
  .data-table th:nth-child(6),.data-table th:nth-child(6) { width: 130px; text-align: center;}

  .data-table td.number-cell {
    text-align: right;
    white-space: nowrap;
  }

  tr:last-child td {
    border-bottom: 2px solid #2e3968;
  }

  /* ✅ 去掉最左边竖线 */
.data-table th:first-child,
.data-table td:first-child {
  border-left: none;
}

/* ✅ 去掉最右边竖线 */
.data-table th:last-child,
.data-table td:last-child {
  border-right: none;
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
    background-color: #2e3968;
    color: white;
    border: none;
    padding: 12px 20px;
    border-radius: 5px;
    font-size: 13px;
  }
  .export-small-btn:hover {
    background-color: #f0f0f0;
    color: #2e3968;
  }

  .pagination button {
    background-color: #2e3968;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 5px;
    cursor: pointer;
    transition: 0.3s;
  }
  .pagination button:hover {
    background-color: #f0f0f0;
    color: #2e3968;
  }
  .pagination button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .page-info {
    font-weight: bold;
    color: #2e3968;
  }
</style>
