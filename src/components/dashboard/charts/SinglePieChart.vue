<template>
  <div class="chart-wrapper">
    <div class="chart-title">{{ chartTitle }}</div>
    <ChartSpinner :visible="loading" />
    <v-chart
      ref="vueChartRef"
      :option="chartOption"
      autoresize
      style="width: 100%; height: 100%;"
    />
  </div>
</template>

<script>
import { defineComponent, ref, watch, nextTick } from 'vue';
import { useResponsiveCharts } from '@/utils/useResponsiveCharts.js'; 
import VChart from 'vue-echarts';
import ChartSpinner from '@/components/common/ChartSpinner.vue';
import chartColors from '@/utils/chartColors.js';

export default defineComponent({
  name: 'SinglePieChart',
  components: {
    'v-chart': VChart,
    ChartSpinner
  },
  props: {
    chartTitle: {
      type: String,
      default: '饼图'
    },
    chartData: {
      type: Array,
      default: () => []
    }
  },
  setup(props) {
    const { isMobile } = useResponsiveCharts();
    const chartOption = ref({});
    const loading = ref(false);
    const vueChartRef = ref(null);

    const buildChart = () => {
      loading.value = true;
      setTimeout(() => {
        const radius = isMobile.value ? '40%' : '50%';
        const labelFontSize = isMobile.value ? 10 : 12;

        chartOption.value = {
          color: chartColors,
          tooltip: { trigger: 'item' },
          legend: { show: false },
          series: [{
            type: 'pie',
            radius: radius, 
            data: props.chartData,
            label: {
              show: true,
              formatter: ({ name, value }) => `${name}: ${value}`,
              position: 'outside',
              fontSize: labelFontSize,
              width: 80,
              overflow: 'breakAll',
              lineHeight: 15
            },
            labelLine: { 
              show: true,
              length: isMobile.value ? 15 : 15,
              length2: isMobile.value ? 20 : 20
            },
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

        nextTick(() => {
          vueChartRef.value?.chart?.resize();
        });
      }, 500);
    };

    watch(() => props.chartData, buildChart, { immediate: true, deep: true });
    watch(isMobile, buildChart);

    return {
      chartOption,
      loading,
      vueChartRef
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
  margin-top: 20px;
}
.chart-title {
  font-size: 18px;
  font-weight: bold;
  text-align: center;
  color: #2e3968;
  margin-bottom: 10px;
}

@media (max-width: 768px) {
  .chart-wrapper {
    position: relative; 
    width: 150%;
    height: 400px;
    box-sizing: border-box;
  }
  .chart-title {
    position: relative;
    transform: translateX(-50%);
    top: 10px;
    margin: 0;
    font-size: 16px;
  }
}
</style>