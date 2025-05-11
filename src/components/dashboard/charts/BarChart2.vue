<template>
  <div class="chart-wrapper" style="position: relative;">
    <div class="chart-title">企业数量按企业业务类型分布</div>
    <ChartSpinner :visible="loading" />
    <v-chart
      :option="chartOption"
      style="width: 100%; height: 450px;"
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
              rotate: 0,
              rich: {
                customStyle: {
                  lineHeight: 20 // ✅ 设置你想要的行间距（单位是像素）
                }
              },
              formatter: val => {
                          // 每5个字符换行，最多3行
                          const lines = val.match(/.{1,8}/g)?.slice(0,2) || [val]; // 每5字一行，最多3行
                          return lines.map(line => `{customStyle|${line}}`).join('\n');
                                }
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
  min-width: 1000px;
}

.chart-title {
  font-size: 18px;
  font-weight: bold;
  margin: 15px 0px;
  text-align: center;
  color: #003049;
}
</style>
