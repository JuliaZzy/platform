<template>
  <div class="chart-wrapper" style="position: relative;">
    <div class="chart-title">企业数量按资产登记机构分布</div>
    <ChartSpinner :visible="loading" />
    <v-chart
      :option="chartOption"
      style="width: 100%; height: 60%;"
    />
  </div>
</template>

<script>
import { defineComponent, ref, watch } from 'vue';
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
    const chartOption = ref({});
    const loading = ref(false);

    const buildChart = () => {
      loading.value = true;
      setTimeout(() => {
        chartOption.value = {
          color: chartColors,
          tooltip: { trigger: 'item' },
          legend: { show: false },
          series: [{
            type: 'pie',
            radius: '50%',
            data: props.chartData,
            label: {
              show: true,
              formatter: ({ name, value }) => `${name}: ${value}`,
              position: 'outside'
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
      }, 500); // 替换为真实数据加载逻辑即可
    };

    watch(() => props.chartData, buildChart, { immediate: true, deep: true });

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
  width: 100%;
  height: 500px; /* 控制整体高度 */
}
.chart-title {
  font-size: 18px;
  font-weight: bold;
  margin: 20px 0;
  text-align: center;
  color: #2e3968;
}
</style>
