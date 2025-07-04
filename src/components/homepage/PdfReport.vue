<template>
  <div class="pdf-list-container">
    <div v-if="isLoading" class="loading-message">正在加载...</div>
    <div v-else-if="error" class="error-message">{{ error }}</div>
    <ul v-else-if="reports.length > 0" class="pdf-list">
      <li v-for="report in reports" :key="report.id">
        <a :href="getDownloadUrl(report.id)" target="_blank" class="file-link" @click="trackDownload(report)">
        <!-- <a href="#" class="file-link" @click.prevent="showUpdateMessage(report)"> -->
        <i class="fas fa-file-pdf"></i>
          <span class="file-name">{{ report.name }}</span>
          </a>
      </li>
    </ul>
    <div v-else class="no-files">暂无最新报告。</div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'PdfReport',
  data() {
    return {
      reports: [],
      isLoading: false,
      error: null,
    };
  },
  methods: {
    /*
    showUpdateMessage() {
      // 如果您的项目使用了 Element UI / Element Plus, 请使用下面这行
      this.$message.info('报告更新中，请稍后');
    },
    */
    
    async fetchReports() {
      this.isLoading = true;
      this.error = null;
      try {
        const response = await axios.get(`${process.env.VUE_APP_API_URL}/api/reports`);
        this.reports = response.data;
      } catch (err) {
        console.error('Failed to fetch reports for homepage:', err);
        this.error = '无法加载报告列表，请稍后再试。';
      } finally {
        this.isLoading = false;
      }
    },
    getDownloadUrl(name) {
      if (!name) return "#";
      return `${process.env.VUE_APP_API_URL}/api/reports/download/${encodeURIComponent(name)}`;
    },
  },
  created() {
    this.fetchReports();
  },
};
</script>

<style scoped>
.pdf-list-container {
  padding: 0;
}

.pdf-list {
  list-style: none;
  padding-left: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 15px; 
}

.file-link {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  color: #333;
  font-size: 16px;
  transition: color 0.2s ease;
  min-width: 0;
  line-height: 1.6;
}

.file-link .file-name {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-link:hover .file-name {
  color: #171d8f;
  text-decoration: underline;
}

.file-link i {
  color: #D32F2F;
  font-size: 20px;
  width: 20px; 
  text-align: center;
}

.no-files, .error-message {
  color: #666;
  font-size: 16px;
  text-align: left;
  padding: 20px 0;
}

.error-message {
  color: #D32F2F;
}

</style>