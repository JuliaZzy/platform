<template>
  <div class="chart-wrapper" style="position: relative;">
    <div class="chart-title">{{ chartTitle }}</div>
    <ChartSpinner :visible="loading" />
    <v-chart 
      ref="vueChartRef"
      :option="chartOption" 
      style="width: 90%; height: 440px;" 
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
      default: () => []
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

        const isMobile = window.innerWidth <= 768;
        const problematicTitles = [
          'A股数据资源入表公司分科目分布情况',
          'A股数据资源入表公司分实控人分布情况',
          'A股数据资源入表公司分行业分布情况'
        ];
        const isProblematicChart = problematicTitles.includes(props.chartTitle);

        const numSeries = data.length;
        let colorPaletteForChart = [...chartColors];
        if (numSeries > 0) {
          const activeColors = chartColors.slice(0, numSeries);
          colorPaletteForChart = [...activeColors].reverse();
        }

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

        const categories = data[0].data.map(item => item[props.rowKey]);

        const seriesData = data.map((series, idx) => {
          return {
            name: series.name,
            type: 'bar',
            data: series.data.map(item => item[props.valKey]),
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
          legend: {
            // --- 【修改】动态调整图例的顶部边距 ---
            top: isMobile ? 35 : 10,
            type: 'scroll' // 如果图例过多，允许滚动
          },
          grid: {
            top: isMobile ? 80 : 60,
            left: '10%',
            right: '4%',
            // 为有问题的图表提供更大的底部空间 (35%)，其他图表保持原来的空间 (20%)
            bottom: isMobile ? (isProblematicChart ? '35%' : '20%') : '3%',
            containLabel: true
          },
          xAxis: {
            type: 'category',
            data: categories,
            axisLabel: {
              rotate: isMobile ? 35 : 0,
              interval: 0,
              // 将字体大小的设置移入 rich 中，以确保对所有标签生效
              rich: {
                customStyle: {
                  lineHeight: 20,
                  fontSize: isMobile ? 8 : 11
                }
              },
              formatter: (value) => {
                  const chartTitle = props.chartTitle;
                  if (chartTitle === 'A股数据资源入表公司分实控人分布情况') {
                    switch (value) {
                      case '个人': return '{customStyle|个人}';
                      case '中央': return '{customStyle|中央}\n{customStyle|（国资委、中央\n国家机关、中央\n国有企业）}';
                      case '地方': return '{customStyle|地方}\n{customStyle|（地方国资委、\n地方政府、地方\n国有企业）}';
                      case '其他': return '{customStyle|其他}';
                      default: return `{customStyle|${value}}`;
                    }
                  } else if (chartTitle === 'A股数据资源入表公司分行业分布情况') {
                    const lines = value.match(/.{1,6}/g) || [value];
                    return lines.map(line => `{customStyle|${line}}`).join('\n');
                  } else if (chartTitle === 'A股数据资源入表公司分科目分布情况') {
                    switch (value) {
                      case '无形资产': return '{customStyle|无形资产}';
                      case '开发支出': return '{customStyle|开发支出}\n{customStyle| \n }';
                      case '存货': return '{customStyle|存货}';
                      default: return `{customStyle|${value}}`;
                    }
                  } else {
                    // 对于没有使用富文本的图表，字体大小由这里的 customStyle 控制
                    return `{customStyle|${value}}`;
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
  color: #2e3968;
}
</style>
