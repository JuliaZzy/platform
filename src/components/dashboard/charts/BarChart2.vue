<template>
  <div class="chart-wrapper" style="position: relative;">
    <div class="chart-title">企业数量按企业业务类型分布</div>
    <ChartSpinner :visible="loading" />
    <v-chart
      :option="chartOption"
      style="width: 1000px; height: 450px;"
    />
  </div>
</template>

<script>
import { defineComponent, ref, watch } from 'vue';
import VChart from 'vue-echarts';
import ChartSpinner from '@/components/common/ChartSpinner.vue';
import chartColors from '@/utils/chartColors.js';

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
        chartOption.value = {
          color: chartColors,
          tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
          xAxis: {
            type: 'category',
            data: props.chartData.map(item => item.name),
            axisLabel: {
              fontSize: 12,
              rotate: 30,
              formatter: val => val.length > 6 ? val.slice(0, 6) + '…' : val
            }
          },
          yAxis: {
            type: 'value',
            name: '企业业务类型',
            nameLocation: 'middle',
            nameGap: 60,
            nameTextStyle: { fontSize: 14 }
          },
          series: [{
            type: 'bar',
            data: props.chartData.map(item => item.value)
          }]
        };
        loading.value = false;
      }, 500); // 可换成真实请求时间
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
.chart-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 0;
}

.chart-title {
  font-size: 18px;
  font-weight: bold;
  margin: 20px 0;
  text-align: center;
  color: #003049;
}
</style>
