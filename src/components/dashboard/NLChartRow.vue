<template>
  <div class="chart-grid">
    <div class="chart-row">
      <div class="chart-full" v-if="comboChartData && comboChartData.length > 0">
        <ComboBarLineChart 
          chartTitle="非上市公司累计入表企业数量和已融资金额"
          :categories="formattedComboData.categories"
          :barSeries="formattedComboData.barSeries"
          y-axis-bar-name="入表企业数量(家)"
          :lineSeries="formattedComboData.lineSeries"
          y-axis-line-name="入表企业已融资金额(亿)"
          :y-axis-bar-max="360"
          :y-axis-bar-interval="60"
          :y-axis-line-max="18"
          :y-axis-line-interval="3"
          chart-annotation="注：由于企业融资时间往往滞后于入表时间，其融资额均指相关企业截至2025年一季度的总融资额，而非截至数据资产入表披露日期的融资额。"
          :chart-height="dynamicChartHeight"
        />
      </div>
    </div>

    <div class="chart-row">
      <div class="chart-full" v-if="charts.province_area?.length">
        <SingleBarChart
          chartTitle="企业数量按省级行政区分布"
          yAxisName="入表企业数量（家）"
          :chart-data="charts.province_area"
          :chart-height="360"
          :xAxisMobileRotate="35" 
        />
      </div>
    </div>

    <div class="chart-row">
      <div class="pie-1" v-if="charts.company_type?.length">
        <ParentChildPieChart :chart-data="charts.company_type" :filters="filters" :mode="mode" />
      </div>
    </div>

    <div class="chart-row" v-if="charts[barChart2Field]?.length">
      <div class="chart-full">
        <SingleBarChart
          chartTitle="企业数量按企业业务类型分布"
          yAxisName="入表企业数量（家）"
          :chart-data="charts[barChart2Field]"
          :chart-height="450"
          :xAxisMobileRotate="0" 
          enable-data-zoom 
        />
      </div>
    </div>

    <div class="fixed-pie-row">
      <div class="pie-30" v-if="charts.dataasset_type?.length">
        <SinglePieChart 
          chartTitle="企业数量按数据资产类型分布"
          :chart-data="charts.dataasset_type" 
        />
      </div>
      <div class="pie-70" v-if="charts.dataasset_register_addrtype?.length">
        <SinglePieChart 
          chartTitle="企业数量按资产登记机构分布"
          :chart-data="charts.dataasset_register_addrtype" 
        />
      </div>
    </div>
  </div>
</template>

<script>
import ComboBarLineChart from '@/components/dashboard/charts/ComboBarLineChart.vue';
import SingleBarChart from '@/components/dashboard/charts/SingleBarChart.vue';
import ParentChildPieChart from '@/components/dashboard/charts/ParentChildPieChart.vue';
import SinglePieChart from '@/components/dashboard/charts/SinglePieChart.vue';

export default {
  name: 'NLChartRow',
  components: {
    ComboBarLineChart,
    SingleBarChart,
    ParentChildPieChart,
    SinglePieChart
  },
  props: {
    chartHeight: {
      type: Number,
      default: 440
    },
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
  data() {
    return {
      isMobile: false
    }
  },
  computed: {
    dynamicChartHeight() {
      return this.isMobile ? 400 : 500;
    },
    barChart2Field() {
      //return this.mode === 'ls' ? 'business_type' : 'company_business_type';
      return 'company_business_type';
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
  },
  mounted() {
    this.handleResize();
    window.addEventListener('resize', this.handleResize);
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.handleResize);
  },
  methods: {
    handleResize() {
      this.isMobile = window.innerWidth < 768;
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
  padding: 10px 0px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.pie-1 {
  flex: 1 1 100%;
  padding: 20px;
  border-radius: 8px;
}

.fixed-pie-row {
  display: flex;
  flex-wrap: wrap; 
  gap: 20px;
  align-items: center;
  justify-content: center;
}

.pie-30 {
  flex: 0 1 45%; 
  min-width: 250px;
}

.pie-70 {
  flex: 0 1 45%; 
  min-width: 250px;
}

/* 3. 响应式布局 */
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

