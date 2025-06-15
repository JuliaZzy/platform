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
          chart-annotation="注：由于企业融资时间往往滞后于入表时间，其融资额均指相关企业截至2025年一季度的总融资额，而非截至数据资产入表披露日期的融资额。"
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

    <div class="chart-row" v-if="charts[barChart2Field]?.length">
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
import ComboBarLineChart from '@/components/dashboard/charts/ComboBarLineChart.vue';
import BarChart1 from '@/components/dashboard/charts/BarChart1.vue';
import PieChart1 from '@/components/dashboard/charts/PieChart1.vue';
import BarChart2 from '@/components/dashboard/charts/BarChart2.vue';
import PieChart2 from '@/components/dashboard/charts/PieChart2.vue';
import PieChart3 from '@/components/dashboard/charts/PieChart3.vue';

export default {
  name: 'NLChartRow',
  components: {
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
    comboChartData: {
      type: Array,
      default: () => []
    }
  },
  computed: {
    barChart2Field() {
      return this.mode === 'ls' ? 'business_type' : 'company_business_type';
    },
    formattedComboData() {
      const rawData = this.comboChartData || [];
      if (!rawData.length) {
        return { categories: [], barSeries: [], lineSeries: {} };
      }

      const exclusionQuarter = '2023Q4';
      // 1. 先从原始数据中过滤掉 '2023Q4'
      const filteredData = rawData.filter(item => item.quarter_time !== exclusionQuarter);

      const categories = filteredData.map(item => item.quarter_time);
      const barData = filteredData.map(item => parseFloat(item.cumulative_count) || 0);
      const lineData = filteredData.map(item => parseFloat(item.cumulative_value) || 0);

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
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.pie-1 {
  flex: 1 1 100%;
  padding: 20px;
  border-radius: 8px;
}

/* 1. 将饼图容器改为 Flexbox 布局 */
.fixed-pie-row {
  display: flex;
  flex-wrap: wrap; 
  gap: 20px;
  align-items: center;
  justify-content: center;
}

/* 2. 为两个饼图设置灵活的基础宽度 */
.pie-30 {
  flex: 0 1 45%; 
  min-width: 250px;
}

.pie-70 {
  flex: 0 1 45%; 
  min-width: 250px;
}

/* 3. 响应式布局：在手机端，改为垂直堆叠 */
@media (max-width: 768px) {
  .fixed-pie-row {
    flex-direction: column;
  }

  .pie-30,
  .pie-70 {
    flex-basis: 100%;
  }
  .pie-30 {
    order: 1;
  }
  .pie-70 {
    order: 2;
  }
}
</style>

