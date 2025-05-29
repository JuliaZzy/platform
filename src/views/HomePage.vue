<template>
  <div class="page-container">
    <LoadingSpinner :visible="isLoading" />

    <div class="header">
      <img src="../assets/header_image.jpg" alt="Header Image" />
      <div class="header-content">
        <div class="left">
          <h1>中国企业数据资产<br />入表跟踪</h1>
          <p>Discover the Power of <br />Partnership for Sustainable Water Solutions</p>
        </div>
      </div>
    </div>

    <div class="admin">
      <button class="admin-login-button" @click="openLoginModal">管理员登录</button>
    </div>

    <div v-if="isLoginModalVisible" class="login-modal">
      <div class="modal-content">
        <LoginForm @login-success="handleLoginSuccess" />
        <button class="login-close-button" @click="closeLoginModal">关闭</button>
      </div>
    </div>

    <div v-if="isFeedbackModalVisible" class="feedback-modal">
      <div class="feedback-modal-content">
        <h2>反馈意见 / 信息申报</h2>
        <form @submit.prevent="submitFeedback" class="feedback-form">
          <div class="form-group">
            <label for="name">您的姓名：</label>
            <input type="text" id="name" v-model="feedbackForm.name" required />
          </div>
          <div class="form-group">
            <label for="contact">您的联系方式：</label>
            <input type="text" id="contact" v-model="feedbackForm.contact" required />
          </div>
          <div class="form-group">
            <label for="organization">您的单位：</label>
            <input type="text" id="organization" v-model="feedbackForm.organization" />
          </div>
          <div class="form-group">
            <label for="details">反馈/申报事项：</label>
            <textarea id="details" v-model="feedbackForm.details" rows="6" required></textarea>
          </div>
          <div class="form-buttons">
            <button type="submit" class="submit-button">提交</button>
            <button type="button" class="close-button" @click="closeFeedbackModal">关闭</button>
          </div>
        </form>
      </div>
    </div>

    <div class="status-row">
      <div class="status-box clickable" @click="handleStatusBoxClick('上市公司入表')">
        <h3>2024年度</h3>
        <p class="status-title">上市公司入表</p>
        <p class="status-number">
          {{ listedCompanyCount }} 家
        </p>
        <div class="status-note">点击查看详情</div>
      </div>

      <div class="status-box clickable" @click="handleStatusBoxClick('非上市公司入表')">
        <h3>{{ nonListedMonthDisplay }}</h3>
        <p class="status-title">非上市公司入表</p>
        <p class="status-number">
          {{ nonListedCompanyCount }} 家
        </p>
        <div class="status-note">点击查看详情</div>
      </div>

      <div class="status-box clickable" @click="handleStatusBoxClick('数据相关融资')">
        <h3>截至2025年03月</h3>
        <p class="status-title">数据相关融资</p>
        <p class="status-number">
          {{ financeCompanyCount }} 项
        </p>
        <div class="status-note">点击查看详情</div>
        </div>
    </div>

    <div class="table-header-container">
      <div class="table-header">
        <i class="fas fa-list"></i> <span>榜单</span>
      </div>
    </div>

    <div class="grid-container">
      <div class="grid-item">
        <div class="table-wrapper">
          <ChartSpinner :visible="isFirstTableLoading" />
          <table>
            <tr><th colspan="2">上市公司入表清单</th></tr>
            <tr v-for="(company, index) in pagedListedCompanies" :key="index">
              <td v-text="company.company_name"></td>
            </tr>
            <tr v-if="firstTablePages > 1">
              <td colspan="2">
                <div class="pagination">
                  <button :disabled="firstTablePage === 1" @click="changePage('firstTable', firstTablePage - 1)">上一页</button>
                  <span>{{ firstTablePage }} / {{ firstTablePages }}</span>
                  <button :disabled="firstTablePage === firstTablePages" @click="changePage('firstTable', firstTablePage + 1)">下一页</button>
                </div>
              </td>
            </tr>
          </table>
        </div>
      </div>

      <div class="grid-item">
        <div class="table-wrapper">
          <ChartSpinner :visible="isSecondTableLoading" />
          <table>
            <tr><th colspan="2">非上市公司入表清单</th></tr>
            <tr v-for="(company, index) in pagedNonListedCompanies" :key="index">
              <td v-text="company.company_name"></td>
            </tr>
            <tr v-if="secondTablePages > 1">
              <td colspan="2">
                <div class="pagination">
                  <button :disabled="secondTablePage === 1" @click="changePage('secondTable', secondTablePage - 1)">上一页</button>
                  <span>{{ secondTablePage }} / {{ secondTablePages }}</span>
                  <button :disabled="secondTablePage === secondTablePages" @click="changePage('secondTable', secondTablePage + 1)">下一页</button>
                </div>
              </td>
            </tr>
          </table>
        </div>
      </div>

      <div class="grid-item">
        <div class="table-wrapper">
          <ChartSpinner :visible="isThirdTableLoading" />
          <table>
            <tr><th colspan="2">数据相关融资企业清单</th></tr>
            <tr v-for="(company, index) in pagedFinancingCompanies" :key="index">
              <td>{{ company.name }}</td> </tr>
            <tr v-if="thirdTablePages > 1">
              <td colspan="2">
                <div class="pagination">
                  <button :disabled="thirdTablePage === 1" @click="changePage('thirdTable', thirdTablePage - 1)">上一页</button>
                  <span>{{ thirdTablePage }} / {{ thirdTablePages }}</span>
                  <button :disabled="thirdTablePage === thirdTablePages" @click="changePage('thirdTable', thirdTablePage + 1)">下一页</button>
                </div>
              </td>
            </tr>
          </table>
        </div>
      </div>
    </div>

    <div class="footer">
      <div class="footer-overlay"></div>
      <img class="footer-bg" src="@/assets/footer_image.jpg" alt="Footer Image" />
      <div class="footer-content"> <div class="footer-links">
          <p>联系我们：wpan@saif.sjtu.edu.cn</p>
          <a href="#" @click.prevent="openFeedbackModal">反馈意见/申报</a>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import LoginForm from '@/components/common/LoginForm.vue';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';
