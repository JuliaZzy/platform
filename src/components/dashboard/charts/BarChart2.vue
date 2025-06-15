<template>
  <div class="chart-wrapper">
    <div class="chart-title">企业数量按企业业务类型分布</div>
    <ChartSpinner :visible="loading" />
    <v-chart
      ref="vueChartRef"
      :option="chartOption"
      autoresize
      style="width: 100%; height: 450px;"
    />
  </div>
</template>

<script>
import { defineComponent, ref, watch } from 'vue';
// Correctly importing the composable
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
  name: 'BarChart2',
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
    // This is correct!
    const { isMobile } = useResponsiveCharts();
    const chartOption = ref({});
    const loading = ref(false);

    const updateChart = () => {
      loading.value = true;
      setTimeout(() => {
        // 1. 【已删除】移除了下面这行错误的代码
        // const isMobile = window.innerWidth <= 768;

        const barLabelOption = {
          show: true,
          position: 'top',
          formatter: '{c}',
          fontSize: 12,
          color: '#005f73',
        };

        // Now all instances of "isMobile" correctly refer to the reactive `isMobile.value`
        chartOption.value = {
          color: chartColors,
          tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
          grid: {
            left: '3%',
            right: '4%',
            bottom: isMobile.value ? '25%' : '15%',
            containLabel: true
          },
          xAxis: {
            type: 'category',
            data: props.chartData.map(item => item.name),
            axisLabel: {
              rotate: isMobile.value ? 35 : 0,
              interval: 0,
              rich: {
                customStyle: {
                  lineHeight: 18,
                  fontSize: isMobile.value ? 8 : 11
                }
              },
              formatter: val => {
                const lines = val.match(/.{1,5}/g)?.slice(0, 5) || [val];
                return lines.map(line => `{customStyle|${line}}`).join('\n');
              }
            }
          },
          yAxis: {
            type: 'value',
            name: '入表企业数量（家）',
            nameLocation: 'middle',
            nameGap: isMobile.value ? 45 : 60,
            nameTextStyle: { fontSize: 14 }
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

    watch(() => props.chartData, updateChart, { immediate: true, deep: true });

    // 2. 【已新增】添加对 isMobile 状态的监听
    watch(isMobile, updateChart);

    return {
      chartOption,
      loading
    };
  }
});
</script>

<style scoped>
/* 4. 修改容器样式，移除 min-width */
.chart-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 0;
  width: 100%;
}

.chart-title {
  font-size: 18px;
  font-weight: bold;
  margin: 15px 0px;
  text-align: center;
  color: #2e3968;
}

/* 5. 新增响应式样式 */
@media (max-width: 768px) {
  .chart-title {
    font-size: 16px;
    margin: 15px 0;
  }
}
</style>
