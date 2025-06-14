<template>
  <div>
    <SAIFHeader />

    <div class="page-container">
      <LoadingSpinner :visible="isLoading" />
      <PageHeader />

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

      <!-- 【修改】新增主内容容器，实现70%居中布局 -->
      <div class="main-content">
        <!-- 1. 数据概览区域 -->
        <h2 class="section-title">数据资产入表情况概览</h2>
        <div class="status-row">
          <StatusCard
            :date-text="listedDateDisplay"
            title="上市公司入表"
            :count="listedCompanyCount"
            @card-click="handleStatusBoxClick('上市公司入表')"
          />
          <StatusCard
            :date-text="nonListedMonthDisplay"
            title="非上市公司入表"
            :count="nonListedCompanyCount"
            @card-click="handleStatusBoxClick('非上市公司入表')"
          />
          <StatusCard
            date-text="截至2025年03月"
            title="数据相关融资"
            :count="financeCompanyCount"
            unit="项"
            @card-click="handleStatusBoxClick('数据相关融资')"
          />
        </div>

        <!-- 2. 报告下载区域 -->
        <h2 class="section-title">往期报告下载</h2>
        <PdfReport />

        <!-- 3. 榜单区域 -->
        <h2 class="section-title">融资榜单</h2>
        <div class="grid-container">
          <InfoTable
            :items="listedCompanies"
            :is-loading="isFirstTableLoading"
            item-key="company_name"
          />
          <InfoTable
            :items="nonListedCompanies"
            :is-loading="isSecondTableLoading"
            item-key="company_name"
          />
          <InfoTable
            :items="financingCompanies"
            :is-loading="isThirdTableLoading"
            item-key="name"
          />
        </div>
      </div>

      <PageFooter @open-login="openLoginModal" @open-feedback="openFeedbackModal" />
      <SAIFFooter />
    </div>
  </div>
</template>

<script>
//脚本部分与您原有的保持一致，无需修改
import axios from 'axios';
import { formatToChineseYearMonth } from '@/utils/formatters.js';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';
import LoginForm from '@/components/common/LoginForm.vue';
import SAIFHeader from '@/components/homepage/SAIFHeader.vue';
import SAIFFooter from '@/components/homepage/SAIFFooter.vue';
import PageHeader from '@/components/homepage/PageHeader.vue';
import StatusCard from '@/components/homepage/StatusCard.vue';
import PdfReport from '@/components/homepage/PdfReport.vue';
import InfoTable from '@/components/homepage/InfoTable.vue';
import PageFooter from '@/components/homepage/PageFooter.vue';

