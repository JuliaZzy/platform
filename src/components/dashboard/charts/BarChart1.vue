<template>
  <div class="chart-wrapper">
    <div class="chart-title">企业数量按省级行政区分布</div>
    <ChartSpinner :visible="loading" />
    <v-chart
      ref="vueChartRef"
      :option="barChartOption"
      autoresize
      style="width: 100%; height: 360px;"
    />
  </div>
</template>

<script>
import { defineComponent, ref, watch } from 'vue';
import { useResponsiveCharts } from '@/utils/useResponsiveCharts.js'; 
import VChart from 'vue-echarts';
import ChartSpinner from '@/components/common/ChartSpinner.vue';
import chartColors from '@/utils/chartColors.js';
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { BarChart } from 'echarts/charts';
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent
} from 'echarts/components';

use([
  CanvasRenderer,
  BarChart,
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent
]);

export default defineComponent({
  name: 'BarChart1',
  components: {
    VChart,
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
    const barChartOption = ref({});
    const loading = ref(false);
    const vueChartRef = ref(null);

    const updateChart = () => {
      loading.value = true;
      setTimeout(() => {
        const barLabelOption = {
          show: true,
          position: 'top',
          formatter: '{c}',
          fontSize: 12,
          color: '#005f73',
        };
        
        barChartOption.value = {
          color: chartColors,
          tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
          grid: {
            left: '3%',
            right: '4%',
            bottom: isMobile.value ? '25%' : '3%',
            containLabel: true
          },
          xAxis: {
            type: 'category',
            data: props.chartData.map(item => item.name),
            axisLabel: {
              rotate: isMobile.value ? 35 : 0, 
              interval: 0,
              fontSize: isMobile.value ? 8 : 12,
            }
          },
          yAxis: {
            type: 'value',
            name: '入表企业数量（家）',
            nameLocation: 'middle',
            nameGap: isMobile.value ? 35 : 45,
            nameTextStyle: { fontSize: 12 }
          },
          series: [{
            type: 'bar',
            data: props.chartData.map(item => item.value),
            label: barLabelOption
          }],
        };
        loading.value = false;
      }, 500);
    };

    watch(() => props.chartData, updateChart, { immediate: true });

    watch(isMobile, updateChart);

    return {
      barChartOption,
      loading,
      vueChartRef
    };
  }
});
</script>

<style scoped>
.chart-wrapper {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 0;
  width: 100%;
}

.chart-title {
  font-size: 18px;
  font-weight: bold;
  margin: 20px 0;
  text-align: center;
  color: #2e3968;
}

@media (max-width: 768px) {
  .chart-title {
    font-size: 16px;
    margin: 15px 0;
  }
}
</style>
