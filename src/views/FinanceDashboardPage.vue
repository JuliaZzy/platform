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
              <td v-for="key in bankTableDisplayConfig.columnOrder" :key="key">
                <span v-if="key === 'month_time'">{{ formatToChineseYearMonth(row[key]) }}</span>
                <span v-else>{{ formatValue(row[key]) }}</span>
              </td>
            </tr>
          </tbody>
        </table>
        <p v-else class="no-data">没有数据可显示。</p>
      </div>
      <div class="pagination" v-if="!loading.bank && bankData.length > 0 && pagination.bank.totalPages > 1">
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
        <div class="pagination-center">
          <button 
            class="page-button"
            @click="changePage('bank', pagination.bank.currentPage - 1)" 
            :disabled="pagination.bank.currentPage === 1"
          >
            上一页
          </button>
          <span class="page-info">
            {{ pagination.bank.currentPage }} / {{ pagination.bank.totalPages }}
          </span>
          <button 
            class="page-button"
            @click="changePage('bank', pagination.bank.currentPage + 1)" 
            :disabled="pagination.bank.currentPage === pagination.bank.totalPages"
          >
            下一页
          </button>
        </div>
        <div class="pagination-right"></div>
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
              <th v-for="headerKey in getHeaders(stockData)" :key="headerKey">{{ headerKey }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, index) in stockData" :key="index">
              <td style="text-align: center;">
                {{ (pagination.stock.currentPage - 1) * pagination.stock.pageSize + index + 1 }}
              </td>
              <td v-for="headerKey in getHeaders(stockData)" :key="headerKey">
                <span v-if="headerKey === '入股时间'">{{ formatToChineseYearMonth(row[headerKey]) }}</span>
                <span v-else>{{ formatValue(row[headerKey]) }}</span>
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
        <div class="pagination-center">
          <button 
            class="page-button"
            @click="changePage('stock', pagination.stock.currentPage - 1)" 
            :disabled="pagination.stock.currentPage === 1"
          >
            上一页
          </button>
          <span class="page-info">
            {{ pagination.stock.currentPage }} / {{ pagination.stock.totalPages }}
          </span>
          <button 
            class="page-button"
            @click="changePage('stock', pagination.stock.currentPage + 1)" 
            :disabled="pagination.stock.currentPage === pagination.stock.totalPages"
          >
            下一页
          </button>
        </div>
        <div class="pagination-right"></div>
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
              <th v-for="headerKey in getHeaders(otherData)" :key="headerKey">{{ headerKey }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, index) in otherData" :key="index">
              <td style="text-align: center;">
                {{ (pagination.other.currentPage - 1) * pagination.other.pageSize + index + 1 }}
              </td>
              <td v-for="headerKey in getHeaders(otherData)" :key="headerKey">
                <span v-if="headerKey === '日期'">{{ formatToChineseYearMonth(row[headerKey]) }}</span>
                <span v-else>{{ formatValue(row[headerKey]) }}</span>
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
        <div class="pagination-center" >
          <button 
             class="page-button"
            @click="changePage('other', pagination.other.currentPage - 1)" 
            :disabled="pagination.other.currentPage === 1"
          >
            上一页
          </button>
          <span class="page-info">
            {{ pagination.other.currentPage }} / {{ pagination.other.totalPages }}
          </span>
          <button 
            class="page-button"
            @click="changePage('other', pagination.other.currentPage + 1)" 
            :disabled="pagination.other.currentPage === pagination.other.totalPages"
          >
            下一页
          </button>
        </div>
        <div class="pagination-right"></div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import ChartSpinner from '@/components/common/ChartSpinner.vue';
