<template>
  <div class="table-section"> 
    <ChartSpinner :visible="loading" /> 
    <h3 class="section-title">2024年数据资源入表详情</h3>
    <div class="table-wrapper">
      <table class="data-table">
        <thead>
          <tr>
            <th>报告时间</th>
            <th>数据资源入表数量</th>
            <th>数据资源入表总额（单位：万元）</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in tableRows" :key="row.报告时间">
            <td>{{ row['报告时间'] }}</td>
            <td style="text-align: right;">{{ row['入表数量'] }}</td>
            <td style="text-align: right;">{{ format(row['入表总额（万元）']) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
import ChartSpinner from '@/components/common/ChartSpinner.vue'; // 导入 Spinner

export default {
  name: 'ComboTable',
  components: { // 注册 Spinner
    ChartSpinner
  },
  props: {
    tableRows: Array,
    loading: { // 新增 loading prop
      type: Boolean,
      default: false
    }
  },
  methods: {
    format(val) {
      const num = parseFloat(val);
      if (isNaN(num)) {
        return '-';
      }
      return num.toLocaleString(undefined, { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 // 确保最多也只显示两位小数
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
  border-left: 1px solid #ccc; /* 默认左右边框 */
  border-right: 1px solid #ccc;
}

.data-table td {
  border: 1px solid #ccc; /* 这会定义所有内部单元格的边框 */
  padding: 10px 12px;
  /* text-align: center; */ /* 移除了通用的center，因为你在模板中为数值td设置了text-align: right */
}
.data-table tbody tr:last-child td {
  border-bottom: 2px solid #003049;
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
</style>
