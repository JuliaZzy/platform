<template>
  <div class="pagination" v-if="totalPages > 1">
    <div class="pagination-center">
      <button @click="goToPage(currentPage - 1)" :disabled="currentPage === 1">
        上一页
      </button>

      <span class="page-info">
        第
        <input
          type="number"
          class="page-jump-input"
          v-model.number="jumpPageInput"
          :min="1"
          :max="totalPages"
          @keyup.enter="handleJump"
          @blur="validateAndCorrectJumpInput"
          aria-label="跳转到指定页码"
        />
        / {{ totalPages }} 页
      </span>
      <button @click="handleJump" :disabled="!isValidJumpInput">跳转</button>

      <button @click="goToPage(currentPage + 1)" :disabled="currentPage === totalPages">
        下一页
      </button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'PaginationControls',
  props: {
    currentPage: {
      type: Number,
      required: true,
    },
    totalPages: {
      type: Number,
      required: true,
    },
  },
  data() {
    return {
      jumpPageInput: this.currentPage,
    };
  },
  watch: {
    currentPage(newPage) {
      this.jumpPageInput = newPage;
    }
  },
  computed: {
    isValidJumpInput() {
      const page = parseInt(this.jumpPageInput, 10);
      return !isNaN(page) && page >= 1 && page <= this.totalPages;
    }
  },
  methods: {
    goToPage(pageNumber) {
      if (pageNumber >= 1 && pageNumber <= this.totalPages && pageNumber !== this.currentPage) {
        this.$emit('page-changed', pageNumber);
      }
    },
    handleJump() {
      this.validateAndCorrectJumpInput();
      const page = parseInt(this.jumpPageInput, 10);
      if (this.isValidJumpInput && page !== this.currentPage) {
        this.goToPage(page);
      } else if (page === this.currentPage) {
        this.jumpPageInput = this.currentPage;
      }
    },
    validateAndCorrectJumpInput() {
      let page = parseInt(this.jumpPageInput, 10);
      if (isNaN(page) || page < 1) {
        this.jumpPageInput = 1;
      } else if (page > this.totalPages) {
        this.jumpPageInput = this.totalPages;
      } else {
        this.jumpPageInput = page;
      }
    }
  },
};
</script>

<style scoped>
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 20px;
  flex-wrap: wrap;
}

.pagination-center {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
}

.pagination button {
  background-color: #2e3968;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s, color 0.3s;
  font-size: 14px;
  line-height: 1.2;
}
.pagination button:hover:not(:disabled) {
  background-color: #f0f0f0;
  color: #2e3968;
}
.pagination button:disabled {
  background-color: #eef0f6;
  color: #c0c4cc;
  border-color: #dcdfe6;
  opacity: 0.7;
  cursor: not-allowed;
}
.page-info {
  font-weight: bold;
  color: #2e3968;
  font-size: 14px;
  margin: 0 8px;
  display: flex;
  align-items: center;
}

.page-jump-input {
  width: 50px;
  text-align: center;
  margin: 0 5px;
  padding: 8px 5px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 14px;
  line-height: 1.2;
  box-sizing: border-box;
}

.page-jump-input::-webkit-outer-spin-button,
.page-jump-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
.page-jump-input[type=number] {
  -moz-appearance: textfield;
}
</style>