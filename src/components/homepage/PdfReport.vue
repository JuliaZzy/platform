<template>
  <div class="report-container">
    <div class="report-section">
      <ul v-if="reports.length > 0" class="file-grid">
        <li v-for="report in reports" :key="report.name" class="file-item">
          <a :href="getDownloadUrl(report.name)" target="_blank" class="file-link">
            <i class="fas fa-file-pdf"></i>
            <span>{{ formatReportName(report.name) }}</span>
          </a>
        </li>
      </ul>
      <p v-else class="no-files">暂无文件可供下载。</p>
    </div>
    
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css">
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'PdfReport',
  data() {
    return {
      reports: []
    };
  },
  async mounted() {
    try {
      const response = await axios.get('/api/reports');
      this.reports = response.data;
    } catch (error) {
      console.error('Failed to fetch reports:', error);
    }
  },
  methods: {
    getDownloadUrl(filename) {
      return `/api/reports/download/${encodeURIComponent(filename)}`;
    },
    formatReportName(filename) {
      return filename.replace(/\.pdf$/i, '');
    }
  }
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
  gap: 15px;
}

.file-item {
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