import { formatToChineseYearMonth } from '@/utils/formatters.js';

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
    formatToChineseYearMonth,
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
      const apiUrl = `${this.apiBase}/export/${type}`;
      const loadingKey = `${type}_dl`;
      let specificFilename = ''; // 用于存储为各种类型定制的文件名
    
      // 获取当前日期用于文件名 (可选)
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0'); // 月份从0开始，所以+1
      const day = String(today.getDate()).padStart(2, '0');
      const dateString = `${year}${month}${day}`; // 例如 "20230529"
    
      // 根据 type 设置不同的文件名
      switch (type) {
        case 'bank':
          specificFilename = `数据资产增信银行贷款清单_${dateString}.pdf`; // 例如: 数据资产增信银行贷款报告_20230529.pdf
          break;
        case 'stock':
          specificFilename = `数据资产作价入股清单_${dateString}.pdf`; // 例如: 数据资产作价入股明细_20230529.pdf
          break;
        case 'other':
          specificFilename = `其他数据类融资清单_${dateString}.pdf`; // 例如: 其他数据类融资情况_20230529.pdf
          break;
        default:
          specificFilename = `导出数据_${dateString}.pdf`;
      }

      try {
        this.loading[loadingKey] = true;

        // 1. 发起 POST 请求，并指明期望的响应类型是 'blob'
        const response = await axios({
          url: apiUrl,
          method: 'POST', // 后端接口是 POST
          responseType: 'blob', // 非常重要：告诉axios期望接收二进制数据
          // 如果你的 POST 接口需要请求体 (body)，可以在这里用 data: {} 传递
          // data: {}
        });

        // 2. 用接收到的二进制数据创建一个 Blob 对象，类型是 PDF
        const blob = new Blob([response.data], { type: 'application/pdf' });

        // 3. 创建一个隐藏的 <a> 标签用于触发下载
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob); // 创建一个指向 Blob 的临时 URL
        link.download = specificFilename; // 设置下载的文件名

        // 4. 将链接添加到页面，模拟点击，然后移除并释放 URL
        document.body.appendChild(link);
        link.click(); // 模拟用户点击下载链接
        document.body.removeChild(link); // 从页面移除该链接
        window.URL.revokeObjectURL(link.href); // 释放之前创建的临时 URL

        if (this.$message) { // 如果使用了 Element UI 等组件库的消息提示
            this.$message.success('文件已开始下载');
        }

      } catch (err) {
        console.error(`导出 ${type} 报告失败:`, err);
        let errorMessage = '导出失败，请稍后重试';
        if (err.response) {
            // 尝试从错误响应中读取服务器返回的JSON错误信息
            // （例如，如果后端PDF生成失败，它会返回一个JSON错误对象）
            try {
                // 后端返回的是blob，所以错误信息也在response.data（blob类型）里，需要转换
                const errorText = await err.response.data.text(); // 将blob转为文本
                const errorData = JSON.parse(errorText); // 尝试解析为JSON
                if (errorData && errorData.error) {
                    errorMessage = errorData.error;
                }
            } catch (e) {
                // 如果解析JSON失败，或者不是预期的错误格式，使用通用错误消息或HTTP状态文本
                errorMessage = `导出失败: ${err.response.statusText || '服务器发生错误'}`;
            }
        }
        // 显示错误消息
        this.$message ? this.$message.error(errorMessage) : alert(errorMessage);
      } finally {
        this.loading[loadingKey] = false; // 结束加载状态
      }
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
.finance-page {
  padding: 0px 30px 20px; /* Top padding reduced due to title block's margin */
  background-color: #f4f7f6;
  min-height: calc(100vh - 50px); /* Assumes 50px is header/nav height */
}

.dashboard-title-block {
  margin: 20px 0 20px; /* Adjusted from original to remove side margins if finance-page handles them */
  padding: 30px;
  background: #f9f9f9;
  overflow-x: hidden; /* Prevents horizontal scroll */
}

.section-divider {
  border: none;
  border-top: 1px dashed #ccc;
  margin: 40px 0;
}

/* ============================================= */
/* Dashboard & Section Titles                    */
/* ============================================= */
.dashboard-title {
  font-size: 24px;
  font-weight: bold;
  color: #003049;
  margin: 0;
}

.section-title {
  font-size: 20px;
  font-weight: 600;
  color: #003049;
  margin: 0;
}

/* ============================================= */
/* Table Section Wrapper                         */
/* ============================================= */
.table-section {
  background-color: white;
  padding: 25px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  margin-bottom: 30px;
  position: relative; /* For potential absolute positioned children like spinners */
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
  min-height: 200px; /* To maintain consistent height during pagination/loading */
}

/* ============================================= */
/* Data Table Styles                             */
/* ============================================= */
.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

