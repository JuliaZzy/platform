<template>
  <div class="finance-page">
    <div class="dashboard-title-block">
      <h1 class="dashboard-title">数据相关融资项情况</h1>
      <p class="dashboard-subtitle">Overview of Financial Data Assets</p>
    </div>

    <div class="table-section">
      <div class="table-header">
        <h3 class="section-title">数据资产增信银行贷款</h3>
        </div>
      <ChartSpinner :visible="loading.bank" /> 
      <div class="table-wrapper" v-if="!loading.bank"> 
        <table class="data-table" id="bank-table" v-if="bankData.length > 0">
          <thead>
            <tr>
              <th style="text-align: center;">序号</th>
              <th v-for="key in bankTableDisplayConfig.columnOrder" :key="key">
                {{ bankTableDisplayConfig.columnMap[key] }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, index) in bankData" :key="index">
              <td style="text-align: center;">
                {{ (pagination.bank.currentPage - 1) * pagination.bank.pageSize + index + 1 }}
              </td>
              <td v-for="key in bankTableDisplayConfig.columnOrder" :key="key">
                {{ formatValue(row[key]) }}
              </td>
            </tr>
          </tbody>
        </table>
        <p v-else class="no-data">没有数据可显示。</p>
      </div>
      <div class="pagination" v-if="!loading.bank && bankData.length > 0">
        <div class="pagination-left">
          <el-button 
            class="download-btn-pagination" 
            @click="download('bank')" 
            :loading="loading.bank_dl"
            type="primary"
            size="small" 
          >
            下载数据<i class="el-icon-arrow-down el-icon--right" v-if="!loading.bank_dl"></i>
          </el-button>
        </div>
        <div class="pagination-center" v-if="pagination.bank.totalPages > 1">
          <el-button 
            @click="changePage('bank', pagination.bank.currentPage - 1)" 
            :disabled="pagination.bank.currentPage === 1"
            size="small"
          >
            上一页
          </el-button>
          <span class="page-info">
            第 {{ pagination.bank.currentPage }} / {{ pagination.bank.totalPages }} 页
          </span>
          <el-button 
            @click="changePage('bank', pagination.bank.currentPage + 1)" 
            :disabled="pagination.bank.currentPage === pagination.bank.totalPages"
            size="small"
          >
            下一页
          </el-button>
        </div>
        <div class="pagination-right">
          </div>
      </div>
    </div>

    <hr class="section-divider">

    <div class="table-section">
      <div class="table-header">
        <h3 class="section-title">数据资产作价入股</h3>
        </div>
      <ChartSpinner :visible="loading.stock" />
      <div class="table-wrapper" v-if="!loading.stock">
        <table class="data-table" id="stock-table" v-if="stockData.length > 0">
          <thead>
            <tr>
              <th style="text-align: center;">序号</th>
              <th v-for="header in getHeaders(stockData)" :key="header">{{ header }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, index) in stockData" :key="index">
              <td style="text-align: center;">
                {{ (pagination.stock.currentPage - 1) * pagination.stock.pageSize + index + 1 }}
              </td>
              <td v-for="header in getHeaders(stockData)" :key="header">
                {{ formatValue(row[header]) }}
              </td>
            </tr>
          </tbody>
        </table>
        <p v-else class="no-data">没有数据可显示。</p>
      </div>
      <div class="pagination" v-if="!loading.stock && stockData.length > 0">
        <div class="pagination-left">
          <el-button 
            class="download-btn-pagination" 
            @click="download('stock')" 
            :loading="loading.stock_dl"
            type="primary"
            size="small" 
          >
            下载数据<i class="el-icon-arrow-down el-icon--right" v-if="!loading.stock_dl"></i>
          </el-button>
        </div>
        <div class="pagination-center" v-if="pagination.stock.totalPages > 1">
          <el-button 
            @click="changePage('stock', pagination.stock.currentPage - 1)" 
            :disabled="pagination.stock.currentPage === 1"
            size="small"
          >
            上一页
          </el-button>
          <span class="page-info">
            第 {{ pagination.stock.currentPage }} / {{ pagination.stock.totalPages }} 页
          </span>
          <el-button 
            @click="changePage('stock', pagination.stock.currentPage + 1)" 
            :disabled="pagination.stock.currentPage === pagination.stock.totalPages"
            size="small"
          >
            下一页
          </el-button>
        </div>
        <div class="pagination-right">
          </div>
      </div>
    </div>

    <hr class="section-divider">

    <div class="table-section">
      <div class="table-header">
        <h3 class="section-title">其他数据类融资</h3>
        </div>
      <ChartSpinner :visible="loading.other" />
      <div class="table-wrapper" v-if="!loading.other">
        <table class="data-table" id="other-table" v-if="otherData.length > 0">
          <thead>
            <tr>
              <th style="text-align: center;">序号</th>
              <th v-for="header in getHeaders(otherData)" :key="header">{{ header }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, index) in otherData" :key="index">
              <td style="text-align: center;">
                {{ (pagination.other.currentPage - 1) * pagination.other.pageSize + index + 1 }}
              </td>
              <td v-for="header in getHeaders(otherData)" :key="header">
                {{ formatValue(row[header]) }}
              </td>
            </tr>
          </tbody>
        </table>
        <p v-else class="no-data">没有数据可显示。</p>
      </div>
      <div class="pagination" v-if="!loading.other && otherData.length > 0">
        <div class="pagination-left">
          <el-button 
            class="download-btn-pagination" 
            @click="download('other')" 
            :loading="loading.other_dl"
            type="primary"
            size="small" 
          >
            下载数据<i class="el-icon-arrow-down el-icon--right" v-if="!loading.other_dl"></i>
          </el-button>
        </div>
        <div class="pagination-center" v-if="pagination.other.totalPages > 1">
          <el-button 
            @click="changePage('other', pagination.other.currentPage - 1)" 
            :disabled="pagination.other.currentPage === 1"
            size="small"
          >
            上一页
          </el-button>
          <span class="page-info">
            第 {{ pagination.other.currentPage }} / {{ pagination.other.totalPages }} 页
          </span>
          <el-button 
            @click="changePage('other', pagination.other.currentPage + 1)" 
            :disabled="pagination.other.currentPage === pagination.other.totalPages"
            size="small"
          >
            下一页
          </el-button>
        </div>
        <div class="pagination-right">
          </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import { downloadPdf } from '@/utils/pdfDownloader.js';