import ChartSpinner from '@/components/common/ChartSpinner.vue';
import { formatToChineseYearMonth } from '@/utils/formatters.js';

export default {
  name: 'HomePage', // 建议使用多词名称
  components: {
    LoginForm,
    LoadingSpinner,
    ChartSpinner
  },
  data() {
    return {
      isLoading: true,
      isFirstTableLoading: false, // 改为 false，让主 loading 控制
      isSecondTableLoading: false,
      isThirdTableLoading: false,
      // currentMonth: '', // 移除，不再需要
      latestNonListedMonth: '', // 新增：存储非上市公司最新月份
      labels: ['上市公司入表', '非上市公司入表', '数据相关融资'], // 修改第三个标签
      listedCompanyCount: 0,
      nonListedCompanyCount: 0,
      financeCompanyCount: 0,

      listedCompanies: [],
      firstTablePage: 1,
      firstTablePages: 1,

      nonListedCompanies: [],
      secondTablePage: 1,
      secondTablePages: 1,

      financingCompanies: [],
      thirdTablePage: 1,
      thirdTablePages: 1,

      isLoginModalVisible: false,
      isFeedbackModalVisible: false, // 新增：控制反馈弹窗
      feedbackForm: { // 新增：存储反馈表单数据
        name: '',
        contact: '',
        organization: '',
        details: ''
      }
    };
  },
  computed: {
    pagedListedCompanies() {
      const list = this.listedCompanies || [];
      const start = (this.firstTablePage - 1) * 10;
      return list.slice(start, start + 10);
    },
    pagedNonListedCompanies() {
      const list = this.nonListedCompanies || [];
      const start = (this.secondTablePage - 1) * 10;
      return list.slice(start, start + 10);
    },
    pagedFinancingCompanies() {
      const list = this.financingCompanies || [];
      const start = (this.thirdTablePage - 1) * 10;
      return list.slice(start, start + 10);
    },
    nonListedMonthDisplay() {
      if (!this.latestNonListedMonth) {
        return '截至....年..月'; // 如果没有数据，显示占位符
      }
      // ✅ 使用 formatToChineseYearMonth 函数进行格式化
      const formattedMonth = formatToChineseYearMonth(this.latestNonListedMonth);
      return `截至${formattedMonth}`; 
    }
  },
  mounted() {
    // 移除 currentMonth 的设置
    this.loadAllData();
  },
  methods: {
    async loadAllData() {
      this.isLoading = true;
      // 可以在这里设置表格 loading 为 true
      this.isFirstTableLoading = true;
      this.isSecondTableLoading = true;
      this.isThirdTableLoading = true;
      try {
        const res = await axios.get('/api/company/homepage-summary');
        const data = res.data;
        this.listedCompanyCount = data.listedCompanyCount;
        this.listedCompanies = data.listedCompanies || [];
        this.firstTablePages = Math.ceil(data.listedCompanyCount / 10);

        this.nonListedCompanyCount = data.nonListedCompanyCount;
        this.nonListedCompanies = data.nonListedCompanies || [];
        this.secondTablePages = Math.ceil(data.nonListedCompanyCount / 10);
        this.latestNonListedMonth = data.latestNonListedMonth; // 接收后端传来的最新月份

        this.financeCompanyCount = data.financeCompanyCount;
        this.financingCompanies = data.financingCompanies || [];
        this.thirdTablePages = Math.ceil(this.financingCompanies.length / 10); 

      } catch (err) {
        console.error('加载数据出错：', err);
        // 可以添加用户友好的错误提示
      } finally {
        this.isLoading = false;
        // 关闭表格 loading
        this.isFirstTableLoading = false;
        this.isSecondTableLoading = false;
        this.isThirdTableLoading = false;
      }
    },
    changePage(table, page) {
      if (page < 1 || page > this[`${table}Pages`]) return;
      this[`${table}Page`] = page;
      // 注意：这里是前端分页，如果数据量很大，未来可能需要改为后端分页
    },
    openLoginModal() {
      this.isLoginModalVisible = true;
    },
    closeLoginModal() {
      this.isLoginModalVisible = false;
    },
    handleLoginSuccess() {
      this.closeLoginModal();
      const routeData = this.$router.resolve({ name: 'AdminPage' });
      window.open(routeData.href, '_blank');
    },
    handleStatusBoxClick(label) {
      let routeData;
      if (label === '非上市公司入表') {
        routeData = this.$router.resolve({ name: 'NLSDashboardPage' });
        window.open(routeData.href, '_blank');
      } else if (label === '上市公司入表') {
        routeData = this.$router.resolve({ name: 'LSDashboardPage' });
        window.open(routeData.href, '_blank');
      } else if (label === '数据相关融资') { 
        // ⚠️ 请确保 'FinanceDashboardPage' 是您在路由中定义的正确名称
        routeData = this.$router.resolve({ name: 'FinanceDashboardPage' });
        window.open(routeData.href, '_blank');
      }
    },
    // --- 新增方法 ---
    openFeedbackModal() {
      this.isFeedbackModalVisible = true;
    },
    closeFeedbackModal() {
      this.isFeedbackModalVisible = false;
      // 可以选择性地清空表单
      this.feedbackForm = { name: '', contact: '', organization: '', details: '' };
    },
    async submitFeedback() {
      console.log('提交反馈:', this.feedbackForm);
      
      // 简单的前端验证 (可选，但推荐)
      if (!this.feedbackForm.name || !this.feedbackForm.contact || !this.feedbackForm.details) {
          alert('请填写所有必填项（姓名、联系方式、反馈事项）。');
          return;
      }

      try {
        // 调用后端 API 发送反馈
        await axios.post('/api/feedback', this.feedbackForm);
        // 根据后端返回结果提示用户
        alert('反馈提交成功！感谢您的参与。'); 
        this.closeFeedbackModal(); // 提交成功后关闭弹窗
      } catch (error) {
        console.error('提交反馈失败:', error);
        // 显示更具体的错误信息 (如果后端返回了)
        const errorMessage = error.response?.data?.error || '反馈提交失败，请稍后再试或联系管理员。';
        alert(errorMessage); 
      }
    }
  }
};
</script>


