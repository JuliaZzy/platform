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
// 1. 导入我们创建的 Composable
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
    // 2. 调用 Composable 获取响应式的 isMobile 状态
    const { isMobile } = useResponsiveCharts();

    const chartOption = ref({});
    const loading = ref(false);

    const buildChart = () => {
      loading.value = true;
      setTimeout(() => {
        // 3. 根据 isMobile 状态动态设置配置
        const radius = isMobile.value ? '35%' : '50%';
        const labelFontSize = isMobile.value ? 10 : 12;
        // 在移动端给图表四周留出更多空间给标签
        const gridConfig = isMobile.value 
          ? { left: '5%', right: '5%', top: '5%', bottom: '5%' } 
          : { left: '10%', right: '10%', top: '10%', bottom: '10%' };

        chartOption.value = {
          color: chartColors,
          tooltip: { trigger: 'item' },
          legend: { show: false },
          // 4. 【新增】使用 grid 控制边距
          grid: gridConfig,
          series: [{
            type: 'pie',
            // 5. 【修改】使用动态的 radius
            radius: radius,
            data: props.chartData,
            label: {
              show: true,
              formatter: ({ name, value }) => `${name}: ${value}`,
              position: 'outside',
              // 6. 【修改】使用动态的字体大小
              fontSize: labelFontSize,
              // 【优化】防止标签文字过长时溢出
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

    // 监听数据变化
    watch(() => props.chartData, buildChart, { immediate: true, deep: true });

    // 7. 【新增】监听 isMobile 状态变化，重新构建图表
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
  height: 500px; /* 控制整体高度 */
  align-items: center;
  justify-content: center; /* 新增：水平居中饼图组 */
}
.chart-title {
  font-size: 18px;
  font-weight: bold;
  margin: 20px 0;
  text-align: center;
  color: #2e3968;
}
</style>
