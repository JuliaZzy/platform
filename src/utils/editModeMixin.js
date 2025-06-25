export const editModeMixin = {
  data() {
    return {
      isEditMode: false,
      originalDataForBackup: null, 
    };
  },
  methods: {
    enterEditMode(dataToBackup) {
      if (!dataToBackup) {
        console.error('进入编辑模式失败：没有提供需要备份的数据。');
        return;
      }
      this.originalDataForBackup = JSON.parse(JSON.stringify(dataToBackup));
      this.isEditMode = true;
    },

    cancelChanges() {
      if (this.originalDataForBackup !== null) {
        this.$emit('data-restored', this.originalDataForBackup);
      }
      this.isEditMode = false;
    },

    async saveChanges(saveApiCall) {
      if (typeof saveApiCall !== 'function') { return; }
      try {
        await saveApiCall();
        this.isEditMode = false;
        this.originalDataForBackup = null;
      } catch (error) {
        console.error('保存操作失败:', error);
        throw error;
      }
    },
  },
};