<style scoped>
  .page-container {
    font-family: 'Arial', sans-serif;
    margin: 0;
    padding: 0; /* 去掉整体的上下左右间隙 */
    background-color: #F5F3F4; /* 浅灰色背景 */
    color: #333;
    overflow-x: hidden; /* 彻底移除横向滚动条 */
  }

  .header {
    background-color: rgba(0, 41, 82, 0.85);
    position: relative;
    width: 100%; /* 确保背景铺满整个屏幕 */
    min-height: 500px; /* 设置最小高度，确保内容不被压缩 */
    padding: 50px 30px;
    text-align: left;
    color: white;
    font-size: 36px;
    letter-spacing: 8px;
    box-sizing: border-box;
  }

  .header img {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%; /* 设置图片填充整个header */
    object-fit: cover;
    opacity: 0.2; /* 设置透明度，让文字更清晰 */
  }

  .header-content {
    position: relative;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    padding-left: 150px;
    top: 10px;
    height: 100%;
  }

  .header-content .left {
    border-left: 5px solid white;
    padding-left: 30px;
    margin-right: 30px;
    line-height: 55px;
  }

  .header-content .left h1 {
    font-size: 76px; /* 中文稍大 */
    letter-spacing: 16px;
    margin: 0;
    line-height: 1.3;
  }

  .header-content .left p {
    font-size: 32px; /* 英文稍小 */
    letter-spacing: 3px;
    margin: 10px 0 0;
  }

  /* 主界面 "管理员登录" 按钮的样式 */
  .admin, .admin:visited, .admin:active {
    position: absolute;
    right: 30px;
    top: 40px;
    text-decoration: none;
    color: #003049; /* 字体颜色为 header 的深蓝色 */
    font-size: 16px;
    padding: 6px 14px;
    z-index: 2;
  }

  .admin-login-button {
    background-color: #003049;  /* 深蓝色背景 */
    color: white;
    padding: 10px 20px;  /* 增大按钮的内边距 */
    border: none;
    border-radius: 8px;  /* 圆角效果 */
    font-size: 18px;      /* 设置字体大小 */
    cursor: pointer;
    transition: background-color 0.2s ease, color 0.2s ease; /* 增加过渡效果 */
  }

  .admin-login-button:hover {
    background-color: white;  /* 鼠标悬停时背景色变为白色 */
    color: #003049;           /* 鼠标悬停时字体颜色变为深蓝色 */
  }

  /* 弹窗样式 */
  .login-modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 999;
  }

  .modal-content {
    background-color: white;  /* 弹窗内容的背景 */
    border-radius: 10px;      /* 圆角 */
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); /* 阴影 */
    padding: 20px 20px 20px 20px;     /* 增加内边距 */
    width: 500px;             /* 弹窗宽度 */
    max-width: 90%;           /* 最大宽度设置为屏幕宽度的90% */
    height: 450px;             /* 根据内容自适应高度 */
    max-height: 80%;          /* 限制最大高度为屏幕高度的80% */
    overflow-y: auto;         /* 超出部分允许滚动 */
    position: relative;       /* 使按钮能够绝对定位 */
  }

  .login-close-button {
    background-color: transparent;  /* 背景透明 */
    color: #555555;  /* 深灰色字体 */
    font-size: 16px;  /* 设置字体大小 */
    border: none;  /* 去掉边框 */
    cursor: pointer;
    position: absolute;  /* 使用绝对定位 */
    bottom: 20px;  /* 距离底部 20px */
    right: 20px;   /* 距离右侧 20px */
    padding: 0;    /* 去除内边距 */
    text-decoration: none;  /* 移除文本下划线 */
    letter-spacing: 2px;  /* 增加字间距 */
  }

  .login-close-button:hover {
    color: #003049;  /* 鼠标悬停时字体颜色变为深蓝色 */
    text-decoration: underline;
    background-color: transparent !important; /* 确保背景色不会改变 */
  }

  .status-row {
    display: flex;
    justify-content: space-between;
    margin-top: -60px; /* 让 status-box 与 header 上方重叠 */
    margin-bottom: 50px;
    flex-wrap: wrap; /* 确保响应式布局 */
    margin-left: 50px; /* 左侧距离 30px */
    margin-right: 50px; /* 右侧距离 30px */
  }

  .status-box {
    background-color: white; /* 背景为白色 */
    width: 26%;
    padding: 30px 20px; /* 内边距 */
    text-align: center;
    font-size: 32px;
    color: #003049; /* 深蓝色文字 */
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1); /* 阴影效果增强 */
    position: relative;
    z-index: 1;
    border-radius: 10px; /* 边框圆角 */
    transition: all 0.2s ease; /* 添加平滑过渡效果 */
    min-height: 240px;
  }

  .status-box:hover {
    transform: scale(1.03); /* 鼠标悬停时放大至原有的110% */
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.2); /* 鼠标悬停时阴影更强 */
  }

  .status-box h3 {
    margin: 0;
    font-size: 20px; /* 标题的字体大小 */
    text-align: left;
    color: #003049; /* 深蓝色标题 */
    font-weight: bold; /* 突出标题 */
    margin-bottom: 10px; /* 让标题稍微向上移动 */
    text-transform: uppercase; /* 标题大写，增加视觉冲击力 */
  }

  .status-box p span.number {
    font-size: 36px; /* 数字字体更大 */
    font-weight: bold; /* 数字加粗 */
  }

  .status-box p span.unit {
    font-size: 30px; /* “家”字不加粗，字体稍小 */
    font-weight: normal; /* “家”字不加粗 */
  }

  .status-title {
    font-size: 30px;
    font-weight: normal;
    margin: 0;
    margin-top: 40px;
    color: #003049;
  }

  .status-number {
    font-size: 48px;
    font-weight: bold;
    margin: 10px 0 0;
    color: #003049;
  }

  .status-note {
    font-size: 14px;
    color: #003049;
    text-align: right;
    margin-top: 50px;
    text-transform: none;
    font-weight: normal;
  }

  /*点击样式*/ 
  .status-box.clickable {
    cursor: pointer;
  }
  .status-box.clickable:hover {
    transform: scale(1.05);
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.2);
  }

  /* 新增：独立设置榜单背景和高度 */
  .table-header-container {
    margin: 0 50px; /* 左右留白 50px */
    margin-top: 80px;
  }

  .table-header {
    background: linear-gradient(to right, #003049 0%, rgba(0, 48, 73, 0) 30%); /* 深蓝色背景 */
    border-radius: 5px;
    color: white;
    font-size: 24px;
    height: 50px; /* 高度 50px */
    display: flex;
    align-items: center;
    justify-content: left;
    padding-left: 10px;
    margin-bottom: 20px; /* 榜单与下方表格间的间距 */
  }

  .table-header i {
    margin-right: 10px;
    font-size: 20px;
  }

  .grid-container {
    display: grid;
    grid-template-columns: repeat(3, 1fr); /* 三个表格宽度保持一致 */
    gap: 120px;
    margin-top: 50px; /* 表格与 status box 底部的间距 80px */
    width: 93%; /* 修改为与 status-box 宽度一致 */
    margin-left: 50px;
    margin-right: 50px;
  }

  .grid-item {
    position: relative; /* ✅ 这行你已经加了 */
    min-height: 160px;  /* ✅ 建议添加：确保 spinner 有空间显示 */
  }

  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 16px;
  }

  .grid-container .grid-item:first-child table td {
    text-align: center;
  }

  th {
    color: #003049;
    font-weight: bold;
    padding: 14px;
    text-align: center;
    border-top: 2px solid #003049;
    border-bottom: 2px solid #003049;
  }

  td {
    padding: 8px;
    color: #333;
    border-bottom: 1px solid #d3d3d3;
  }

  tr:last-child td {
    border-bottom: 2px solid #003049;
  }

  .pagination {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 15px;
  }

  .pagination-left,
  .pagination-center,
  .pagination-right {
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .pagination-left {
    justify-content: flex-start;
  }

  .pagination-right {
    justify-content: flex-end;
  }

  .pagination button {
    background-color: #F5F3F4;
    color: #003049;
    border: none;
    padding: 8px 16px;
    border-radius: 5px;
    cursor: pointer;
    transition: 0.2s;
  }

  .pagination button:disabled {
    background-color: #ccc;
    color: #666;
    cursor: not-allowed;
  }

  .pagination button:hover:not(:disabled) {
    background-color: #003049;
    color: white;
  }

  .page-info {
    font-size: 16px;
    color: #003049;
  }

  .footer {
    position: relative;
    height: 150px;
    overflow: hidden;
    color: white;
    margin-top: 60px;
  }

  .footer a {
    color: white;
    font-size: 18px;
    text-decoration: none;
    transition: border-bottom 0.2s;
    border-bottom: 2px solid transparent;
  }

  .footer a:hover {
    border-bottom: 2px solid white;
  }

  .footer-bg {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    z-index: 1;
    object-position: bottom;

  }

  .footer-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 48, 73, 0.5); /* 深蓝色透明层 */
    z-index: 2;
  }

  .footer-content {
    position: relative;
    z-index: 3;
    height: 100%;
    display: flex;
    justify-content: flex-end;
    align-items: center;
    padding-right: 50px;
    gap: 30px;
  }
  .table-wrapper {
    position: relative;
    min-height: 180px;
  }

  .footer-content {
  position: relative;
  z-index: 3;
  height: 100%;
  display: flex;
  justify-content: flex-end; /* 整体靠右 */
  align-items: center;
  padding-right: 50px;
}

