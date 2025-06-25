<template>
  <div class="upload-modal-overlay" v-if="visible" @click.self="closeModal">
    <div class="upload-modal-content">
      <h3 class="modal-title">{{ fileToReplace ? `替换文件: ${fileToReplace.name}` : '上传新报告' }}</h3>

      <div class="file-input-area" @click="triggerFileInput" @dragover.prevent @drop.prevent="handleFileDrop">
        <input 
          type="file" 
          ref="fileInput" 
          @change="handleFileChange" 
          accept=".pdf" 
          style="display: none"
        >
        <p v-if="!selectedFile" class="file-instruction">
          <span class="highlight-text">点击选择文件</span> 或拖拽PDF到此处
        </p>
        <div v-else class="file-preview">
          <span class="file-icon">📄</span>
          <span class="file-name">{{ selectedFile.name }}</span>
        </div>
      </div>

      <div class="progress-container" v-if="isUploading">
        <div class="progress-bar" :style="{ width: uploadProgress + '%' }"></div>
        <span class="progress-text">{{ uploadProgress }}%</span>
      </div>

      <div class="modal-actions">
        <p v-if="message" :class="['message', { 'error-message': isError }]">{{ message }}</p>
        <button 
          @click="submitFile" 
          :disabled="!selectedFile || isUploading"
          class="confirm-btn"
        >
          {{ fileToReplace ? '确认替换' : '确认上传' }}
        </button>
        <button @click="closeModal" class="cancel-btn">取消</button>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
export default {
  name: 'PdfReportUpload',
  props: {
    visible: Boolean,
    fileToReplace: Object
  },
  data() {
    return {
      selectedFile: null,
      isUploading: false,
      uploadProgress: 0,
      message: '',
      isError: false
    };
  },
  methods: {
    triggerFileInput() {
      this.$refs.fileInput.click();
    },
    handleFileChange(e) {
      const files = e.target.files;
      if (files.length > 0) {
        this.selectedFile = files[0];
        this.message = '';
      }
    },
    handleFileDrop(e) {
      const files = e.dataTransfer.files;
      if (files.length > 0 && files[0].type === 'application/pdf') {
        this.selectedFile = files[0];
        this.message = '';
      } else {
        this.message = '请选择PDF文件';
        this.isError = true;
      }
    },
    async submitFile() {
      if (!this.selectedFile) return;

      this.isUploading = true;
      this.message = '';
      this.isError = false;

      const formData = new FormData();
      formData.append('pdfFile', this.selectedFile);

      try {
        const config = {
          headers: {
            'Content-Type': 'multipart/form-data'
          },
          onUploadProgress: progressEvent => {
            this.uploadProgress = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
          }
        };

        // 统一使用POST方法
        const url = this.fileToReplace 
          ? '/api/reports/replace' 
          : '/api/reports/upload';
        
        // 替换模式需要传递旧文件名
        if (this.fileToReplace) {
          formData.append('idToReplace', this.fileToReplace.id);
        }
        await axios.post(url, formData, config);
        
        this.message = this.fileToReplace ? '替换成功！' : '上传成功！';
        setTimeout(() => {
          this.$emit('upload-success');
          this.closeModal();
        }, 1000);

      } catch (error) {
        this.isError = true;
        this.message = this.getErrorMessage(error);
        console.error('操作失败:', error.response?.data || error.message);
      } finally {
        this.isUploading = false;
      }
    },
    getErrorMessage(error) {
      if (!error.response) return '网络连接异常';
      switch (error.response.status) {
        case 404: return '接口不存在，请检查API地址';
        case 413: return '文件大小超过限制';
        default: return error.response.data?.message || '操作失败';
      }
    },

    closeModal() {
      this.resetModal();
      this.$emit('close');
    },
    resetModal() {
      this.selectedFile = null;
      this.uploadProgress = 0;
      this.message = '';
      this.isError = false;
      if (this.$refs.fileInput) {
        this.$refs.fileInput.value = '';
      }
    }
  },
  watch: {
    visible(newVal) {
      if (!newVal) this.resetModal();
    }
  }
};
</script>

<style scoped>
/* 覆盖层 */
.upload-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

/* 内容 */
.upload-modal-content {
  background-color: white;
  border-radius: 8px;
  width: 500px;
  padding: 25px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
}

.modal-title {
  color: #2e3968;
  text-align: center;
  margin-top: 0;
  margin-bottom: 20px;
  font-size: 18px;
}

/* 文件上传 */
.file-input-area {
  border: 2px dashed #ccc;
  border-radius: 5px;
  padding: 40px;
  text-align: center;
  cursor: pointer;
  margin-bottom: 20px;
  transition: all 0.3s;
}

.file-input-area:hover {
  border-color: #409EFF;
  background-color: #f8fafc;
}

.file-instruction {
  color: #666;
  margin: 0;
}

.highlight-text {
  color: #409EFF;
  font-weight: bold;
}

.file-preview {
  display: flex;
  align-items: center;
  justify-content: center;
}

.file-icon {
  font-size: 24px;
  margin-right: 10px;
}

.file-name {
  font-weight: bold;
  color: #2e3968;
  word-break: break-all;
}

/* 进度条 */
.progress-container {
  width: 100%;
  background-color: #eee;
  border-radius: 4px;
  margin-bottom: 20px;
  height: 20px;
  position: relative;
}

.progress-bar {
  height: 100%;
  background-color: #409EFF;
  border-radius: 4px;
  transition: width 0.3s;
}

.progress-text {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  color: white;
  font-size: 12px;
}

/* 按钮 */
.modal-actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
}

.message {
  flex-grow: 1;
  margin: 0 15px 0 0;
  font-size: 14px;
}

.error-message {
  color: #f56c6c;
}

.confirm-btn {
  background-color: #2e3968;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  margin-left: 10px;
}

.confirm-btn:hover {
  background-color: #2c5a8b;
}

.confirm-btn:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.cancel-btn {
  background-color: white;
  color: #666;
  border: 1px solid #ccc;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  margin-left: 10px;
}

.cancel-btn:hover {
  background-color: #f5f5f5;
}
</style>