<template>
  <div class="table-section">
    <ChartSpinner :visible="loading" />
    <h3 class="section-title">{{ title }} 数据资源入表详情</h3>
    <div class="table-wrapper">
      <table class="data-table">
        <thead>
          <tr>
            <th>报告时间</th>
            <th>{{ title }}--数据资源入表数量</th>
            <th>{{ title }}--数据资源入表总额（万元）</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in formattedRows" :key="row.reportTime">
            <td>{{ row.reportTime }}</td>
            <td style="text-align: right;">{{ formatValue(row.count) }}</td>
            <td style="text-align: right;">{{ formatNumber(row.total) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
import ChartSpinner from '@/components/common/ChartSpinner.vue';
export default {
  name: 'SubjectTable',
  components: { // 注册 Spinner
    ChartSpinner
  },
  props: {
    title: String,
    countData: Array,
    sumData: Array,
    loading: { // 新增 loading prop
      type: Boolean,
      default: false
    }
  },
  computed: {
    formattedRows() {
      const rowMap = {};
      const countKey = `${this.title}-数据资源入表数量`;
      const totalKey = `${this.title}-数据资源入表总额（万元）`;

      // 遍历数量数据
      this.countData.forEach(item => {
        const time = item['报告时间'];
        if (!time || time === '合计') return; // ✅ 忽略空时间或已有合计行
        if (!rowMap[time]) {
          rowMap[time] = { reportTime: time, count: 0, total: 0 };
        }
        rowMap[time].count = parseInt(item[countKey], 10) || 0;
      });

      // 遍历金额数据
      this.sumData.forEach(item => {
        const time = item['报告时间'];
        if (!time || time === '合计') return; // ✅ 忽略空时间或已有合计行
        if (!rowMap[time]) {
          rowMap[time] = { reportTime: time, count: 0, total: 0 };
        }
        rowMap[time].total = parseFloat(item[totalKey]) || 0;
      });

      const rows = Object.values(rowMap).sort((a, b) => {
        // 更健壮的排序，处理可能的非标准季度名称
        if (a.reportTime === '合计') return 1;
        if (b.reportTime === '合计') return -1;
        return a.reportTime.localeCompare(b.reportTime);
      });
      
      // ▼▼▼ 修改重点：不再创建和添加 totalRow ▼▼▼
      return rows; // 直接返回处理好的数据行，不包含合计行
    }
  },
  methods: {
    formatNumber(val) {
      const num = parseFloat(val);
      if (isNaN(num)) {
        return '-';
      }
      return num.toLocaleString(undefined, { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 // 确保最多也只显示两位小数
      });
    },
    formatValue(val) {
      return (val === null || val === undefined || isNaN(val)) ? '—' : val;
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

.table-wrapper {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.data-table th {
  color: #003049;
  font-weight: bold;
  padding: 11px;
  text-align: center;
  border-top: 2px solid #003049;
  border-bottom: 2px solid #003049;
  border-left: 1px solid #ccc; 
  border-right: 1px solid #ccc;
}

.data-table td {
  border: 1px solid #ccc; 
  padding: 10px 12px;
  /* text-align: center; */ /* 允许模板中td的style="text-align: right;"生效 */
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

/* 为表格数据区的最后一行所有单元格添加特殊的底部边框 */
.data-table tbody tr:last-child td {
  border-bottom: 2px solid #003049;
}
</style>
