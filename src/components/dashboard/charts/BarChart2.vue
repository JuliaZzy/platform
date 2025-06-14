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
import VChart from 'vue-echarts';
import ChartSpinner from '@/components/common/ChartSpinner.vue';
import chartColors from '@/utils/chartColors.js';

// ECharts 核心模块和组件的按需引入（保持不变）
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
    const chartOption = ref({});
    const loading = ref(false);

    const updateChart = () => {
      loading.value = true;
      setTimeout(() => {
        // 1. 添加响应式判断
        const isMobile = window.innerWidth <= 768;

        const barLabelOption = {
          show: true,
          position: 'top',
          formatter: '{c}',
          fontSize: 12,
          color: '#005f73',
        };

        chartOption.value = {
          color: chartColors,
          tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
          // 2. 新增 grid 配置，控制边距
          grid: {
            left: '3%',
            right: '4%',
            bottom: isMobile ? '25%' : '15%', // 手机端增加底边距
            containLabel: true
          },
          xAxis: {
            type: 'category',
            data: props.chartData.map(item => item.name),
            axisLabel: {
              // 3. 修改 x轴标签的响应式行为
              rotate: isMobile ? 35 : 0,
              interval: 0,
              rich: {
                customStyle: {
                  lineHeight: 18, // 调整行高
                  fontSize: isMobile ? 8 : 11 // 确保富文本也使用正确的字体大小
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
            nameGap: isMobile ? 45 : 60, // 手机端减小间距
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
