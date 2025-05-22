<template>
  <div class="chart-wrapper" style="position: relative;">
    <div class="chart-title">{{ chartTitle }}</div>
    <ChartSpinner :visible="loading" />
    <v-chart
      v-if="!loading && chartOption.series && chartOption.series.length"
      :option="chartOption"
      style="width: 100%; height: 440px;"
    />
  </div>
</template>

<script>
import { defineComponent, ref, watch } from 'vue';
import VChart from 'vue-echarts';
import ChartSpinner from '@/components/common/ChartSpinner.vue';
import chartColors from '@/utils/chartColors.js';

export default defineComponent({
  name: 'ComboBarLineChart',
  components: {
    VChart,
    ChartSpinner
  },
  props: {
    chartTitle: {
      type: String,
      default: '柱状图 + 折线图'
    },
    categories: {
      type: Array,
      default: () => []  // ✅ 防止未传时报错
    },
    barSeries: {
      type: Array,
      default: () => []  // ✅ 防止未传时报错
    },
    lineSeries: {
      type: Object,
      default: () => ({ name: '折线', data: [] }) // ✅ 保底结构
    },
    yAxisBarName: {
      type: String,
      default: '数量（个）'
    },
    yAxisLineName: {
      type: String,
      default: '金额（亿元）'
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
          fontSize: 10,       // 标签字体大小
          color: '#005f73',   // 标签字体颜色，深灰色
          // distance: 5,     // 可选：标签与图形的距离
        };

        const bar = (props.barSeries || []).map((s, idx) => ({
          name: s.name,
          type: 'bar',
          data: s.data || [],
          yAxisIndex: 0,
          itemStyle: {
            color: chartColors[idx % chartColors.length]
          },
          label: barLabelOption // ▼▼▼ 为每个bar系列应用label配置 ▼▼▼
        }));

        const customLineColor = '#ee9b00';
        const line = {
          name: props.lineSeries?.name || '折线',
          type: 'line',
          data: props.lineSeries?.data || [],
          yAxisIndex: 1,
          symbol: 'circle',
          lineStyle: { // ▼▼▼ 修改这里：为线条设置颜色 ▼▼▼
            width: 3,
            color: customLineColor 
          },
          itemStyle: { // ▼▼▼ 修改这里：为数据点标记物设置颜色，通常与线条颜色一致 ▼▼▼
            color: customLineColor
          }
        };

        chartOption.value = {
          color: chartColors,
          tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'shadow' }
          },
          legend: { top: 10 },
          grid: {
            left: '3%',
            right: '4%',
            bottom: '3%',
            containLabel: true
          },
          xAxis: {
            type: 'category',
            data: props.categories || [],
            axisLabel: {
              fontSize: 12,
              rotate: 0,
              formatter: val => (val.length > 6 ? val.slice(0, 6) + '…' : val)
            }
          },
          yAxis: [
            {
              type: 'value',
              name: props.yAxisBarName,
              min: 0,                  // 设置最小值为 0
              max: 100,                // 设置最大值为 100
              interval: 20,            // 设置刻度间隔为 20
              nameLocation: 'middle',
              nameGap: 45,
              nameTextStyle: { fontSize: 14 }
            },
            {
              type: 'value',
              name: props.yAxisLineName,
              nameLocation: 'middle',
              nameGap: 45,
              nameTextStyle: { fontSize: 14 }
            }
          ],
          series: [...bar, line]
        };

        loading.value = false;
      }, 500);
    };

    watch(
      () => [props.barSeries, props.lineSeries, props.categories],
      updateChart,
      { immediate: true, deep: true }
    );

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
  margin-bottom: 20px;
  width: 100%;
  min-width: 0px;
}

.chart-title {
  font-size: 18px;
  font-weight: bold;
  margin: 20px 0;
  text-align: center;
  color: #003049;
}
</style>
