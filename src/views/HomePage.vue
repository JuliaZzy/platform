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

      <div v-if="isDisclaimerModalVisible" class="disclaimer-modal">
        <div class="disclaimer-modal-content">
          <span class="close-disclaimer" @click="closeDisclaimerModal">×</span>
          <h2>免责声明</h2>
          <ol class="disclaimer-list">
            <li v-for="(item, index) in disclaimerItems" :key="index">{{ item }}</li>
          </ol>
        </div>
      </div>

      <div class="main-content">
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

        <h2 class="section-title">往期报告下载</h2>
        <div class="pdf-report-wrapper">
          <PdfReport />
        </div>

        <h2 class="section-title">企业名单</h2>
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

      <PageFooter 
        @open-login="openLoginModal" 
        @open-feedback="openFeedbackModal"
        @open-disclaimer="openDisclaimerModal"
      />
      <SAIFFooter />
    </div>
  </div>
</template>

<script>
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
      isDisclaimerModalVisible: false,
      // 新增：免责声明内容数组
      disclaimerItems: [
        '1. 本数据库提供的所有数据均来源于公开渠道，包括但不限于政府部门、国际组织、学术研究等。数据库运营方力求确保数据的准确性与及时性，但不对任何数据来源的完整性、准确性或时效性作明示或默示的担保。',
        '2. 本数据库提供的数据可能因统计方法修订、源数据调整或延迟更新而产生差异。数据库运营方保留在不另行通知的情况下修改、删除或补充数据的权利，且不承担因数据滞后、误差或遗漏导致的直接或间接责任。',
        '3. 本数据库内容仅供学术研究、市场分析或一般参考用途，不构成任何投资形式的投资建议。',
        '4. 本数据库运营方及其关联方不对因数据使用导致的任何损失（包括但不限于直接、间接、附带或衍生损失）承担责任。使用方在使用本数据库数据时，应遵守适用的法律法规、行业规范和道德准则。',
        '5. 用户使用本数据库即视为同意本免责声明，并承诺遵守相关法律法规。'
      ],
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

    // 免责声明弹窗
    openDisclaimerModal() {
      this.isDisclaimerModalVisible = true;
    },
    closeDisclaimerModal() {
      this.isDisclaimerModalVisible = false;
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
  color: #333;
  overflow-x: hidden;
}

.pdf-report-wrapper {
  margin-left: 14px;
  margin-bottom: 60px; 
}

.main-content {
  width: 70%;
  margin: 0 auto;
}

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
  width: 30%;
}

.grid-container {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 50px;
  margin: 0 0 60px 0;
}

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

.chart-spinner-container {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 10;
  pointer-events: none;
}

/* 免责声明 */
.disclaimer-modal {
  display: flex;
  justify-content: center;
  align-items: center;
  position: fixed;
  top: -90px;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0,0,0,0.5);
  z-index: 1000;
}

.disclaimer-modal-content {
  font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", "Helvetica Neue", Helvetica, Arial, "Hiragino Sans GB", "Heiti SC", "WenQuanYi Micro Hei", sans-serif;
  background-color: white;
  color: #000;
  padding: 30px 40px;
  width: 70%;
  max-width: 800px;
  border-radius: 8px;
  position: relative;
  line-height: 1.7;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
}

.disclaimer-modal-content h2 {
  color: #004B87;
  border-bottom: 2px solid #eee;
  padding-bottom: 10px;
  margin-top: 0;
  margin-bottom: 20px;
  font-size: 24px;
  font-weight: bold;
}

.disclaimer-modal-content .disclaimer-list {
  overflow-y: auto;
  flex-grow: 1;
  margin: 0;
  padding-left: 25px;
}

.disclaimer-modal-content .disclaimer-list li {
  margin-bottom: 15px;
  padding-left: 0.8em;
  text-indent: -1.1em;
}
.disclaimer-modal-content .disclaimer-list li:last-child {
  margin-bottom: 0;
}

.close-disclaimer {
  position: absolute;
  right: 25px;
  top: 15px;
  font-size: 28px;
  font-weight: bold;
  color: #000;
  cursor: pointer;
  transition: color 0.2s;
}
.close-disclaimer:hover {
  color: #000;
}

/* 响应式布局 */
@media (max-width: 992px) {
  .main-content {
    width: 85%;
  }
}

@media (max-width: 768px) {
  .main-content {
    width: 95%;
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

  .disclaimer-modal-content {
    width: 90%;
    padding: 20px;
  }
  .disclaimer-modal-content h2 {
    font-size: 20px;
  }
  .disclaimer-list {
    font-size: 14px;
  }
}
</style>