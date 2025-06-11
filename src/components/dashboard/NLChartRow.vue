<template>
  <div class="chart-grid">
    <div class="chart-row">
      <div class="chart-full" v-if="comboChartData && comboChartData.length > 0">
        <ComboBarLineChart 
          chartTitle="非上市公司累计入表企业数量和已融资金额"
          :categories="formattedComboData.categories"
          :barSeries="formattedComboData.barSeries"
          y-axis-bar-name="入表企业数量（家）"
          :lineSeries="formattedComboData.lineSeries"
          y-axis-line-name="入表企业已融资金额（亿）"

          :y-axis-bar-max="360"
          :y-axis-bar-interval="60"
          :y-axis-line-max="18"
          :y-axis-line-interval="3"

          :chart-height="500" 
        />
      </div>
    </div>
    <div class="chart-row">
      <div class="chart-full" v-if="charts.province_area?.length">
        <BarChart1 :chart-data="charts.province_area" />
      </div>
    </div>

    <div class="chart-row">
      <div class="pie-1" v-if="charts.company_type?.length">
        <PieChart1 :chart-data="charts.company_type" :filters="filters" :mode="mode" />
      </div>
    </div>

    <div class.chart-row v-if="charts[barChart2Field]?.length">
      <div class="chart-full">
        <BarChart2 :chart-data="charts[barChart2Field]" />
      </div>
    </div>

    <div class="fixed-pie-row">
      <div class="pie-30" v-if="charts.dataasset_type?.length">
        <PieChart2 :chart-data="charts.dataasset_type" />
      </div>
      <div class="pie-70" v-if="charts.dataasset_register_addrtype?.length">
        <PieChart3 :chart-data="charts.dataasset_register_addrtype" />
      </div>
    </div>
  </div>
</template>

<script>
// ▼▼▼ 1. 导入 ComboBarLineChart 组件 ▼▼▼
import ComboBarLineChart from '@/components/dashboard/charts/ComboBarLineChart.vue';
import BarChart1 from '@/components/dashboard/charts/BarChart1.vue';
import PieChart1 from '@/components/dashboard/charts/PieChart1.vue';
import BarChart2 from '@/components/dashboard/charts/BarChart2.vue';
import PieChart2 from '@/components/dashboard/charts/PieChart2.vue';
import PieChart3 from '@/components/dashboard/charts/PieChart3.vue';

export default {
  name: 'NLChartRow', //  建议将 ChartRow 改为更具描述性的 NLChartRow
  components: {
    // ▼▼▼ 2. 注册 ComboBarLineChart 组件 ▼▼▼
    ComboBarLineChart,
    BarChart1,
    PieChart1,
    BarChart2,
    PieChart2,
    PieChart3
  },
  props: {
    charts: { type: Object, required: true },
    filters: { type: Object, required: true },
    mode: {
      type: String,
      required: true,
      validator: val => ['nls', 'ls'].includes(val)
    },
    // ▼▼▼ 3. 新增 prop，用于接收来自父组件的累积图表数据 ▼▼▼
    comboChartData: {
        type: Array,
        default: () => [] // 提供默认值以增加组件健壮性
    }
  },
  computed: {
    barChart2Field() {
      return this.mode === 'ls' ? 'business_type' : 'company_business_type';
    },
    // ▼▼▼ 4. 新增计算属性，将传入的原始数据格式化为 ComboBarLineChart 所需的格式 ▼▼▼
    formattedComboData() {
      const rawData = this.comboChartData || [];
      if (!rawData.length) {
        return { categories: [], barSeries: [], lineSeries: {} };
      }
      
      const categories = rawData.map(item => item.quarter_time);
      const barData = rawData.map(item => parseFloat(item.cumulative_count) || 0);
      const lineData = rawData.map(item => parseFloat(item.cumulative_value) || 0);

      return {
        categories,
        barSeries: [{ name: '累计数量', data: barData }],
        lineSeries: { name: '累计金额', data: lineData }
      };
    }
  }
};
</script>

<style scoped>
.chart-grid {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.chart-row {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
}

.chart-full {
  flex: 1 1 100%;
  background: #fff;
  padding: 20px;
  border-radius: 8px;
}

.pie-1 {
  flex: 1 1 100%;
  padding: 20px;
  border-radius: 8px;
}

/* ✅ 定位图表行 */
.fixed-pie-row {
  position: relative;
  height: 400px; /* 与图表高度保持一致 */
}

/* ✅ PieChart2 定位在页面宽度的 30% */
.pie-30,
.pie-70 {
  position: absolute;
  width: 600px;
  height: 360px;
  padding: 10px;
  transform: translateX(-50%);
}

.pie-30 {
  left: 30%;
  top: 0;
}

.pie-70 {
  left: 70%;
  top: 0;
}
</style>