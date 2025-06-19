<template>
  <div class="pdf-list-container">
    <div v-if="isLoading">正在加载...</div>
    <div v-else-if="error" class="error-message">{{ error }}</div>
    <ul v-else-if="reports.length > 0" class="pdf-list">
      <li v-for="report in reports" :key="report.name">
        <a :href="getDownloadUrl(report.name)" target="_blank" class="file-link">
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
  /* 方法一 (推荐): 使用 gap 属性控制每个列表项之间的垂直间距
    你可以把 15px 修改为你希望的任何值，比如 20px, 1rem 等。
  */
  gap: 15px; 
}

.file-link {
  display: flex;
  align-items: center; /* 垂直居中图标和文字 */
  gap: 10px; /* 图标和文字之间的间距 */
  text-decoration: none;
  color: #333;
  font-size: 16px;
  transition: color 0.2s ease;
  min-width: 0;
  /* 方法二: 使用 line-height 控制单行内部的高度
    增加这个值可以让每一行本身变得更高，看起来更舒展。
    你可以尝试 1.5, 1.6, 1.8 等值。
  */
  line-height: 1.6;
}

.file-link .file-name {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-link:hover .file-name {
  color: #171d8f; /* 鼠标悬浮时只改变文字颜色 */
  text-decoration: underline;
}

.file-link i {
  color: #D32F2F; /* 使用一个更现代的红色 */
  font-size: 20px;
  /* 让图标宽度固定，防止文字对不齐 */
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