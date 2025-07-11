<template>
  <div class="chart-wrapper" style="position: relative;">
    <div class="chart-title">{{ chartTitle }}</div>
    <ChartSpinner :visible="loading" />
    <v-chart
      v-if="!loading && chartOption.series && chartOption.series.length"
      :option="chartOption"
      :style="{ width: '100%', height: chartHeight + 'px' }"
    />
  </div>
</template>

<script>
import { defineComponent, ref, watch, computed } from 'vue';
import { useResponsiveCharts } from '@/utils/useResponsiveCharts.js';
import VChart from 'vue-echarts';
import ChartSpinner from '@/components/common/ChartSpinner.vue';
import chartColors from '@/utils/chartColors.js';

/**
 * 插入换行符
 * @param {string} str
 * @param {number} charsPerLine
 * @returns {string}
 */
function wordWrap(str, charsPerLine) {
  if (!str) return '';
  const regex = new RegExp(`.{1,${charsPerLine}}`, 'g');
  const lines = str.match(regex);
  return lines ? lines.join('\n') : str;
}

export default defineComponent({
  name: 'ComboBarLineChart',
  components: {
    VChart,
    ChartSpinner
  },
  props: {
    chartTitle: { type: String, default: '柱状图 + 折线图' },
    categories: { type: Array, default: () => [] },
    barSeries: { type: Array, default: () => [] },
    lineSeries: { type: Object, default: () => ({ name: '折线', data: [] }) },
    yAxisBarName: { type: String, default: '数量（个）' },
    yAxisLineName: { type: String, default: '金额（亿元）' },
    yAxisBarMax: { type: Number, default: 120 },
    yAxisBarInterval: { type: Number, default: 20 },
    yAxisLineMax: { type: Number, default: 24 },
    yAxisLineInterval: { type: Number, default: 4 },
    chartAnnotation: { type: String, default: '' },
    chartHeight: { type: Number, default: 440 }
  },
  setup(props) {
    const { isMobile } = useResponsiveCharts();
    const chartOption = ref({});
    const loading = ref(false);

    const updateChart = () => {
      loading.value = true;
      setTimeout(() => {
        const gridConfig = {
          left: '3%',
          right: '4%',
          bottom: isMobile.value ? '20%' : '60px',
          containLabel: true
        };
        const xAxisLabelConfig = {
          fontSize: isMobile.value ? 9 : 11,
          interval: 0,
          // formatter: val => (val.length > 6 ? val.slice(0, 6) + '…' : val),
          align: 'center'
        };

        const yAxisBarNameFormatted = computed(() => {
          if (isMobile.value) {
            return props.yAxisBarName;//.replace('数量', '\n数量')
          }
          return props.yAxisBarName;
        });
        const yAxisLineNameFormatted = computed(() => {
          if (isMobile.value) {
            return props.yAxisLineName;//.replace('金额', '\n金额');
          }
          return props.yAxisLineName;
        });
        const yAxisNameGap = isMobile.value ? 10 : 45;
        const yAxisNameTextStyle = {
            fontSize: isMobile.value ? 10 : 14,
            padding: isMobile.value ? [0, 0, 0, 40] : [0, 0, 0, 0] // 左Y轴标题向左偏移
        };
        const yAxisNameTextStyleRight = {
            fontSize: isMobile.value ? 10 : 14,
            padding: isMobile.value ? [0, 0, 0, -40] : [0, 0, 0, 0] // 右Y轴标题向右偏移
        };

        const annotationBottom = isMobile.value ? '8%' : 25;
        const annotationWidth = isMobile.value ? '70%' : '100%';

        const barLabelOption = {
          show: true,
          position: 'top',
          formatter: '{c}',
          fontSize: isMobile.value ? 10 : 12,
          color: '#005f73',
        };

        const bar = (props.barSeries || []).map((s, idx) => ({
          name: s.name,
          type: 'bar',
          data: s.data || [],
          yAxisIndex: 0,
          itemStyle: {
            color: chartColors[idx % chartColors.length]
          },
          label: barLabelOption
        }));

        const customLineColor = '#ee9b00';
        const actualLineSeriesName = props.lineSeries?.name || '折线';

        const lineLabelOption = {
          show: true,
          position: isMobile.value ? 'left' : 'right', 
          offset: isMobile.value ? [10, -10] : [3, -25],
          distance: 8,
          formatter: function (params) {
            if (params.value == null || isNaN(parseFloat(params.value))) { 
              return '';
            }
            // 转换为数字并格式化
            const value = parseFloat(params.value);
            return value.toFixed(2);
          },
          fontSize: isMobile.value ? 10 : 12,
          color: '#ee9b00',
        };

        const line = {
          name: actualLineSeriesName,
          type: 'line',
          data: props.lineSeries?.data || [],
          yAxisIndex: 1,
          symbol: 'circle',
          lineStyle: {
            width: 3,
            color: customLineColor 
          },
          itemStyle: {
            color: customLineColor
          },
          label: lineLabelOption
        };

        chartOption.value = {
          color: chartColors,
          tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'shadow' },
            formatter: function (params) {
              let tooltipContent = '';
              if (params && params.length > 0) {
                tooltipContent += (params[0].axisValueLabel || params[0].name) + '<br />'; 
                params.forEach(param => {
                  let valueToShow = param.value;
                  if (param.seriesName === actualLineSeriesName) {
                    const num = parseFloat(param.value);
                    if (!isNaN(num)) valueToShow = num.toFixed(2);
                    else if (param.value == null) valueToShow = '-';
                    else valueToShow = String(param.value);
                  } else {
                    const num = parseFloat(param.value);
                    if (!isNaN(num)) valueToShow = num.toFixed(0);
                    else if (param.value == null) valueToShow = '—';
                    else valueToShow = String(param.value);
                  }
                  tooltipContent += param.marker + ' ' + param.seriesName + ': <b>' + valueToShow + '</b><br />';
                });
              }
              return tooltipContent;
            }
          },
          legend: { top: 10 },

          grid: gridConfig,

          xAxis: {
            type: 'category',
            data: props.categories || [],
            axisLabel: xAxisLabelConfig
          },
          yAxis: [
            {
              type: 'value', 
              name: yAxisBarNameFormatted.value, 
              min: 0, max: props.yAxisBarMax,
              interval: props.yAxisBarInterval, 
              nameGap: yAxisNameGap,
              nameLocation: isMobile.value ? 'end' : 'middle',
              nameTextStyle: yAxisNameTextStyle,
              axisLabel: {
                fontSize: isMobile.value ? 9 : 12
              }
            },
            {
              type: 'value', 
              name: yAxisLineNameFormatted.value, 
              min: 0, max: props.yAxisLineMax,
              interval: props.yAxisLineInterval, 
              nameGap: yAxisNameGap,
              nameLocation: isMobile.value ? 'end' : 'middle',
              nameTextStyle: yAxisNameTextStyleRight,
              axisLabel: {
                fontSize: isMobile.value ? 9 : 12
              }
            }
          ],
          series: [...bar, line]
        };

        if (props.chartAnnotation) {
          const charsPerLine = isMobile.value ? 30 : 60;
          const wrappedAnnotationText = wordWrap(props.chartAnnotation, charsPerLine);

          chartOption.value.graphic = {
            type: 'text',
            left: 'center',
            bottom: annotationBottom,
            style: {
              text: wrappedAnnotationText,
              fill: '#BDA36C',
              fontSize: isMobile.value ? 9 : 12,
              textAlign: 'center',
              lineHeight: isMobile.value ? 12 : 18,
              width: annotationWidth 
            }
          };
        }

        loading.value = false;
      }, 500);
    };

    watch(
      () => [props.barSeries, props.lineSeries, props.categories],
      updateChart,
      { immediate: true, deep: true }
    );
    
    watch(isMobile, updateChart);

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
  width: 90%;
  min-width: 0px;
  margin: 20px auto; 
}

.chart-title {
  font-size: 18px;
  font-weight: bold;
  margin: 20px 0;
  text-align: center;
  color: #2e3968;
}

</style>
