<template>
  <div class="grid-item">
    <div class="table-wrapper">
      <ChartSpinner :visible="isLoading" />
      <table>
        <thead>
          <tr><th colspan="2">{{ title }}</th></tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in pagedItems" :key="index">
            <td v-text="item[itemKey]"></td>
          </tr>
          <tr v-if="totalPages > 1">
            <td colspan="2">
              <div class="pagination">
                <button :disabled="currentPage === 1" @click="changePage(currentPage - 1)">上一页</button>
                <span>{{ currentPage }} / {{ totalPages }}</span>
                <button :disabled="currentPage === totalPages" @click="changePage(currentPage + 1)">下一页</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
import ChartSpinner from '@/components/common/ChartSpinner.vue';

export default {
  name: 'InfoTable',
  components: { ChartSpinner },
  props: {
    title: { type: String, required: true },
    items: { type: Array, required: true },
    isLoading: { type: Boolean, default: false },
    itemKey: { type: String, required: true }
  },
  data() {
    return {
      currentPage: 1,
      itemsPerPage: 10
    };
  },
  computed: {
    totalPages() {
      if (!this.items || this.items.length === 0) return 1;
      return Math.ceil(this.items.length / this.itemsPerPage);
    },
    pagedItems() {
      const start = (this.currentPage - 1) * this.itemsPerPage;
      return this.items.slice(start, start + this.itemsPerPage);
    }
  },
  methods: {
    changePage(page) {
      if (page < 1 || page > this.totalPages) return;
      this.currentPage = page;
    }
  },
  watch: {
    items() {
      this.currentPage = 1;
    }
  }
};
</script>

<style scoped>
/* 从 HomePage.vue 剪切所有与表格相关的样式 */
.grid-item {
  position: relative;
  min-height: 160px;
}
.table-wrapper {
  position: relative;
  min-height: 180px;
}
table {
  width: 100%;
  border-collapse: collapse;
  font-size: 16px;
}
th {
  color: #2e3968;
  font-weight: bold;
  padding: 14px;
  text-align: center;
  border-top: 2px solid #2e3968;
  border-bottom: 2px solid #2e3968;
}
td {
  height: 50px;
  padding: 8px;
  color: #333;
  border-bottom: 1px solid #d3d3d3;
  text-align: center; /* 统一居中 */
  vertical-align: middle; /* 统一垂直居中 */
}
tr:last-child td {
  border-bottom: 2px solid #2e3968;
}
.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 15px;
}
.pagination button {
  background-color: #F5F3F4;
  color: #2e3968;
  border: none;
  padding: 8px 16px;
  border-radius: 5px;
  cursor: pointer;
  transition: 0.2s;
}
.pagination button:disabled {
  background-color: #ccc;
  color: #666;
  cursor: not-allowed;
}
.pagination button:hover:not(:disabled) {
  background-color: #2e3968;
  color: white;
}
</style>