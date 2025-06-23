<template>
  <div class="chart-wrapper" style="position: relative;">
    <div class="chart-title">{{ chartTitle }}</div>
    <ChartSpinner :visible="loading" />
    <v-chart 
      ref="vueChartRef"
      :option="chartOption" 
      :style="{ width: '100%', height: chartHeight + 'px' }" 
    />
  </div>
</template>

<script>
import { defineComponent, ref, watch, nextTick, computed } from 'vue';
import { useResponsiveCharts } from '@/utils/useResponsiveCharts.js';
import VChart from 'vue-echarts';
import ChartSpinner from '@/components/common/ChartSpinner.vue';
import chartColors from '@/utils/chartColors.js';
//import { is } from 'core-js/core/object';

export default defineComponent({
  name: 'GroupedBarChart',
  components: {
    VChart,
    ChartSpinner
  },
  props: {
    chartHeight: {
      type: Number,
      default: 440
    },
    chartTitle: { type: String, default: 'Grouped Bar Chart' },
    chartData: { type: Array, default: () => [] },
    rowKey: { type: String, default: '类别' },
    valKey: { type: String, default: 'value' },
    yAxisName: { type: String, default: '入表企业数量（家）' }
  },
  setup(props) {
    const { isMobile } = useResponsiveCharts();
    const chartOption = ref({});
    const loading = ref(false);
    const vueChartRef = ref(null);

    // y轴标题
    const yAxisNameFormatted = computed(() => {
      if (isMobile.value) {
        return props.yAxisName; //.replace('数量', '\n数量');
      }
      return props.yAxisName;
    });

    const updateChart = () => {
      loading.value = true;

      setTimeout(() => {
        const data = props.chartData || [];

        if (data.length === 0) {
          chartOption.value = {};
          loading.value = false;
          return;
        }
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
          fontSize: isMobile.value ? 7 : 10,
          offset: isMobile.value ? [-2, 0] : [0, 0],
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
          color: '#005f73',
        };

        // y轴标题
        const yAxisNameTextStyle = {
          fontSize: isMobile.value ? 10 : 14,
            padding: isMobile.value ? [0, 0, 0, 20] : [0, 0, 0, 0] // 左Y轴标题向左偏移
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

        const isIndustryChart = props.chartTitle === 'A股数据资源入表公司分行业分布情况';
        const titlesToRotateOnMobile = [
          'A股数据资源入表公司分市值规模分布情况',
          'A股数据资源入表公司分区域位置分布情况'
        ];
        
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
            ...(isMobile.value
              ? {bottom: 5}
              : {top: 10}
            ),
            type: 'scroll',
            textStyle: {
              fontSize: isMobile.value ? 9 : 11
            }
          },
          grid: {
            top: isMobile.value ? '10%' : 60,
            left: '10%',
            right: '4%',
            bottom: isMobile.value ? (isProblematicChart ? '15%' : '20%') : '3%',
            containLabel: true
          },
          xAxis: {
            type: 'category',
            data: categories,
            axisLabel: {
              rotate: (isMobile.value && titlesToRotateOnMobile.includes(props.chartTitle)) ? 30 : 0,
              interval: 0,
              margin: (isMobile.value && titlesToRotateOnMobile.includes(props.chartTitle)) ? 15 : 8,
              rich: {
                customStyle: {
                  lineHeight: 20,
                  fontSize: isMobile.value ? 9 : 11
                }
              },
              align: (isMobile.value && props.chartTitle === 'A股数据资源入表公司分市值规模分布情况') ? 'right' : 'center',
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
                    return `{customStyle|${value}}`;
                  }
              }
            }
          },
          yAxis: {
            type: 'value',
            name: yAxisNameFormatted.value,
            nameLocation: isMobile.value ? 'end' : 'middle',
            nameGap: 50,
            nameTextStyle: yAxisNameTextStyle,
            axisLabel: {
            fontSize: isMobile.value ? 9 : 12
            }
          },
          series: seriesData
        };

        if (isMobile.value && (isIndustryChart || props.chartTitle === 'A股数据资源入表公司分区域位置分布情况')) {
          chartOption.value.dataZoom = [
            {
              type: 'slider',
              show: true,
              xAxisIndex: [0],
              //bottom: 10,
              start: 0,
              end: 50,
              handleSize: '30%',
              handleStyle: {
                  color: '#fff',
                  shadowBlur: 3,
                  shadowColor: 'rgba(0, 0, 0, 0.6)',
                  shadowOffsetX: 2,
                  shadowOffsetY: 2
              }
            }
          ];
        } else {
          delete chartOption.value.dataZoom;
        }

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
    watch(isMobile, updateChart);

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
