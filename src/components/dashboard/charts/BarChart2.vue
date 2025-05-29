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
        const barLabelOption = {
          show: true,         // 是否显示标签
          position: 'top',    // 标签的位置，'top'表示在柱子顶部
          formatter: '{c}',   // 标签内容格式器：{c}会自动显示该数据点的值
          fontSize: 12,       // 标签字体大小
          color: '#005f73',   // 标签字体颜色，深灰色
          // distance: 5,     // 可选：标签与图形的距离
        };

        chartOption.value = {
          color: chartColors,
          tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
          xAxis: {
            type: 'category',
            data: props.chartData.map(item => item.name),
            axisLabel: {
              fontSize: 11,
              rotate: 0,
              interval: 0,
              rich: {
                customStyle: {
                  lineHeight: 20 // ✅ 设置你想要的行间距（单位是像素）
                }
              },
              formatter: val => {
                          const lines = val.match(/.{1,5}/g)?.slice(0,5) || [val];
                          return lines.map(line => `{customStyle|${line}}`).join('\n');
                                }
            }
          },
          yAxis: {
            type: 'value',
            name: '入表企业数量（家）',
            nameLocation: 'middle',
            nameGap: 60,
            nameTextStyle: { fontSize: 14 }
          },
          series: [{
            type: 'bar',
            data: props.chartData.map(item => item.value),
            label: barLabelOption
          }],
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
  min-width: 1100px;
}

.chart-title {
  font-size: 18px;
  font-weight: bold;
  margin: 15px 0px;
  text-align: center;
  color: #003049;
}
</style>