/* Table Headers (th) */
.data-table th {
  color: #003049;
  border: 1px solid #e0e0e0; /* Default left/right border */
  font-weight: bold;
  padding: 12px 15px;
  text-align: center; /* Corrected from 'centre' */
  border-top: 2px solid #003049;
  border-bottom: 2px solid #003049;
  white-space: nowrap;
}

/* Table Data Cells (td) */
.data-table td {
  border: 1px solid #e0e0e0;
  padding: 10px 15px;
  text-align: left; /* Default alignment for data cells */
  vertical-align: middle;
}

/* Row Hover Effect */
.data-table tbody tr:hover {
  background-color: #f1f1f1;
}

/* Alternating Row Color (Uncomment if needed) */
/*
.data-table tbody tr:nth-child(even) {
  background-color: #f9f9f9;
}
*/

/* Table Edge Borders & Last Row */
.data-table th:first-child,
.data-table td:first-child {
  /* border-left: none; */ /* May not be needed with border-collapse if table has no outer border */
}

.data-table th:last-child,
.data-table td:last-child {
  /* border-right: none; */ /* May not be needed with border-collapse if table has no outer border */
}

.data-table tr:last-child td { /* Ensures the last data row has a strong bottom border */
  border-bottom: 2px solid #003049;
}

/* --- Column-Specific Table Styles --- */

/* Column 1: "序号" (Serial Number) */
.data-table th:first-child,
.data-table td:first-child {
  text-align: center; /* This rule makes inline styles for '序号' redundant */
  width: 30px;
  min-width: 20px;
}

/* Column 2: General styling (e.g., for month_time or similar ID-like columns) */
.data-table th:nth-child(2),
.data-table td:nth-child(2) {
  width: 90px;
  min-width: 25px;
  text-align: center;
}

/* Bank Table Specific Columns */
#bank-table th:nth-child(5), /* Example: '融资金额（万元）' */
#bank-table td:nth-child(5) {
  text-align: right;
}

/* Stock Table Specific Columns (example: amount fields) */
#stock-table th:nth-child(6),
#stock-table td:nth-child(6),
#stock-table th:nth-child(7),
#stock-table td:nth-child(7),
#stock-table th:nth-child(8),
#stock-table td:nth-child(8) {
  text-align: right;
}

/* Other Table Specific Columns */
#other-table th:nth-child(3) { /* Example: a wider text field */
  min-width: 90px;
}
#other-table td:nth-child(3) { /* Ensure td matches if min-width is for content */
  min-width: 90px;
}

#other-table th:nth-child(8), /* Example: an amount field */
#other-table td:nth-child(8) {
  text-align: right;
}

/* ============================================= */
/* No Data Placeholder                           */
/* ============================================= */
.no-data {
  padding: 30px;
  text-align: center;
  color: #888;
  font-size: 16px;
}

/* ============================================= */
/* Pagination Styles                             */
/* ============================================= */
.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
  flex-wrap: wrap; /* Allows controls to wrap on smaller screens */
}

.pagination-left,
.pagination-right {
  flex: 1; /* Allows these sections to take available space */
  display: flex;
  align-items: center;
}

.pagination-left {
  justify-content: flex-start;
}

.pagination-right {
  justify-content: flex-end; /* Currently empty, but structured for future use */
}

.pagination-center {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px; /* Space between pagination controls */
}

/* Download Button in Pagination */
.download-btn-pagination.el-button { /* Targets the Element UI button */
  background-color: #003049;
  color: white;
  border: none; /* Element UI buttons might have default borders */
  padding: 12px 20px; /* Slightly larger padding */
  border-radius: 5px;
  font-size: 13px;
  /* transition is often handled by Element UI itself, but can be added if needed */
}

.download-btn-pagination.el-button:hover {
  background-color: #f0f0f0; /* Standard hover: light background, dark text */
  color: #003049;
}

/* Page Navigation Buttons (native <button>) */
.page-button {
  background-color: #003049;
  color: white;
  border: none;
  padding: 8px 16px; /* Standard padding */
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s, color 0.3s; /* Explicit transition */
}

.page-button:hover:not(:disabled) { /* Apply hover only if not disabled */
  background-color: #f0f0f0;
  color: #003049;
}

.page-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Page Info Text */
.page-info {
  font-weight: bold;
  color: #003049;
}
</style>
