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
          formatter: '{c}',
          fontSize: 12,       // 标签字体大小
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
        const actualLineSeriesName = props.lineSeries?.name || '折线';
        const line = {
          name: actualLineSeriesName, // 使用这个名称
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
            axisPointer: { type: 'shadow' },
            formatter: function (params) {
              let tooltipContent = '';
              if (params && params.length > 0) {
                // params[0].name 是X轴的类目名 (例如 'Q1')
                // params[0].axisValueLabel 也是X轴的类目名，更推荐使用这个
                tooltipContent += (params[0].axisValueLabel || params[0].name) + '<br />'; 
                
                params.forEach(param => {
                  // param 是每个系列在该点的数据对象
                  // param.seriesName 是系列名 (例如 "数据资源入表数量", "数据资源入表总额")
                  // param.value 是数据值
                  // param.marker 是图例颜色块的HTML标记

                  let valueToShow = param.value; // 默认直接显示值

                  // 判断是否是金额系列 (折线图系列)
                  if (param.seriesName === actualLineSeriesName) {
                    const num = parseFloat(param.value);
                    if (!isNaN(num)) {
                      valueToShow = num.toFixed(2); // 金额保留两位小数
                    } else if (param.value == null) {
                        valueToShow = '-'; // 处理 null 或 undefined
                    } else {
                        valueToShow = String(param.value); // 如果不是数字，原样显示
                    }
                  } else {
                    // 其他系列（例如柱状图的数量），可以格式化为整数
                    const num = parseFloat(param.value);
                    if (!isNaN(num)) {
                      valueToShow = num.toFixed(0); // 数量取整
                    } else if (param.value == null) {
                        valueToShow = '—';
                    } else {
                        valueToShow = String(param.value);
                    }
                  }
                  tooltipContent += param.marker + ' ' + param.seriesName + ': <b>' + valueToShow + '</b><br />';
                });
              }
              return tooltipContent;
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
              max: 120,                // 设置最大值为 100
              interval: 20,            // 设置刻度间隔为 20
              nameLocation: 'middle',
              nameGap: 45,
              nameTextStyle: { fontSize: 14 }
            },
            {
              type: 'value',
              name: props.yAxisLineName,
              min: 0,                  // 设置最小值为 0
              max: 24,                // 设置最大值为 100
              interval: 4,            // 设置刻度间隔为 20
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
