<template>
  <div class="report-container">
    <div class="report-section">
      <ul v-if="reports.length > 0" class="file-grid">
        <!-- 【修改】给 li 添加了 file-item 类，用于CSS定位 -->
        <li v-for="report in reports" :key="report.name" class="file-item">
          <a :href="getDownloadUrl(report.name)" target="_blank" class="file-link">
            <i class="fas fa-file-pdf"></i>
            <!-- 【修改】span 用于更好地控制文本溢出 -->
            <span>{{ formatReportName(report.name) }}</span>
          </a>
        </li>
      </ul>
      <p v-else class="no-files">暂无文件可供下载。</p>
    </div>
    
    <!-- 确保 Font Awesome 图标库已加载 -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css">
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
  padding: 20px 0;
}

/* 1. 将网格精确地分为5个虚拟列，用于定位 */
.file-grid {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  /* 1. 实现三列对称布局 */
  grid-template-columns: repeat(3, 1fr);
  /* 40px 的列间距，20px的行间距 */
  gap: 20px 40px;
}

.file-item {
  position: relative;
}

/* 2. 添加垂直虚线分隔符 */
.file-item:not(:nth-child(3n))::after {
  content: '';
  position: absolute;
  top: 50%;
  right: -20px; /* 位于列间距的正中间 */
  height: 80%;
  transform: translateY(-50%);
  border-left: 1px dashed #ccc;
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

/* 3. 响应式布局 */
@media (max-width: 992px) {
  .file-grid {
    /* 在中等屏幕上变为2列 */
    grid-template-columns: repeat(2, 1fr);
  }
  /* 隐藏所有分隔线 */
  .file-item::after {
    display: none;
  }
  /* 只在奇数项后显示分隔线 */
  .file-item:nth-child(odd)::after {
    display: block;
  }
}


@media (max-width: 768px) {
  .report-container {
    padding: 10px 0;
  }
  .file-grid {
    /* 在小屏幕上变回1列 */
    grid-template-columns: 1fr;
    gap: 20px 0; /* 只保留行间距 */
  }
  
  /* 在手机上隐藏所有分隔线 */
  .file-item::after {
    display: none;
  }
}
</style>