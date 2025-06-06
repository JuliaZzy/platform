<template>
  <div class="chart-wrapper" style="position: relative;">
    <div class="chart-title">{{ chartTitle }}</div>
    <ChartSpinner :visible="loading" />
    <v-chart 
      ref="vueChartRef"
      :option="chartOption" 
      style="width: 100%; height: 440px;" 
    />
  </div>
</template>

<script>
import { defineComponent, ref, watch, nextTick } from 'vue';
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
    },
    yAxisName: {
      type: String,
      default: '入表企业数量（家）'
    }
  },
  setup(props) {
    const chartOption = ref({});
    const loading = ref(false);
    const vueChartRef = ref(null);

    const updateChart = () => {
      loading.value = true;

      setTimeout(() => {
        const data = props.chartData || [];

        if (data.length === 0) {
          chartOption.value = {};
          loading.value = false;
          return;
        }

        // ✅ 步骤 A: 恢复颜色和柱顶标签的定义
        // 恢复颜色定义
        const numSeries = data.length;
        let colorPaletteForChart = [...chartColors];
        if (numSeries > 0) {
          const activeColors = chartColors.slice(0, numSeries);
          colorPaletteForChart = [...activeColors].reverse();
        }

        // 恢复柱顶标签定义
        const barLabelOption = {
          show: true,
          position: 'top',
          formatter: function (params) {
            if (params.value == null || isNaN(parseFloat(params.value))) {
              return '';
            }
            const value = parseFloat(params.value);
            if (props.chartTitle && props.chartTitle.includes("亿")) {
              return value.toFixed(2);
            } else {
              return value.toFixed(0);
            }
          },
          fontSize: 10,
          color: '#005f73',
        };

        // 步骤 1: 提取 categories (此逻辑正确)
        // 父组件已保证 data[0].data 存在且顺序正确
        const categories = data[0].data.map(item => item[props.rowKey]);

        // 步骤 2: 构建 series
        const seriesData = data.map((series, idx) => {
          return {
            name: series.name,
            type: 'bar',
            data: series.data.map(item => item[props.valKey]),
            barGap: 0,
            barCategoryGap: '50%',
            // ✅ 步骤 B: 恢复 itemStyle 和 label
            itemStyle: {
              color: colorPaletteForChart[idx % colorPaletteForChart.length]
            },
            label: barLabelOption
          };
        });
        
        // 步骤 3: 组装最终的 chartOption (此逻辑正确)
        chartOption.value = {
          // color, tooltip, legend, grid, xAxis, yAxis 等所有配置都从您之前的文件中恢复
          color: colorPaletteForChart,
          tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'shadow' },
            formatter: function (params) {
              let tooltipString = '';
              if (params && params.length > 0) {
                tooltipString = params[0].axisValueLabel || params[0].name;
                tooltipString += '<br/>';
              }
              const isAmountChart = props.chartTitle && props.chartTitle.includes('金额');
              params.forEach(param => {
                let valueToShow = param.value;
                if (valueToShow != null && !isNaN(parseFloat(valueToShow))) {
                  const num = parseFloat(valueToShow);
                  valueToShow = isAmountChart ? num.toFixed(2) : num.toFixed(0);
                } else if (valueToShow == null) {
                  valueToShow = '—';
                } else {
                  valueToShow = String(valueToShow);
                }
                tooltipString += param.marker + ' ' + param.seriesName + ': ' + valueToShow + '<br/>';
              });
              return tooltipString;
            }
          },
          legend: { top: 10 },
          grid: {
            left: '10%',
            right: '4%',
            bottom: '3%',
            containLabel: true
          },
          xAxis: {
            type: 'category',
            data: categories,
            axisLabel: {
              fontSize: 11,
              rotate: 0,
              interval: 0,
              rich: { customStyle: { lineHeight: 20 } },
              formatter: (value) => {
                const chartTitle = props.chartTitle;
                if (chartTitle === 'A股数据资源入表公司分实控人分布情况') {
                  switch (value) {
                    case '个人': return '{customStyle|个人}';
                    case '中央': return '{customStyle|中央}\n{customStyle|（国资委、中央国家机关、中央国有企业）}';
                    case '地方': return '{customStyle|地方}\n{customStyle|（地方国资委、地方政府、地方国有企业）}';
                    case '其他': return '{customStyle|其他}\n{customStyle|（大学、个人境外、境外）}';
                    default: return `{customStyle|${value}}`;
                  }
                } else if (chartTitle === 'A股数据资源入表公司分行业分布情况') {
                  const lines = value.match(/.{1,6}/g) || [value];
                  return lines.map(line => `{customStyle|${line}}`).join('\n');
                } else {
                  return value;
                }
              }
            }
          },
          yAxis: {
            type: 'value',
            name: props.yAxisName,
            nameLocation: 'middle',
            nameGap: 50,
            nameTextStyle: { fontSize: 14 }
          },
          series: seriesData
        };

        loading.value = false;
        nextTick(() => {
          if (vueChartRef.value && vueChartRef.value.chart) {
            vueChartRef.value.chart.resize();
          } else if (vueChartRef.value && typeof vueChartRef.value.resize === 'function') {
            vueChartRef.value.resize();
          }
        });
      }, 300);
    };

    watch(() => props.chartData, updateChart, { immediate: true, deep: true });

    return {
      chartOption,
      loading,
      vueChartRef
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
  width: 95%;
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
