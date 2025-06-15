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
    // 3. ✨ 调用 composable，一行代码即可获得响应式的 isMobile 状态
    const { isMobile } = useResponsiveCharts();

    const barChartOption = ref({});
    const loading = ref(false);
    const vueChartRef = ref(null);

    const updateChart = () => {
      loading.value = true;
      setTimeout(() => {
        // 这里的逻辑完全不需要改变，直接使用 isMobile.value
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
            bottom: isMobile.value ? '25%' : '3%', // 使用 isMobile.value
            containLabel: true
          },
          xAxis: {
            type: 'category',
            data: props.chartData.map(item => item.name),
            axisLabel: {
              rotate: isMobile.value ? 35 : 0, // 使用 isMobile.value
              interval: 0,
              fontSize: isMobile.value ? 8 : 12, // 使用 isMobile.value
            }
          },
          yAxis: {
            type: 'value',
            name: '入表企业数量（家）',
            nameLocation: 'middle',
            nameGap: isMobile.value ? 35 : 45, // 使用 isMobile.value
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

    // 监听数据变化，更新图表
    watch(() => props.chartData, updateChart, { immediate: true });

    // 4. ✨ 同样，监听 isMobile 的变化来更新图表
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
/* 【修改】移除了 min-width，让容器可以自由缩放 */
.chart-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 0;
  width: 100%; /* 宽度占满父容器 */
}

.chart-title {
  font-size: 18px;
  font-weight: bold;
  margin: 20px 0;
  text-align: center;
  color: #2e3968;
}

/* 【新增】响应式样式 */
@media (max-width: 768px) {
  .chart-title {
    font-size: 16px;
    margin: 15px 0;
  }
}
</style>