import ChartSpinner from '@/components/common/ChartSpinner.vue';

export default {
  name: 'FinanceDashboardPage',
  components: { ChartSpinner }, 
  data() {
    return {
      bankData: [],
      stockData: [],
      otherData: [],
      loading: {
          bank: false,
          stock: false,
          other: false,
          bank_dl: false,
          stock_dl: false,
          other_dl: false
      },
      apiBase: '/api/finance',
      // ✅ 2. 为分页增加数据
      pagination: {
        bank: { currentPage: 1, pageSize: 10, totalRows: 0, totalPages: 1 },
        stock: { currentPage: 1, pageSize: 10, totalRows: 0, totalPages: 1 },
        other: { currentPage: 1, pageSize: 10, totalRows: 0, totalPages: 1 },
      },
      // ✅ 3. 银行表列名映射
      bankTableDisplayConfig: {
        columnMap: {
          month_time: '入表月份',
          show_name: '入表企业', // 确保您的数据中此字段为 show_name
          dataasset_content: '数据资产内容',
          finance_value: '融资金额（万元）',
          finance_type: '融资类型',
          finance_orgs: '融资机构'
        },
        // 定义显示顺序
        columnOrder: ['month_time', 'show_name', 'dataasset_content', 'finance_value', 'finance_type', 'finance_orgs']
      }
    };
  },
  mounted() {
    // ✅ 2. 获取第一页数据
    this.fetchData('bank', 1);
    this.fetchData('stock', 1);
    this.fetchData('other', 1);
  },
  methods: {
    getHeaders(dataArray, type) { // ✅ 3. 调整 getHeaders 以处理银行表
      if (type === 'bank' && dataArray && dataArray.length > 0) {
        return this.bankTableDisplayConfig.columnOrder; 
      }
      return dataArray && dataArray.length > 0 ? Object.keys(dataArray[0]) : [];
    },
    formatValue(value) {
        return value !== null && value !== undefined ? String(value) : ''; // 确保转为字符串
    },
    /**
     * @description: 从后端获取指定类型的数据。
     * @param {string} type - 数据类型 ('bank', 'stock', 'other')。
     * @param {number} page - 请求的页码。
     */
    async fetchData(type, page) {
      this.loading[type] = true;
      const currentPagination = this.pagination[type];
      try {
        // ✅ 2. 请求中加入分页参数
        const response = await axios.get(`${this.apiBase}/data/${type}`, {
          params: {
            page: page,
            pageSize: currentPagination.pageSize
          }
        });

        if (response && response.data && Array.isArray(response.data.data)) {
            this[`${type}Data`] = response.data.data;
            // ✅ 2. 更新总行数和总页数
            currentPagination.totalRows = response.data.total || 0;
            currentPagination.totalPages = Math.ceil(currentPagination.totalRows / currentPagination.pageSize) || 1;
            currentPagination.currentPage = page; // 更新当前页
        } else {
            console.error(`Error fetching ${type} data: Invalid response structure.`, response.data);
            this[`${type}Data`] = []; 
            currentPagination.totalRows = 0;
            currentPagination.totalPages = 1;
            if (this.$message) {
                this.$message.error(`加载 ${type} 数据失败：响应格式不正确`);
            } else {
                alert(`加载 ${type} 数据失败：响应格式不正确`);
            }
        }
      } catch (error) {
        console.error(`Error fetching ${type} data:`, error);
        this[`${type}Data`] = []; 
        currentPagination.totalRows = 0;
        currentPagination.totalPages = 1;
        if (this.$message) {
            this.$message.error(`加载 ${type} 数据失败`);
        } else {
            alert(`加载 ${type} 数据失败`);
        }
      } finally {
        this.loading[type] = false;
      }
    },
    /**
     * @description: 下载指定类型的 PDF。
     * @param {string} type - 数据类型 ('bank', 'stock', 'other')。
     */
    async download(type) {
      // ⚠️ PDF 下载目前是下载全部数据。如果需要按当前筛选或分页下载，需修改后端。
      const apiUrl = `${this.apiBase}/export/${type}`; 
      // ✅ 3. 为银行表下载构造特定文件名，使用映射后的中文标题
      const defaultFilename = type === 'bank' 
        ? `银行数据报告_${Date.now()}.pdf` 
        : `金融数据_${type}_${Date.now()}.pdf`;
      
      const loadingKey = `${type}_dl`;

      await downloadPdf({
          apiUrl: apiUrl,
          filters: {}, 
          defaultFilename: defaultFilename,
          onStart: () => { this.loading[loadingKey] = true; },
          onFinish: () => { this.loading[loadingKey] = false; },
          onError: (msg) => { 
              this.$message ? this.$message.error(msg) : alert(msg); 
          }
      });
    },
    // ✅ 2. 新增翻页方法
    changePage(type, newPage) {
      const currentPagination = this.pagination[type];
      if (newPage >= 1 && newPage <= currentPagination.totalPages && newPage !== currentPagination.currentPage) {
        this.fetchData(type, newPage);
      }
    }
  }
};
</script>

