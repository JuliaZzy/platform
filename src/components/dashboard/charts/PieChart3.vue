<template>
  <div class="chart-wrapper" style="position: relative;">
    <div class="chart-title">企业数量按资产登记机构分布</div>
    <ChartSpinner :visible="loading" />
    <v-chart
      :option="chartOption"
      style="width: 100%; height: 80%;"
    />
  </div>
</template>

<script>
import { defineComponent, ref, watch } from 'vue';
import { useResponsiveCharts } from '@/utils/useResponsiveCharts.js'; 

import VChart from 'vue-echarts';
import ChartSpinner from '@/components/common/ChartSpinner.vue';
import chartColors from '@/utils/chartColors.js';

export default defineComponent({
  name: 'PieChart3',
  components: {
    'v-chart': VChart,
    ChartSpinner
  },
  props: {
    chartData: {
      type: Array,
      default: () => []
    }
  },
  setup(props) {
    const { isMobile } = useResponsiveCharts();
    const chartOption = ref({});
    const loading = ref(false);
    const buildChart = () => {
      loading.value = true;
      setTimeout(() => {
        const radius = isMobile.value ? '35%' : '50%';
        const labelFontSize = isMobile.value ? 10 : 12;
        const gridConfig = isMobile.value 
          ? { left: '5%', right: '5%', top: '5%', bottom: '5%' } 
          : { left: '10%', right: '10%', top: '10%', bottom: '10%' };

        chartOption.value = {
          color: chartColors,
          tooltip: { trigger: 'item' },
          legend: { show: false },
          grid: gridConfig,
          series: [{
            type: 'pie',
            radius: radius,
            data: props.chartData,
            label: {
              show: true,
              formatter: ({ name, value }) => `${name}: ${value}`,
              position: 'outside',
              fontSize: labelFontSize,
              overflow: 'truncate',
              width: 80
            },
            labelLine: { show: true },
            emphasis: {
              itemStyle: {
                shadowBlur: 10,
                shadowOffsetX: 0,
                shadowColor: 'rgba(0, 0, 0, 0.5)'
              }
            }
          }]
        };
        loading.value = false;
      }, 500);
    };

    watch(() => props.chartData, buildChart, { immediate: true, deep: true });
    watch(isMobile, buildChart);

    return {
      chartOption,
      loading
    };
  }
});
</script>

<style scoped>
.chart-wrapper {
  display: flex;
  flex-direction: column;
  width: 90%;
  height: 500px;
  align-items: center;
  justify-content: center;
}
.chart-title {
  font-size: 18px;
  font-weight: bold;
  margin: 20px 0;
  text-align: center;
  color: #2e3968;
}
</style>
