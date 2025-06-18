<template>
  <div class="pdf-list-container">
    <div v-if="isLoading">正在加载...</div>
    <div v-else-if="error" class="error-message">{{ error }}</div>
    <ul v-else-if="reports.length > 0" class="pdf-list">
      <li v-for="report in reports" :key="report.name">
        <a :href="getDownloadUrl(report.name)" target="_blank" class="file-link">
          <i class="fas fa-file-pdf"></i>
          <span class="file-name">{{ report.filename }}</span>
        </a>
      </li>
    </ul>
    <div v-else>暂无最新报告。</div>
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
    getDownloadUrl(filename) {
      if (!filename) return "#";
      return `${process.env.VUE_APP_API_URL}/reports/download/${filename}`;
    },
  },
  created() {
    this.fetchReports();
  },
};
</script>

<style scoped>
.report-container {
  padding: 0; 
}

.file-list {
  list-style: none;
  padding-left: 0; 
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.file-item {
  margin-bottom: 15px;
  border-bottom: 1px solid #eee;
  padding-bottom: 15px;
}

.file-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.file-link {
  display: flex;
  align-items: left;
  gap: 10px;
  text-decoration: none;
  color: #333;
  font-size: 16px;
  transition: color 0.2s ease;
  min-width: 0;
}

.file-link span {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-link:hover {
  color: #171d8f;
  text-decoration: underline;
}

.file-link i {
  color: #e53935;
  font-size: 20px;
}

.no-files {
  color: #666;
  font-size: 16px;
  text-align: center;
  padding: 40px 0;
}

</style>