<template>
  <div class="report-section-container">
    <div class="report-section">
      <!-- 左侧白色面板 (无变化) -->
      <div class="left-panel">
        <div class="panel-title-container">
          <span class="panel-title-text">文件下载</span>
        </div>
        <div class="file-list-wrapper">
          <ul v-if="reports.length > 0" class="file-list">
            <li v-for="report in reports" :key="report.name">
              <a :href="getDownloadUrl(report.name)" target="_blank" class="file-link">
                <i class="fas fa-file-pdf"></i>
                <span>{{ formatReportName(report.name) }}</span>
              </a>
            </li>
          </ul>
          <p v-else class="no-files">暂无文件可供下载。</p>
        </div>
      </div>
      
      <!-- 右侧面板 -->
      <div class="right-panel">
        <img src="@/assets/report_right.jpg" alt="报告封面" class="panel-image" />
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'PdfReport',
  data() {
    return {
      reports: [] // 存储从后端获取的报告列表
    };
  },
  async mounted() {
    // 组件加载时，获取文件列表
    try {
      const response = await axios.get('/api/reports');
      this.reports = response.data;
    } catch (error) {
      console.error('Failed to fetch reports:', error);
    }
  },
  methods: {
    // 生成下载链接
    getDownloadUrl(filename) {
      return `/api/reports/download/${encodeURIComponent(filename)}`;
    },
    // 去掉文件名中的 .pdf 后缀，使其更美观
    formatReportName(filename) {
      return filename.replace(/\.pdf$/i, '');
    }
  }
};
</script>

<style scoped>
.report-section-container {
  margin: 80px 50px 0 50px;
}

.report-section {
  display: flex;
  min-height: 400px;
  background-color: #fff;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

/* 左侧面板 */
.left-panel {
  flex: 1; /* 占据一半空间 */
  background-color: white;
  padding: 30px;
  display: flex;
  flex-direction: column;
}

.panel-title-container {
  display: inline-block;
  background-color: #BDA36C; /* 金色背景 */
  padding: 8px 16px;
  border-radius: 5px;
  align-self: flex-start; /* 靠左对齐 */
  margin-bottom: 25px;
}

.panel-title-text {
  color: white; /* 白色字体 */
  font-size: 20px;
  font-weight: bold;
}

.file-list-wrapper {
  flex-grow: 1;
  overflow-y: auto;
}

.file-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.file-list li {
  margin-bottom: 15px;
}

.file-link {
  color: #2e3968;
  text-decoration: none;
  font-size: 18px;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  transition: color 0.2s ease;
}

.file-link:hover {
  color: #BDA36C;
  text-decoration: underline;
}

.file-link i {
  color: #e53935; /* PDF 图标红色 */
}

.no-files {
  color: #666;
  font-size: 16px;
}

/* 右侧面板样式 */
.right-panel {
  flex: 1;
  position: relative; /* 1. 设置为相对定位，作为覆盖层的容器 */
  display: flex;
  background-color: #2e3968; /* 添加一个深色底色，防止图片加载失败时区域变白 */
}

/* 新增：创建渐变覆盖层 */
.right-panel::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  /* 2. 从左到右的金色渐变，左边浅，右边深 */
  background: linear-gradient(to right, rgba(189, 163, 108, 0.15), rgba(189, 163, 108, 0.85));
  pointer-events: none; /* 确保覆盖层不会影响鼠标事件 */
}

.panel-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  /* 3. 降低图片自身的不透明度，让渐变效果更柔和 */
  opacity: 0.7; 
}

/* 响应式布局 */
@media (max-width: 992px) {
  .report-section {
    flex-direction: column;
  }
}

@media (max-width: 768px) {
  .report-section-container {
    margin: 40px 20px 0 20px;
  }
}
</style>