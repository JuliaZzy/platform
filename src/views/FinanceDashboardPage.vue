<template>
  <div class="finance-page">
    <div class="dashboard-title-block">
      <h1 class="dashboard-title">数据相关融资情况</h1>
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
              <td v-for="key in bankTableDisplayConfig.columnOrder" :key="key"
                  :class="{ 'text-right': key === 'finance_value' }">
                
                <span v-if="key === 'month_time'">
                  {{ formatToChineseYearMonth(row[key]) }}
                </span>
                <span v-else-if="key === 'finance_value'">
                  {{ formatNumber(row[key]) }}
                </span>
                <span v-else>
                  {{ row[key] }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
        <p v-else class="no-data">没有数据可显示。</p>
      </div>
      <PaginationControls
        v-if="!loading.bank && bankData.length > 0 && pagination.bank.totalPages > 0"
        :current-page="pagination.bank.currentPage"
        :total-pages="pagination.bank.totalPages"
        :page-size="pagination.bank.pageSize"
        @page-changed="newPage => changePage('bank', newPage)"
      />
      <div class="pagination-left-download" v-if="!loading.bank && bankData.length > 0 && pagination.bank.totalPages > 1">
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
    </div>

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
              <th v-for="headerKey in getHeaders(stockData, 'stock')" :key="headerKey">{{ headerKey }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, index) in stockData" :key="index">
              <td style="text-align: center;">
                {{ (pagination.stock.currentPage - 1) * pagination.stock.pageSize + index + 1 }}
              </td>
              <td v-for="headerKey in getHeaders(stockData, 'stock')" :key="headerKey">
                <span v-if="headerKey === '入股时间'">{{ formatToChineseYearMonth(row[headerKey]) }}</span>
                <span v-else>{{ formatValue(row[headerKey]) }}</span>
              </td>
            </tr>
          </tbody>
        </table>
        <p v-else class="no-data">没有数据可显示。</p>
      </div>
      <PaginationControls
        v-if="!loading.stock && stockData.length > 0 && pagination.stock.totalPages > 0"
        :current-page="pagination.stock.currentPage"
        :total-pages="pagination.stock.totalPages"
        :page-size="pagination.stock.pageSize"
        @page-changed="newPage => changePage('stock', newPage)"
      />
       <div class="pagination-left-download" v-if="!loading.stock && stockData.length > 0 && pagination.stock.totalPages > 0">
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
    </div>

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
              <th v-for="headerKey in getHeaders(otherData, 'other')" :key="headerKey">{{ headerKey }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, index) in otherData" :key="index">
              <td style="text-align: center;">
                {{ (pagination.other.currentPage - 1) * pagination.other.pageSize + index + 1 }}
              </td>
              <td v-for="headerKey in getHeaders(otherData, 'other')" :key="headerKey">
                <span v-if="headerKey === '日期'">{{ formatToChineseYearMonth(row[headerKey]) }}</span>
                <span v-else>{{ formatValue(row[headerKey]) }}</span>
              </td>
            </tr>
          </tbody>
        </table>
        <p v-else class="no-data">没有数据可显示。</p>
      </div>
      <PaginationControls
        v-if="!loading.other && otherData.length > 0 && pagination.other.totalPages > 0"
        :current-page="pagination.other.currentPage"
        :total-pages="pagination.other.totalPages"
        :page-size="pagination.other.pageSize"
        @page-changed="newPage => changePage('other', newPage)"
      />
       <div class="pagination-left-download" v-if="!loading.other && otherData.length > 0 && pagination.other.totalPages > 0">
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
    </div>

    <footer class="page-footer" v-show="!isLoading">
      {{ footerText }}
    </footer>
  </div>
</template>

<script>
import axios from 'axios';
import ChartSpinner from '@/components/common/ChartSpinner.vue';
import PaginationControls from '@/components/common/PaginationControls.vue';
import { 
  formatToChineseYearMonth,
  formatNumber,
  formatPercentage
} from '@/utils/formatters.js';

export default {
  name: 'FinanceDashboardPage',
  components: { ChartSpinner, PaginationControls }, 
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
      pagination: {
        bank: { currentPage: 1, pageSize: 10, totalRows: 0, totalPages: 1 },
        stock: { currentPage: 1, pageSize: 10, totalRows: 0, totalPages: 1 },
        other: { currentPage: 1, pageSize: 10, totalRows: 0, totalPages: 1 },
      },
      bankTableDisplayConfig: {
        columnMap: {
          month_time: '入表月份',
          show_name: '入表企业',
          dataasset_content: '数据资产内容',
          finance_value: '融资金额（万元）',
          finance_type: '融资类型',
          finance_orgs: '融资机构'
        },
        columnOrder: ['month_time', 'show_name', 'dataasset_content', 'finance_value', 'finance_type', 'finance_orgs']
      },
      footerText: '数据来源：公开信息、高金智库数据资产研究课题组'
    };
  },
  mounted() {
    this.fetchData('bank', 1);
    this.fetchData('stock', 1);
    this.fetchData('other', 1);
  },
  methods: {
    formatToChineseYearMonth,
    formatNumber,
    formatPercentage,
    getHeaders(dataArray, type) {
      if (type === 'bank' && dataArray && dataArray.length > 0) {
        return this.bankTableDisplayConfig.columnOrder; 
      }
      if (dataArray && dataArray.length > 0) {
        return Object.keys(dataArray[0]).filter(key => key !== 'updated_at');
      }
      return [];
    },
    formatValue(value) {
        return value !== null && value !== undefined ? String(value) : '';
    },
    /**
     * @description: 从后端获取指定类型的数据。
     * @param {string} type - 数据类型 ('bank', 'stock', 'other')。
     * @param {number} page - 请求的页码。
     */
    async fetchData(type, page, pageSize) {
      this.loading[type] = true;
      const currentPagination = this.pagination[type];
      const effectivePageSize = pageSize !== undefined ? pageSize : currentPagination.pageSize;

      try {
        const response = await axios.get(`${this.apiBase}/data/${type}`, {
          params: {
            page: page,
            pageSize: effectivePageSize
          }
        });

        if (response && response.data && Array.isArray(response.data.data)) {
            this[`${type}Data`] = response.data.data;
            currentPagination.totalRows = response.data.total || 0;
            currentPagination.pageSize = effectivePageSize;
            currentPagination.totalPages = Math.ceil(currentPagination.totalRows / currentPagination.pageSize) || 1;
            currentPagination.currentPage = page;
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
      const apiUrl = `${this.apiBase}/export/${type}`;
      const loadingKey = `${type}_dl`;
      let specificFilename = '';
    
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const dateString = `${year}${month}${day}`;
    
      switch (type) {
        case 'bank':
          specificFilename = `数据资产增信银行贷款清单_${dateString}.pdf`;
          break;
        case 'stock':
          specificFilename = `数据资产作价入股清单_${dateString}.pdf`;
          break;
        case 'other':
          specificFilename = `其他数据类融资清单_${dateString}.pdf`;
          break;
        default:
          specificFilename = `导出数据_${dateString}.pdf`;
      }

      try {
        this.loading[loadingKey] = true;

        const response = await axios({
          url: apiUrl,
          method: 'POST',
          responseType: 'blob',
        });

        const blob = new Blob([response.data], { type: 'application/pdf' });

        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = specificFilename;

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(link.href);

        if (this.$message) {
            this.$message.success('文件已开始下载');
        }

      } catch (err) {
        console.error(`导出 ${type} 报告失败:`, err);
        let errorMessage = '导出失败，请稍后重试';
        if (err.response) {
            try {
                const errorText = await err.response.data.text();
                const errorData = JSON.parse(errorText);
                if (errorData && errorData.error) {
                    errorMessage = errorData.error;
                }
            } catch (e) {
                errorMessage = `导出失败: ${err.response.statusText || '服务器发生错误'}`;
            }
        }
        this.$message ? this.$message.error(errorMessage) : alert(errorMessage);
      } finally {
        this.loading[loadingKey] = false;
      }
    },

    // 翻页
    changePage(type, newPage) {
      const currentPagination = this.pagination[type];
      if (newPage >= 1 && newPage <= currentPagination.totalPages && newPage !== currentPagination.currentPage) {
        this.fetchData(type, newPage, currentPagination.pageSize);
      }
    }
  }
};
</script>

<style scoped>
.finance-page {
  padding: 0px 30px 20px;
  background-color: #f4f7f6;
  min-height: calc(100vh - 50px);
}

.dashboard-title-block {
  margin: 20px 0 20px;
  padding: 30px;
  overflow-x: hidden;
}

.section-divider {
  border: none;
  border-top: 1px dashed #ccc;
  margin: 40px 0;
}

.dashboard-title {
  font-size: 28px;
  font-weight: bold;
  color: #2e3968;
  margin: 0;
}

.section-title {
  font-size: 20px;
  font-weight: 600;
  color: #2e3968;
  margin: 0;
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

.table-wrapper {
  overflow-x: auto;
  min-height: 200px;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.data-table th {
  color: #2e3968;
  border: 1px solid #e0e0e0; 
  font-weight: bold;
  padding: 12px 15px;
  text-align: center;
  border-top: 2px solid #2e3968;
  border-bottom: 2px solid #2e3968;
  white-space: nowrap;
}

.data-table td {
  border: 1px solid #e0e0e0;
  padding: 10px 15px;
  text-align: left;
  vertical-align: middle;
}

.data-table tbody tr:hover {
  background-color: #f1f1f1;
}

.data-table tr:last-child td {
  border-bottom: 2px solid #2e3968;
}

.data-table th:first-child,
.data-table td:first-child {
  text-align: center;
  width: 30px;
  min-width: 20px;
}

.data-table th:nth-child(2),
.data-table td:nth-child(2) {
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

#other-table th:nth-child(3) {
  min-width: 90px;
}
#other-table td:nth-child(3) {
  min-width: 90px;
}

#other-table th:nth-child(8),
#other-table td:nth-child(8) {
  text-align: right;
}

.text-right { text-align: right; }

.no-data {
  padding: 30px;
  text-align: center;
  color: #888;
  font-size: 16px;
}

.download-btn-pagination.el-button {
  background-color: #2e3968;
  color: white;
  border: none;
  margin-top: 20px;
  padding: 12px 20px;
  border-radius: 5px;
  font-size: 13px;
}

.download-btn-pagination.el-button:hover {
  background-color: #f0f0f0;
  color: #2e3968;
}

.page-button {
  background-color: #2e3968;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s, color 0.3s;
}

.page-button:hover:not(:disabled) {
  background-color: #f0f0f0;
  color: #2e3968;
}

.page-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  font-weight: bold;
  color: #2e3968;
}

.page-footer {
  padding: 20px 30px;
  text-align: left;
  font-size: 14px;
  color: #888;
  line-height: 1.6;
}

@media (max-width: 1200px) {
  .dashboard-content {
    width: 85%;
  }
}

@media (max-width: 992px) {
  .dashboard-content {
    width: 90%;
  }
}

@media (max-width: 768px) {
  .finance-page {
    padding: 10px 0;
  }
  .dashboard-content {
    width: 95%;
  }
  .dashboard-title {
    font-size: 22px;
  }
  .section-title {
    font-size: 18px;
  }
  .table-section {
    padding: 15px;
  }
  .data-table {
    font-size: 13px;
  }
  .data-table th, .data-table td {
    padding: 8px 10px;
  }
  .table-footer-controls {
    flex-direction: column-reverse;
    align-items: center;
    gap: 15px;
  }

  .page-footer {
    padding: 15px;
    font-size: 12px;
  }
}

</style>