<style scoped>
/* ✅ 1. 添加大标题样式 */
.dashboard-title-block {
  margin: 20px 30px 20px; /* 与LSDashboardPage一致，但减少了底部间距 */
  padding: 30px;
  background: #f9f9f9;
  overflow-x: hidden; /* 彻底移除横向滚动条 */
}

.dashboard-title {
  font-size: 24px;
  font-weight: bold;
  color: #003049;
  margin: 0;
}

.dashboard-subtitle {
  font-size: 18px;
  font-weight: bold; /* LSDashboardPage 中是 normal，这里改为 bold 与标题更协调 */
  color: #005f73; /* 调整为稍深一点的青色 */
  margin-top: 6px;
}

/* 其他样式与之前相同 */
.finance-page {
  padding: 0px 30px 20px; /* 顶部留白减少，因为标题块自带margin */
  background-color: #f4f7f6; 
  min-height: calc(100vh - 50px); 
}

.table-section {
  background-color: white;
  padding: 25px; 
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08); 
  margin-bottom: 30px; 
  position: relative; 
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px; 
  padding-bottom: 15px; 
  border-bottom: 1px solid #eee; 
}

.section-title {
  font-size: 20px; 
  font-weight: 600; 
  color: #003049;
  margin: 0; 
}

.download-btn.el-button { 
  background-color: #003049;
  color: white;
  border-color: #003049;
  transition: background-color 0.3s ease, color 0.3s ease;
}
.download-btn.el-button:hover {
  background-color: #00507a; 
  border-color: #00507a;
  color: white;
}