export default {
  name: 'HomePage',
  components: {
    LoadingSpinner,
    LoginForm,
    SAIFHeader,
    SAIFFooter,
    PageHeader,
    StatusCard,
    PdfReport,
    InfoTable,
    PageFooter
  },
  data() {
    return {
      isLoading: true,
      isFirstTableLoading: false,
      isSecondTableLoading: false,
      isThirdTableLoading: false,
      latestListedDate: '',
      latestNonListedMonth: '',
      listedCompanyCount: 0,
      nonListedCompanyCount: 0,
      financeCompanyCount: 0,
      listedCompanies: [],
      nonListedCompanies: [],
      financingCompanies: [],
      isLoginModalVisible: false,
      isFeedbackModalVisible: false,
      feedbackForm: {
        name: '',
        contact: '',
        organization: '',
        details: ''
      }
    };
  },
  computed: {
    listedDateDisplay() {
      if (this.latestListedDate) {
        return `截至${this.latestListedDate}`;
      }
      return '截至....';
    },
    nonListedMonthDisplay() {
      if (!this.latestNonListedMonth) {
        return '截至....年..月';
      }
      const formattedMonth = formatToChineseYearMonth(this.latestNonListedMonth);
      return `截至${formattedMonth}`;
    }
  },
  mounted() {
    this.loadAllData();
  },
  methods: {
    async loadAllData() {
      this.isLoading = true;
      this.isFirstTableLoading = true;
      this.isSecondTableLoading = true;
      this.isThirdTableLoading = true;
      try {
        const res = await axios.get('/api/company/homepage-summary');
        const data = res.data;
        this.latestListedDate = data.latestListedDate;
        this.listedCompanyCount = data.listedCompanyCount;
        this.listedCompanies = data.listedCompanies || [];
        this.nonListedCompanyCount = data.nonListedCompanyCount;
        this.nonListedCompanies = data.nonListedCompanies || [];
        this.latestNonListedMonth = data.latestNonListedMonth;
        this.financeCompanyCount = data.financeCompanyCount;
        this.financingCompanies = data.financingCompanies || [];
      } catch (err) {
        console.error('加载数据出错：', err);
      } finally {
        this.isLoading = false;
        this.isFirstTableLoading = false;
        this.isSecondTableLoading = false;
        this.isThirdTableLoading = false;
      }
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
      let routeName = '';
      if (label === '上市公司入表') routeName = 'LSDashboardPage';
      else if (label === '非上市公司入表') routeName = 'NLSDashboardPage';
      else if (label === '数据相关融资') routeName = 'FinanceDashboardPage';
      
      if(routeName) {
        const routeData = this.$router.resolve({ name: routeName });
        window.open(routeData.href, '_blank');
      }
    },
    openFeedbackModal() {
      this.isFeedbackModalVisible = true;
    },
    closeFeedbackModal() {
      this.isFeedbackModalVisible = false;
      this.feedbackForm = { name: '', contact: '', organization: '', details: '' };
    },
    async submitFeedback() {
      if (!this.feedbackForm.name || !this.feedbackForm.contact || !this.feedbackForm.details) {
        alert('请填写所有必填项（姓名、联系方式、反馈事项）。');
        return;
      }
      try {
        await axios.post('/api/feedback', this.feedbackForm);
        alert('反馈提交成功！感谢您的参与。');
        this.closeFeedbackModal();
      } catch (error) {
        console.error('提交反馈失败:', error);
        const errorMessage = error.response?.data?.error || '反馈提交失败，请稍后再试。';
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
  padding: 0;
  background-color: #F5F3F4;
  color: #333; /* 修改了默认文字颜色，使其更易读 */
  overflow-x: hidden;
}

/* 【新增】主内容容器 */
.main-content {
  width: 70%;
  margin: 0 auto; /* 水平居中 */
}

/* 【新增】统一的蓝色区域大标题 */
.section-title {
  font-size: 20px;
  color: #171d8f;
  font-weight: 500;
  margin: 60px 0 25px 0;
  text-align: left;
  padding-left: 10px;
  border-left: 4px solid #171d8f;
}

.status-row {
  display: flex;
  justify-content: space-between;
  margin: 30px 0 0 0;
  flex-wrap: wrap;
}
.status-row > :deep(.status-box) {
  width: 30%; /* 每个卡片占据大约三分之一的宽度，剩余空间由 justify-content 分配 */
}

/* 【修改】调整表格栅格布局的边距 */
.grid-container {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 50px; /* 减小了表格之间的间距 */
  margin: 0 0 60px 0; /* 移除了左右边距，增加了底部边距 */
}

/* 弹窗样式保持不变 */
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
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  padding: 20px;
  width: 500px;
  max-width: 90%;
  height: 450px;
  max-height: 80%;
  overflow-y: auto;
  position: relative;
}
.login-close-button {
  background-color: transparent;
  color: #555555;
  font-size: 16px;
  border: none;
  cursor: pointer;
  position: absolute;
  bottom: 20px;
  right: 20px;
  padding: 0;
  text-decoration: none;
  letter-spacing: 2px;
}
.login-close-button:hover {
  color: #172787;
  text-decoration: underline;
  background-color: transparent !important;
}

/* 反馈弹窗样式保持不变 */
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
  z-index: 1000;
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
  color: #172787;
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
  box-sizing: border-box;
}
.feedback-form textarea {
  resize: vertical;
}
.feedback-form .form-buttons {
  margin-top: 30px;
  display: flex;
  justify-content: flex-end;
  gap: 15px;
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
  background-color: #172787;
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

/* 加载动画样式保持不变 */
.chart-spinner-container {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 10;
  pointer-events: none;
}

/* 【修改】响应式布局 */
@media (max-width: 992px) {
  /* 在中等屏幕上，稍微增加内容宽度 */
  .main-content {
    width: 85%;
  }
}

@media (max-width: 768px) {
  /* 在小屏幕上，内容区几乎占满 */
  .main-content {
    width: 90%;
  }
  .section-title {
    font-size: 22px;
    margin-top: 40px;
  }
  .status-row {
    flex-direction: column;
    margin-top: 20px;
    gap: 10px;
    align-items: center;
  }
  .status-row > :deep(.status-box) {
    width: 95%;
    margin-bottom: 25px;
  }
  .grid-container {
    grid-template-columns: 1fr;
    gap: 40px;
  }
}
</style>