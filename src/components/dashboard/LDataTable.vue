<template>
  <div class="table-section" style="position: relative;">
    <h3 class="section-title">搜索结果数据详情</h3>
    <ChartSpinner :visible="loading" />
    <div class="table-wrapper">
      <table class="data-table">
        <thead>
          <tr>
            <th>序号</th>
            <th>公司</th>
            <th>入表科目</th>
            <th>省份</th>
            <th>所属证券行业分布</th>
            <th>数据资源入表总额<br>（万元）</th>
            <th>数据资产<br>占总资产比例</th>
            <th>无形资产-<br>数据资源入表金额<br>（万元）</th>
            <th>开发支出-<br>数据资源入表金额<br>（万元）</th>
            <th>存货-<br>数据资源入表金额<br>（万元）</th>
            <th>报告时间</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, index) in tableData" :key="index">
            <td style="text-align: center;">{{ (currentPage - 1) * pageSize + index + 1 }}</td>
            <td>{{ row['公司'] }}</td>
            <td>{{ row['入表科目'] }}</td>
            <td>{{ row['省份'] }}</td>
            <td>{{ row['所属证券行业分布'] }}</td>
            <td class="number-cell">{{ formatNumber(row['数据资源入表总额（万元）']) }}</td>
            <td class="number-cell">{{ formatPercentage(row['数据资产占总资产比例'], 2) }}</td>
            <td class="number-cell">{{ formatNumber(row['无形资产-数据资源入表金额（万元）']) }}</td>
            <td class="number-cell">{{ formatNumber(row['开发支出-数据资源入表金额（万元）']) }}</td>
            <td class="number-cell">{{ formatNumber(row['存货-数据资源入表金额（万元）']) }}</td>
            <td>{{ row['报告时间'] }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <PaginationControls
      v-if="totalPages > 0 && tableData.length > 0" :current-page="currentPage"
      :total-pages="totalPages"
      @page-changed="handlePageChangeFromPagination"
    />
    </div>
</template>

<script>
import ChartSpinner from '@/components/common/ChartSpinner.vue';
import PaginationControls from '@/components/common/PaginationControls.vue';
import { 
  formatToChineseYearMonth,
  formatNumber, 
  formatPercentage
} from '@/utils/formatters.js';

export default {
  name: 'LDataTable',
  components: {
    ChartSpinner,
    PaginationControls
  },
  props: {
    filters: { type: Object, required: true },
    tableData: { type: Array, required: true },
    totalRows: { type: Number, required: true },
    pageSize: { type: Number, default: 10 }
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
      if (this.totalRows === 0 || this.pageSize === 0) return 0;
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
      deep: true
    },
    totalRows() {
      this.adjustCurrentPage();
    },
    pageSize() {
      this.adjustCurrentPage();
    },

  },
  methods: {
    handlePageChangeFromPagination(newPage) {
      if (newPage >= 1 && newPage <= this.totalPages && newPage !== this.currentPage) {
        this.loading = true;
        this.currentPage = newPage;
        this.emitPageChange();
      }
    },
    emitPageChange() {
      this.$emit('page-change', this.currentPage);
    },
    stopLoading() {
      this.loading = false;
      // this.$emit('data-loaded'); // 如果父组件需要知道数据已在本组件内处理完毕，可以保留
    },
    adjustCurrentPage() {
        if(this.totalPages > 0 && this.currentPage > this.totalPages) {
            this.currentPage = this.totalPages;
        } else if (this.totalPages === 0 && this.totalRows > 0) {
            this.currentPage = 1;
        } else if (this.totalPages > 0 && this.currentPage < 1) {
            this.currentPage = 1;
        }
    },
    formatToChineseYearMonth, 
    formatNumber, 
    formatPercentage
  },
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

/* 1. 确保包裹容器可以处理溢出 */
  .table-wrapper {
    overflow-x: auto; /* 这是实现横向滚动的关键 */
    width: 100%;
  }

  /* 2. 让表格拥有一个最小宽度，当屏幕比这个宽度窄时，就会出现滚动条 */
  .data-table {
    width: 100%;
    min-width: 1200px; /* 设置一个合理的最小宽度 */
    border-collapse: collapse;
    font-size: 14px;
  }
  /* --- 核心修改结束 --- */

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
  .data-table th:nth-child(4),.data-table td:nth-child(4) { width: 50px; text-align: center;}

  .data-table th:nth-child(5),.data-table td:nth-child(5) { width: 260px; }
  .data-table th:nth-child(6),.data-table td:nth-child(6)，
  .data-table th:nth-child(7),.data-table td:nth-child(7)，
  .data-table td:nth-child(8)，.data-table td:nth-child(8),
  .data-table td:nth-child(9), .data-table td:nth-child(9),
  .data-table td:nth-child(10), .data-table td:nth-child(10) {
    width: 80px;
    min-width: 200px;
  }
  .data-table td:nth-child(11), .data-table td:nth-child(11) { width: 60px; text-align: center;}

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

</style>
