<template>
  <div class="table-section">
    <ChartSpinner :visible="loading" />
    <h3 class="section-title" v-if="title">{{ title }}</h3>
    <div class="table-wrapper">
      <table class="data-table">
        <thead>
          <tr>
            <th>{{ rowLabel }}</th>
            <th v-if="hasDefinition">含义</th>
            <th v-for="col in columns" :key="col">{{ col }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, rowIndex) in rowDataWithTotal" :key="rowIndex" :class="{ 'total-row': row.label === '合计' }">
            <td>{{ row.label }}</td>
            <td v-if="hasDefinition">{{ row.definition || '-' }}</td>
            <td v-for="col in columns" :key="col" style="text-align: right;">
              {{ formatNumber(row[col]) }}
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
  name: 'TransposedTable',
  components: { // 注册 Spinner
    ChartSpinner
  },
  props: {
    data: { type: Array, default: () => [] },
    rowKey: { type: String, required: true },
    colKey: { type: String, required: true },
    valKey: { type: String, required: true },
    title: { type: String, default: '' },
    rowLabel: { type: String, default: '名称' },
    transpose: { type: Boolean, default: true },
    loading: { // 新增 loading prop
      type: Boolean,
      default: false
    }
  },
  computed: {
    hasDefinition() {
      return this.data.some(row => row.definition);
    },
    columns() {
      const set = new Set(this.data.map(item => item[this.colKey]));
      return Array.from(set).sort();
    },
    rowData() {
      const grouped = {};
      this.data.forEach(item => {
        const rowName = item[this.rowKey];
        const colName = item[this.colKey];
        const val = parseFloat(item[this.valKey]);

        if (!grouped[rowName]) {
          grouped[rowName] = {
            label: rowName,
            definition: item.definition || ''
          };
        }

        grouped[rowName][colName] = (grouped[rowName][colName] || 0) + (isNaN(val) ? 0 : val);
      });

      // ❗不要再额外排序，否则会破坏后端传来的顺序
      return Object.values(grouped);
    },
    rowDataWithTotal() {
      const rows = this.rowData;

      // 如果已有“合计”行，直接返回
      if (rows.some(row => row.label === '合计')) {
        return rows;
      }

      // 动态构建合计行
      const totalRow = { label: '合计', definition: '' };
      this.columns.forEach(col => {
        totalRow[col] = rows.reduce((sum, row) => {
          const val = parseFloat(row[col]);
          return sum + (isNaN(val) ? 0 : val);
        }, 0);
      });

      return [...rows, totalRow];
    }
  },
  methods: {
    formatNumber(val) {
      const num = parseFloat(val);
        if (isNaN(num)) {
        return '-'; // 对于非数字或无法解析的值，显示破折号
      }
      // 格式化为整数，并使用本地化的千分位分隔符
      return num.toLocaleString(undefined, { 
        minimumFractionDigits: 0, // 最少0位小数
        maximumFractionDigits: 0
      });
    }
  }
};
</script>

<style scoped>
.table-section {
  /* 1. 去除产生视觉背景和边框效果的样式 */
  background: transparent; /* 或者完全不设置 background */
  padding: 0;              /* 移除内边距，让父容器的padding生效 */
  border-radius: 0;        /* 移除圆角 */
  box-shadow: none;          /* 移除阴影 */

  /* 2. 保留或添加必要的结构和布局样式 */
  width: 100%;             /* 确保它撑满父容器（例如 .chart-full） */
  position: relative;      /* 非常重要：为内部的 ChartSpinner 提供定位上下文 */
                           /* ChartSpinner 会根据这个相对定位的父元素来居中 */
  box-sizing: border-box;  /* 好习惯，确保 padding 和 border 不会增加元素的总宽高 */
}
.section-title {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 16px;
  color: #003049;
}

/* ▼▼▼ 新的表格样式 ▼▼▼ */
.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.data-table th {
  color: #003049;
  /* border: 1px solid #ccc;  会被下面的 border-top/bottom/left/right 覆盖或指定 */
  font-weight: bold;
  padding: 11px;
  text-align: center;
  border-top: 2px solid #003049;
  border-bottom: 2px solid #003049;
  border-left: 1px solid #ccc; /* 默认左右边框 */
  border-right: 1px solid #ccc;
}

.data-table td {
  border: 1px solid #ccc;
  padding: 10px 12px;
  text-align: center; /* 保持和th一致，或按需设为left/right */
}

/* 去掉最左边竖线 */
.data-table th:first-child,
.data-table td:first-child {
  border-left: none;
}

/* 去掉最右边竖线 */
.data-table th:last-child,
.data-table td:last-child {
  border-right: none;
}

/* --- 新增：合计行特定样式 --- */
.data-table tbody tr.total-row td {
  color: #003049;     /* 字体颜色同表头 */
  font-weight: normal; /* 字体不加粗 */
  
  /* 上下边框同表头 */
  border-top: 2px solid #003049;
  border-bottom: 2px solid #003049;

  /* 左右边框与普通td一致 (会被 :first-child / :last-child 规则覆盖) */
  border-left: 1px solid #ccc;
  border-right: 1px solid #ccc;
}

/* 确保合计行的首尾单元格也去掉左右边框 */
.data-table tbody tr.total-row td:first-child {
  border-left: none;
}
.data-table tbody tr.total-row td:last-child {
  border-right: none;
}
/* ▲▲▲ 新的表格样式结束 ▲▲▲ */

</style>