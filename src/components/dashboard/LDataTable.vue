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
            <td class="number-cell">{{ formatPercentage(row['数据资产占总资产比例']) }}</td>
            <td class="number-cell">{{ formatNumber(row['无形资产-数据资源入表金额（万元）']) }}</td>
            <td class="number-cell">{{ formatNumber(row['开发支出-数据资源入表金额（万元）']) }}</td>
            <td class="number-cell">{{ formatNumber(row['存货-数据资源入表金额（万元）']) }}</td>
            <td>{{ row['报告时间'] }}</td>  
          </tr>
        </tbody>
      </table>
    </div>

    <!-- ✅ 分页 -->
    <div class="pagination">
      <div class="pagination-center">
        <button @click="changePage(currentPage - 1)" :disabled="currentPage === 1">上一页</button>
        <span class="page-info">{{ currentPage }} / {{ totalPages }}</span>
        <button @click="changePage(currentPage + 1)" :disabled="currentPage >= totalPages">下一页</button>
      </div>
      <div class="pagination-right"></div>
    </div>
  </div>
</template>

<script>
import ChartSpinner from '@/components/common/ChartSpinner.vue';

export default {
  name: 'LDataTable',
  components: { ChartSpinner },
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
      return Math.max(1, Math.ceil(this.totalRows / this.pageSize));
    }
  },
  watch: {
    filters: {
      handler() {
        if (this.initialized) {
          this.loading = true; // ✅ 清空筛选后触发加载动画
          this.currentPage = 1;
          this.emitPageChange();
        } else {
          this.initialized = true;
        }
      },
      deep: true
    }
  },
  methods: {
    changePage(page) {
      if (page < 1 || page > this.totalPages) return;
      this.loading = true; // ✅ 翻页时触发加载动画
      this.currentPage = page;
      this.emitPageChange();
    },
    emitPageChange() {
      this.$emit('page-change', this.currentPage);
    },
    // ✅ 外部页面加载数据成功后调用
    stopLoading() {
      this.loading = false;
      this.$emit('data-loaded');
    },
    formatNumber(value) {
      if (value === null || value === undefined || value === '') return '-';
      const num = parseFloat(value);
      if (isNaN(num)) return value;
      return num.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    },
    formatPercentage(value) {
      if (value === null || value === undefined || value === '') return '-';
      const num = parseFloat(value);
      if (isNaN(num)) {
        return value; // 如果原始值不是数字 (例如文本)，直接返回原始值
      }
      // 假设原始值是小数形式，例如 0.15 代表 15%
      return (num * 100).toFixed(2) + '%';
    }
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
  .data-table th {
    color: #003049;
    border: 1px solid #ccc;
    font-weight: bold;
    padding: 11px;
    text-align: center;
    border-top: 2px solid #003049;
    border-bottom: 2px solid #003049;

  }
  .data-table td {
    border: 1px solid #ccc;
    padding: 10px 12px;
  }

  .data-table tbody tr:hover {
    background-color: #f1f1f1; /* 这是一个常用的浅灰色，与您 FinanceDashboardPage 中的一致 */
    /* 您也可以选择其他浅灰色，例如: */
    /* background-color: #f5f5f5; */
    /* background-color: #e9e9e9; */
  }

  .data-table th:nth-child(1),
  .data-table td:nth-child(1) {
    width: 28px;
    min-width: 25px;
    text-align: center;
  }
  .data-table th:nth-child(2), .data-table td:nth-child(2) { width: 78px; min-width: 70px; text-align: center;}
  .data-table th:nth-child(3), .data-table td:nth-child(3) { width: 70px; min-width: 40px; text-align: center;}
  
  .data-table th:nth-child(4),.data-table th:nth-child(4) { width: 50px; text-align: center;}
  .data-table th:nth-child(5),.data-table th:nth-child(5) { width: 260px; }
  .data-table th:nth-child(6),.data-table th:nth-child(6)，
  .data-table th:nth-child(7),.data-table th:nth-child(7)，
  .data-table td:nth-child(8)，.data-table th:nth-child(8),
  .data-table td:nth-child(9), .data-table th:nth-child(9) {
    width: 80px;
    min-width: 200px;
  }
  .data-table td:nth-child(10), .data-table th:nth-child(10) { width: 40px; text-align: center;}

  .data-table td.number-cell {
    text-align: right;
    white-space: nowrap;
  }

  tr:last-child td {
    border-bottom: 2px solid #003049;
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
    background-color: #003049;
    color: white;
    border: none;
    padding: 12px 20px;
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
