<template>
  <div class="grid-item">
    <div class="table-wrapper">
      <ChartSpinner :visible="isLoading" />
      <table>
        <tbody>
          <tr v-for="(item, index) in pagedItems" :key="index">
            <td v-text="item[itemKey]"></td>
          </tr>
          <tr v-if="totalPages > 1">
            <td>
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
.grid-item {
  position: relative;
  min-height: 160px;
  display: flex;
  flex-direction: column; 
  flex: 1;
}

.table-wrapper {
  position: relative;
  min-height: 180px;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 15px;
  flex-grow: 1;
}

td {
  height: 60px;
  padding: 8px 14px;
  color: #333;
  border-bottom: 1px solid #d3d3d3;
  text-align: center;
  vertical-align: middle;
}

tbody tr:first-child td {
  border-top: 2px solid #172787;
}

tr:last-child td {
  border-bottom: 2px solid #172787;
}
.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 15px;
}
.pagination button {
  background-color: #F5F3F4;
  color: #172787;
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
  background-color: #172787;
  color: white;
}

/* 【新增】响应式布局 */
@media (max-width: 768px) {
  table {
    font-size: 14px;
  }
  td {
    height: 45px;
    padding: 6px 10px;
  }
  .pagination button {
    padding: 6px 12px;
  }
  .pagination span {
    font-size: 14px;
  }
}
</style>