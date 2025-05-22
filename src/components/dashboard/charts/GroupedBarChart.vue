<template>
  <div class="chart-wrapper" style="position: relative;">
    <div class="chart-title">{{ chartTitle }}</div>
    <ChartSpinner :visible="loading" />
    <v-chart :option="chartOption" style="width: 100%; height: 440px;" />
  </div>
</template>

<script>
import { defineComponent, ref, watch } from 'vue';
import VChart from 'vue-echarts';
import ChartSpinner from '@/components/common/ChartSpinner.vue';
import chartColors from '@/utils/chartColors.js';

export default defineComponent({
  name: 'GroupedBarChart',
  components: {
    VChart,
    ChartSpinner
  },
  props: {
    chartTitle: {
      type: String,
      default: 'Grouped Bar Chart'
    },
    chartData: {
      type: Array,
      default: () => [] // ✅ 加默认值，避免 undefined
    },
    rowKey: {
      type: String,
      default: '类别'
    },
    valKey: {
      type: String,
      default: 'value'
    }
  },
  setup(props) {
    const chartOption = ref({});
    const loading = ref(false);

    const updateChart = () => {
      // 在 GroupedBarChart.vue 的 setup -> updateChart 方法开头
      console.log(`GroupedBarChart [${props.chartTitle}] received chartData:`, JSON.parse(JSON.stringify(props.chartData)));
      console.log(`GroupedBarChart [${props.chartTitle}] rowKey: ${props.rowKey}, valKey: ${props.valKey}`);

      loading.value = true;

      setTimeout(() => {
        // ✅ 加默认值防御
        const data = props.chartData || [];

        const numSeries = data.length; // 获取实际的系列数量，例如4个 (Q1-Q4)
          let  colorPaletteForChart = [...chartColors]; // 默认使用原始颜色列表

          if (numSeries > 0) {
              // 确保我们只使用实际系列数量对应的颜色，并反转它们
              // 例如，如果有4个系列，chartColors是[c1,c2,c3,c4,c5]，那么activeColors是[c1,c2,c3,c4]
              // reversedActiveColors 就是 [c4,c3,c2,c1]
              // 这样，第一个系列(Q1)将使用c4，最后一个系列(Q4)将使用c1
              const activeColors = chartColors.slice(0, numSeries);
              colorPaletteForChart = [...activeColors].reverse(); 
          }

        // 1. 提取所有唯一类目
        const categoriesSet = new Set();
        data.forEach(series => {
          (series.data || []).forEach(item => {
            categoriesSet.add(item[props.rowKey]);
          });
        });
        const categories = Array.from(categoriesSet);

        const barLabelOption = {
          show: true,         // 是否显示标签
          position: 'top',    // 标签的位置，'top'表示在柱子顶部
          formatter: '{c}',   // 标签内容格式器：{c}会自动显示该数据点的值
          fontSize: 10,       // 标签字体大小
          color: '#005f73',   // 标签字体颜色，深灰色
          // distance: 5,     // 可选：标签与图形的距离
        };

        // 2. 构建每个 series 的 data（对齐 categories）
        const seriesData = data.map((series, idx) => {
          const dataMap = Object.fromEntries(
            (series.data || []).map(item => [item[props.rowKey], item[props.valKey]])
          );
          const alignedData = categories.map(c => dataMap[c] || 0);
          return {
            name: series.name,
            type: 'bar',
            data: alignedData,
            barGap: 0,
            barCategoryGap: '50%',
            itemStyle: {
              color: colorPaletteForChart[idx % colorPaletteForChart.length]
            },
            label: barLabelOption
          };
        });

        chartOption.value = {
          color: colorPaletteForChart, 
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
            data: categories,
            axisLabel: {
              fontSize: 12,
              rotate: 0,
              formatter: val => (val.length > 6 ? val.slice(0, 6) + '…' : val)
            }
          },
          yAxis: {
            type: 'value',
            name: '数量（个）',
            nameLocation: 'middle',
            nameGap: 50,
            nameTextStyle: { fontSize: 14 }
          },
          series: seriesData
        };

        loading.value = false;
      }, 300);
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
  margin-bottom: 20px;
  width: 100%;
  min-width: 0;
}

.chart-title {
  font-size: 18px;
  font-weight: bold;
  margin: 20px 0;
  text-align: center;
  color: #003049;
}
</style>