.section-divider {
  border: none;
  border-top: 1px dashed #ccc;
  margin: 40px 0; 
}

.table-wrapper {
  overflow-x: auto; 
  min-height: 200px; /* 增加最小高度，避免翻页时高度变化过大 */
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.data-table th {
  color: #003049;
  border: 1px solid #e0e0e0; 
  font-weight: bold;
  padding: 12px 15px; 
  text-align: centre; 
  border-top: 2px solid #003049;
  border-bottom: 2px solid #003049;
  white-space: nowrap; 
}

.data-table td {
  border: 1px solid #e0e0e0;
  padding: 10px 15px;
  text-align: left;
  vertical-align: middle; 
}

.data-table th:first-child,
.data-table td:first-child {
  text-align: center;
  width: 30px; 
  min-width: 20px;
}

.data-table th:nth-child(2),
.data-table td:nth-child(2){
  width: 90px;
  min-width: 25px;
  text-align: center;
}

#bank-table th:nth-child(5),
#bank-table td:nth-child(5) {
  text-align: right;
}

#stock-table th:nth-child(6),
#stock-table td:nth-child(6),
#stock-table th:nth-child(7),
#stock-table td:nth-child(7),
#stock-table th:nth-child(8),
#stock-table td:nth-child(8) {
  text-align: right;
}

#other-table th:nth-child(3),
#other-table td:nth-child(3) {
  min-width: 90px;
}

#other-table th:nth-child(8),
#other-table td:nth-child(8) {
  text-align: right;
}

/* 隔行色填充
.data-table tbody tr:nth-child(even) {
    background-color: #f9f9f9;
}
*/

.data-table tbody tr:hover {
    background-color: #f1f1f1; 
}

.data-table th:first-child,
.data-table td:first-child {
  border-left: none;
}
.data-table th:last-child,
.data-table td:last-child {
  border-right: none;
}

 tr:last-child td {
  border-bottom: 2px solid #003049;
}

.no-data {
    padding: 30px;
    text-align: center;
    color: #888;
    font-size: 16px;
}

/* ✅ 2. 添加翻页控件样式 */
.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
  flex-wrap: wrap; /* 允许换行以适应小屏幕 */
}

.pagination-left,
.pagination-right {
  flex: 1; /* 两端占据剩余空间 */
  display: flex;
  align-items: center;
}
.pagination-left {
  justify-content: flex-start;
}
.pagination-right {
  justify-content: flex-end;
}

.pagination-center {
  /* flex: 2; */ /* 中间部分可以稍微宽一些，或不设置flex，由内容撑开 */
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px; /* 控件之间的间隙 */
}

.download-btn-pagination.el-button {
background-color: #003049;
color: white;
border: none;
padding: 12px 20px;
border-radius: 5px;
font-size: 13px;
}
.download-btn-pagination.el-button:hover {
background-color: #f0f0f0;
color: #003049;
}

.pagination-center .el-button {
background-color: #003049;
color: white;
border: none;
padding: 8px 16px;
border-radius: 5px;
cursor: pointer;
transition: 0.3s;
}
.pagination-center .el-button:hover {
background-color: #f0f0f0;
color: #003049;
}
.pagination-center .el-button:disabled {
opacity: 0.5;
cursor: not-allowed;
}
.page-info {
font-weight: bold;
color: #003049;
}

</style>