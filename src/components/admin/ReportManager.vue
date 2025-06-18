<template>
  <div class="report-view-wrapper">
    <div class="table-wrapper">
      <ChartSpinner :visible="isLoading" :show-watermark="false" />

      <table class="data-table report-table" v-if="!isLoading && reports.length > 0">
        <thead>
          <tr>
            <th>序号</th>
            <th>PDF名称</th>
            <th>上传时间</th>
            <th>文件大小</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(report, index) in reports" :key="report.name">
            <td>{{ index + 1 }}</td>
            <td>
              <a :href="getReportDownloadUrl(report.name)" class="report-link" target="_blank">
                {{ report.name }}
              </a>
            </td>
            <td>{{ formatToDateTimeSec(report.uploadTime) }}</td>
            <td>{{ formatFileSize(report.size) }}</td>
            <td class="report-table-cell-center">
              <!-- 排序按钮组 -->
              <span class="sort-buttons">
                <button
                  @click.stop="$emit('move-report', { index, direction: 'up' })"
                  :disabled="index === 0"
                  class="sort-btn up-btn"
                  title="上移"
                >↑</button>
                <button
                  @click.stop="$emit('move-report', { index, direction: 'down' })"
                  :disabled="index === reports.length - 1"
                  class="sort-btn down-btn"
                  title="下移"
                >↓</button>
              </span>
              
              <!-- 操作按钮 -->
              <button 
                @click="handleReplace(report)" 
                class="action-btn replace-btn"
                title="替换文件"
              >替换</button>
              <button 
                @click="handleDelete(report.name)" 
                class="action-btn delete-btn"
                title="删除文件"
              >删除</button>
            </td>
          </tr>
        </tbody>
      </table>
      
      <p v-else-if="!isLoading && reports.length === 0" class="no-data">暂无报告文件。</p>
    </div>

    <div class="export-controls">
      <button class="upload-btn" @click="$emit('open-upload-modal')">上传文件</button>
    </div>
  </div>
</template>

<script>
import ChartSpinner from '@/components/common/ChartSpinner.vue';

export default {
  name: 'ReportManager',
  components: { ChartSpinner },
  props: {
    reports: {
      type: Array,
      required: true,
    },
    isLoading: {
      type: Boolean,
      required: true,
    }
  },
  emits: ['delete-report', 'open-upload-modal', 'replace-report'],
  methods: {
    getReportDownloadUrl(filename) {
      return `/api/reports/download/${encodeURIComponent(filename)}`;
    },

    formatFileSize(bytes) {
      if (bytes == null || isNaN(bytes)) return 'N/A';
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    formatToDateTimeSec(dateString) {
      if (!dateString) return 'N/A';
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid Date';
      const Y = date.getFullYear();
      const M = String(date.getMonth() + 1).padStart(2, '0');
      const D = String(date.getDate()).padStart(2, '0');
      const h = String(date.getHours()).padStart(2, '0');
      const m = String(date.getMinutes()).padStart(2, '0');
      const s = String(date.getSeconds()).padStart(2, '0');
      return `${Y}-${M}-${D} ${h}:${m}:${s}`;
    },

    handleReplace(report) {
      if (confirm(`确定要替换 ${report.name} 吗？`)) {
        this.$emit('replace-report', report);
      }
    },

    handleDelete(filename) {
      if (confirm(`确定删除 ${filename} 吗？此操作不可恢复！`)) {
        this.$emit('delete-report', filename);
      }
    }
  }
};
</script>

<style scoped>
.table-wrapper {
  margin-bottom: 20px;
  margin-top: 40px;
  overflow-x: auto;
}

.data-table {
  border-collapse: collapse;
  width: 100%;
  font-size: 14px;
  white-space: nowrap;
}

.data-table th,
.data-table td {
  border: 1px solid #ccc;
  padding: 8px 12px;
  text-align: left;
  color: #2e3968;
  vertical-align: middle;
  word-break: break-word;
  white-space: normal;
}

.data-table th {
  background-color: #f4f4f4;
}

.report-table th,
.report-table td {
  padding: 12px 15px;
}

.report-table .report-table-cell-center {
  text-align: center;
}

.report-table th:first-child,
.report-table td:first-child {
  width: 30px;
  text-align: center;
}

.report-table th:nth-child(2) {text-align: center;}
.report-table td:nth-child(2) {
  width: 400px;
  text-align: left;
}

.report-table th:nth-child(3),
.report-table td:nth-child(3) {
  width: 150px;
  text-align: center;
}

.report-table th:nth-child(4),
.report-table td:nth-child(4) {
  width: 50px;
  text-align: center;
}

.report-table th:last-child,
.report-table td:last-child {
  width: auto;
  text-align: center;
}

.report-link {
  color: #2e3968;
  text-decoration: none;
  font-weight: bold;
}

.report-link:hover {
  text-decoration: underline;
  color: #2e3968;
}

.no-data {
  color: #2e3968;
  margin-top: 20px;
  text-align: center;
  padding: 40px;
}

.export-controls {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
  gap: 10px;
}

.upload-btn {
  background-color: #2e3968;
  color: white;
  border: 1px solid transparent;
  padding: 8px 16px;
  border-radius: 5px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.upload-btn:hover {
  background-color: white;
  color: #2e3968;
  border: 1px solid #2e3968;
}

.action-btn {
  font-size: 12px !important;
  padding: 4px 8px !important;
  min-width: auto !important;
  height: auto !important;
  line-height: normal !important;
  border-radius: 3px;
  border: 1px solid transparent;
  cursor: pointer;
  color: white !important;
  transition: opacity 0.2s ease;
}

.action-btn:hover {
  opacity: 0.85;
}

.delete-btn-small {
  background-color: #f56c6c !important;
  border-color: #f56c6c !important;
}

.replace-btn {
  background-color: #409EFF !important;
  border-color: #409EFF !important;
  margin-right: 8px;
}

.delete-btn {
  background-color: #F56C6C !important;
  border-color: #F56C6C !important;
}

.action-btn {
  font-size: 12px !important;
  padding: 4px 8px !important;
  min-width: 50px !important;
  height: auto !important;
  line-height: normal !important;
  border-radius: 3px;
  border: 1px solid transparent;
  cursor: pointer;
  color: white !important;
  transition: all 0.2s ease;
}

.action-btn:hover {
  opacity: 0.8;
  transform: translateY(-1px);
}

.report-table th:last-child,
.report-table td:last-child {
  width: 150px;
}

.sort-buttons {
  display: inline-block;
  margin-right: 10px;
  vertical-align: middle;
}

.sort-btn {
  width: 28px;
  height: 28px;
  margin: 0 2px;
  padding: 0;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background: #f5f7fa;
  color: #606266;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
  line-height: 1;
}

.sort-btn:hover:not(:disabled) {
  background: #e4e7ed;
  border-color: #c0c4cc;
  color: #2e3968;
}

.sort-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.up-btn {
  margin-bottom: 2px;
}
</style>