.footer-links {
  text-align: left; /* 内部左对齐 */
}

.footer-links p {
  margin: 5px 0; /* 上下间距 */
  color: white;
  font-size: 16px; /* 调整字体大小 */
}

.footer-links a {
  color: white;
  font-size: 16px; /* 调整字体大小 */
  text-decoration: none;
  transition: border-bottom 0.2s;
  border-bottom: 1px solid transparent; /* 默认无下划线 */
  display: inline-block; /* 允许设置 margin */
  margin: 5px 0;
  cursor: pointer; /* 显示可点击手势 */
}

.footer-links a:hover {
  border-bottom: 1px solid white; /* 悬停时显示下划线 */
}

/* --- 反馈弹窗样式 (基本样式，你可以根据需要调整) --- */
.feedback-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000; /* 比登录弹窗更高 */
}

.feedback-modal-content {
  background-color: white;
  padding: 30px 40px;
  border-radius: 10px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  width: 600px;
  max-width: 90%;
  box-sizing: border-box;
}

.feedback-modal-content h2 {
    text-align: center;
    color: #003049;
    margin-top: 0;
    margin-bottom: 30px;
}

.feedback-form .form-group {
  margin-bottom: 20px;
}

.feedback-form label {
  display: block;
  margin-bottom: 8px;
  color: #333;
  font-weight: bold;
}

.feedback-form input[type="text"],
.feedback-form textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 5px;
  font-size: 16px;
  box-sizing: border-box; /* 确保 padding 不会增加宽度 */
}

.feedback-form textarea {
  resize: vertical; /* 允许垂直调整大小 */
}

.feedback-form .form-buttons {
  margin-top: 30px;
  display: flex;
  justify-content: flex-end; /* 按钮靠右 */
  gap: 15px; /* 按钮间距 */
}

.feedback-form button {
  padding: 10px 25px;
  border: none;
  border-radius: 5px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.feedback-form .submit-button {
  background-color: #003049;
  color: white;
}
.feedback-form .submit-button:hover {
  background-color: #005f73;
}

.feedback-form .close-button {
  background-color: #ccc;
  color: #333;
}
.feedback-form .close-button:hover {
  background-color: #b3b3b3;
}

  .chart-spinner-container {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 10;
    pointer-events: none;
  }

</style>
