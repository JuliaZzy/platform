<template>
  <div> <SAIFHeader />

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

    <PdfReport />

    <div class="table-header-container">
      <div class="table-header">
        <i class="fas fa-list"></i> <span>榜单</span>
      </div>
    </div>

    <div class="grid-container">
      <InfoTable
        title="上市公司入表清单"
        :items="listedCompanies"
        :is-loading="isFirstTableLoading"
        item-key="company_name"
      />
      <InfoTable
        title="非上市公司入表清单"
        :items="nonListedCompanies"
        :is-loading="isSecondTableLoading"
        item-key="company_name"
      />
      <InfoTable
        title="数据相关融资企业清单"
        :items="financingCompanies"
        :is-loading="isThirdTableLoading"
        item-key="name"
      />
    </div>

    <PageFooter @open-login="openLoginModal" @open-feedback="openFeedbackModal" />
    <SAIFFooter />
  </div>
  </div>
</template>

<script>
import axios from 'axios';
import { formatToChineseYearMonth } from '@/utils/formatters.js';

// Common Components
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';
import LoginForm from '@/components/common/LoginForm.vue';
// Homepage Specific Components
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
  color: #d9dce7;
  overflow-x: hidden;
}

.status-row {
  display: flex;
  justify-content: space-between;
  margin: -60px 50px 50px 50px;
  flex-wrap: wrap;
  gap: 3%; /* 使用gap来控制间距 */
}
/* 为了让StatusCard能正确应用宽度 */
.status-row > .status-box {
  width: 26%;
}


/* 榜单标题 */
.table-header-container {
  margin: 80px 50px 0 50px;
}
.table-header {
  background: linear-gradient(to right, #2e3968 0%, rgba(0, 48, 73, 0) 30%);
  border-radius: 5px;
  color: white;
  font-size: 24px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: left;
  padding-left: 10px;
  margin-bottom: 20px;
}
.table-header i {
  margin-right: 10px;
  font-size: 20px;
}

/* 表格栅格布局 */
.grid-container {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 120px;
  margin: 50px 50px 0 50px;
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
    color: #2e3968;  /* 鼠标悬停时字体颜色变为深蓝色 */
    text-decoration: underline;
    background-color: transparent !important; /* 确保背景色不会改变 */
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
    color: #2e3968;
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
  background-color: #2e3968;
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


/* 响应式布局 */
@media (max-width: 768px) {
  .status-row {
    flex-direction: column;
    margin-left: 20px;
    margin-right: 20px;
    margin-top: -50px;
    gap: 0;
  }
  .status-row > .status-box {
    width: 100%;
    margin-bottom: 25px;
  }
  .table-header-container {
    margin: 40px 20px 0 20px;
  }
  .grid-container {
    grid-template-columns: 1fr;
    gap: 40px;
    margin: 20px 20px 0 20px;
  }
}
</style>