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
          formatter: function (params) {
            if (params.value == null || isNaN(parseFloat(params.value))) { // 增加 parseFloat 检查
              return ''; // 如果值是 null, undefined 或无法转为数字，显示空
            }
            const value = parseFloat(params.value);
            // 检查 props.chartTitle 是否存在并且包含“金额”
            if (props.chartTitle && props.chartTitle.includes("亿")) {
              return value.toFixed(2); // 金额类，保留两位小数
            } else {
              return value.toFixed(0); // 其他（如数量类），取整数
            }
          },
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
            axisPointer: { type: 'shadow' },
            formatter: function (params) {
              let tooltipString = '';
              if (params && params.length > 0) {
                // 获取X轴类目名
                tooltipString = params[0].axisValueLabel || params[0].name; 
                tooltipString += '<br/>';
              }
              
              // 判断当前图表是否是“金额”相关图表
              // 我们继续使用 props.chartTitle.includes('金额') 作为判断依据
              // 如果你的“金额”图表标题中更统一地使用“亿”作为标识，也可以用 props.chartTitle.includes('亿')
              const isAmountChart = props.chartTitle && props.chartTitle.includes('金额'); 

              params.forEach(param => {
                let valueToShow = param.value; // ECharts 提供的原始值
                
                if (valueToShow != null && !isNaN(parseFloat(valueToShow))) {
                  const num = parseFloat(valueToShow);
                  if (isAmountChart) {
                    valueToShow = num.toFixed(2); // 金额类，保留两位小数
                  } else {
                    valueToShow = num.toFixed(0); // 其他（如数量类），取整数
                  }
                } else if (valueToShow == null) { // 处理 null 或 undefined
                  valueToShow = '—'; 
                } else {
                  valueToShow = String(valueToShow); // 如果不是有效数字且非null，原样显示
                }
                
                // 构建每条系列信息的字符串，不加粗，默认对齐
                tooltipString += param.marker + ' ' + param.seriesName + ': ' + valueToShow + '<br/>';
              });
              return tooltipString;
            }
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
              fontSize: 11,
              rotate: 0,
              interval: 0,
              rich: {
                customStyle: {
                  lineHeight: 20 // ✅ 设置你想要的行间距（单位是像素）
                }
              },
              formatter: (value) => { // value 就是原始的类别名，如 '个人', '中央'等
                const chartTitle = props.chartTitle; // 获取当前图表的标题

                if (chartTitle === 'A股数据资源入表公司分实控人分布情况') {
                  // 这是“实控人”图表，应用新的标签
                  switch (value) {
                    case '个人':
                      return '{customStyle|个人}'; // 如果只有一行，也用 rich text 保证样式一致性
                    case '中央':
                      // 使用 \n 进行换行，ECharts rich text 会处理
                      return '{customStyle|中央}\n{customStyle|（国资委、中央国家机关、中央国有企业）}';
                    case '地方':
                      return '{customStyle|地方}\n{customStyle|（地方国资委、地方政府、地方国有企业）}';
                    case '其他':
                      return '{customStyle|其他}\n{customStyle|（大学、个人境外、境外）}';
                    default:
                      return `{customStyle|${value}}`; // 对于未匹配到的，也应用样式
                  }
                } else if (chartTitle === 'A股数据资源入表公司分行业分布情况') {
                  // 您已有的针对“行业分布”图表的换行逻辑
                  const lines = value.match(/.{1,6}/g) || [value];
                  return lines.map(line => `{customStyle|${line}}`).join('\n');
                } else {
                  // 其他图表，直接返回原始标签值 (或者也应用 customStyle)
                  return value; // 或者 return `{customStyle|${value}}`;
                }
              }
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
        nextTick(() => {
          if (vueChartRef.value && vueChartRef.value.chart) {
            // console.log(`[${props.chartTitle}] Resizing GroupedBarChart after update`); // 调试日志
            vueChartRef.value.chart.resize();
          } else if (vueChartRef.value && typeof vueChartRef.value.resize === 'function') {
            // console.log(`[${props.chartTitle}] Resizing GroupedBarChart component after update`); // 调试日志
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
