import axios from 'axios';
import { formatToDateTimeSec } from '@/utils/formatters.js';

export const reportManagerMixin = {
  data() {
    return {
      reportsData: [],
      isReportsLoading: false,
      isUploadModalVisible: false,
      reportToReplace: null,
    };
  },
  methods: {
    async loadReports() {
      this.isReportsLoading = true;
      try {
        const response = await axios.get(`${process.env.VUE_APP_API_URL}/api/reports`);
        this.reportsData = Array.isArray(response.data) ? response.data : [];
      } catch (error) {
        alert('获取报告列表失败');
      } finally {
        this.isReportsLoading = false;
      }
    },

    handleDeleteInReports(id) {
      if (!this.isEditMode) {
        alert('请先进入修改模式！');
        return;
      }
      const reportToDelete = this.reportsData.find(r => r.id === id);
      if (!reportToDelete) return;

      if (confirm(`确定要从列表中移除报告 "${reportToDelete.name}" 吗？\n（更改将在点击“保存”后生效）`)) {
        // 只在前端的数组中过滤掉这一项
        this.reportsData = this.reportsData.filter(r => r.id !== id);
      }
    },

    openUploadModalInReports(fileToReplace = null) {
      if (!this.isEditMode) {
        alert('请先进入修改模式！');
        return;
      }
      this.reportToReplace = fileToReplace;
      this.isUploadModalVisible = true;
    },

    handleReportUploadSuccess() {
      this.loadReports();
      this.reportToReplace = null;
    },
    
    handleMoveReport({ index, direction }) {
      if (!this.isEditMode) {
        alert('请先进入修改模式！');
        return;
      }
      if ((direction === 'up' && index === 0) || 
          (direction === 'down' && index === this.reportsData.length - 1)) {
        return;
      }
      const newReports = [...this.reportsData];
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      [newReports[index], newReports[newIndex]] = [newReports[newIndex], newReports[index]];
      this.reportsData = newReports;
    },

    formatFileSize(bytes) {
      if (bytes == null || isNaN(bytes)) return 'N/A';
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },
    formatToDateTimeSec,
  },
};