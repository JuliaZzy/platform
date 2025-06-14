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
    const barChartOption = ref({});
    const loading = ref(false);
    const vueChartRef = ref(null);

    const updateChart = () => {
      loading.value = true;
      setTimeout(() => {
        // 【新增】判断是否为移动端
        const isMobile = window.innerWidth <= 768;

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
          // 【新增】grid 配置，用于控制图表主体的位置和边距
          grid: {
            left: '3%',
            right: '4%',
            bottom: isMobile ? '25%' : '3%', // 手机端增加底边距，为倾斜的标签留出空间
            containLabel: true
          },
          xAxis: {
            type: 'category',
            data: props.chartData.map(item => item.name),
            axisLabel: {
              // 【修改】在移动端倾斜标签
              rotate: isMobile ? 35 : 0,
              interval: 0, // 确保所有标签都显示
              fontSize: isMobile ? 8 : 12, // 手机端字体稍小
            }
          },
          yAxis: {
            type: 'value',
            name: '入表企业数量（家）',
            nameLocation: 'middle',
            // 【修改】调整y轴名称与轴线的距离
            nameGap: isMobile ? 35 : 45,
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

    // 监听数据变化
    watch(() => props.chartData, updateChart, { immediate: true });

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
