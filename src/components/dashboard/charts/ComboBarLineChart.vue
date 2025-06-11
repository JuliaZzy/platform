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
    },
    // ▼▼▼ 新增代码开始 ▼▼▼
    // 左侧 Y 轴（柱状图）的最大值
    yAxisBarMax: {
        type: Number,
        default: 120
    },
    // 左侧 Y 轴（柱状图）的刻度间隔
    yAxisBarInterval: {
        type: Number,
        default: 20
    },
    // 右侧 Y 轴（折线图）的最大值
    yAxisLineMax: {
        type: Number,
        default: 24
    },
    // 右侧 Y 轴（折线图）的刻度间隔
    yAxisLineInterval: {
        type: Number,
        default: 4
    },
    // ▼▼▼ 新增代码开始 ▼▼▼
    // 用于图表注释的文本，可选
    chartAnnotation: {
      type: String,
      default: '' // 默认值为空字符串
    },

    // ▼▼▼ 新增代码开始 ▼▼▼
    // 用于控制图表组件的整体高度
    chartHeight: {
      type: Number,
      default: 440 // 默认高度为 440px
    }
    // ▲▲▲ 新增代码结束 ▲▲▲
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

        const lineLabelOption = {
          show: true,         // 是否显示标签
          position: 'right',    // 标签的位置，'top'表示在柱子顶部
          offset: [3, -25],
          distance: 8,
          formatter: function (params) {
            // 检查 null/undefined 或无法转换为数字的情况
            if (params.value == null || isNaN(parseFloat(params.value))) { 
              return ''; // 返回空字符串
            }
            // 转换为数字并格式化
            const value = parseFloat(params.value);
            return value.toFixed(2); // 保留两位小数
          }, // <--- 在这里加上逗号 ,
          fontSize: 12,       // 标签字体大小
          color: '#ee9b00',   // 标签字体颜色，深灰色
          // distance: 5,     // 可选：标签与图形的距离
        };

        const line = {
          name: actualLineSeriesName, // 使用这个名称
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
            bottom: '60px',
            containLabel: true
          },
          xAxis: {
            type: 'category',
            data: props.categories || [],
            axisLabel: {
              fontSize: 11,
              rotate: 0,
              interval: 0,
              formatter: val => (val.length > 6 ? val.slice(0, 6) + '…' : val)
            }
          },
          yAxis: [
            {
              type: 'value',
              name: props.yAxisBarName,
              min: 0,
              max: props.yAxisBarMax,
              interval: props.yAxisBarInterval,
              nameLocation: 'middle',
              nameGap: 45,
              nameTextStyle: { fontSize: 14 }
            },
            {
              type: 'value',
              name: props.yAxisLineName,
              min: 0,
              max: props.yAxisLineMax,
              interval: props.yAxisLineInterval,
              nameLocation: 'middle',
              nameGap: 45,
              nameTextStyle: { fontSize: 14 }
            }
          ],
          series: [...bar, line]
        };

        // ▼▼▼ 新增代码开始 ▼▼▼
        // 如果父组件传入了注释文本，则添加 graphic 配置
        if (props.chartAnnotation) {
          chartOption.value.graphic = {
            type: 'text', // 类型为文本
            left: 'center',   // 位置：距离左侧 10%
            bottom: 25,    // 位置：距离底部 25px
            style: {
              text: props.chartAnnotation, // 使用传入的文本
              fill: '#BDA36C',               // 文本颜色
              fontSize: 12,               // 字体大小
              textAlign: 'center', // 文本内容也居中

              // ▼▼▼ 限制宽度和自动换行 ▼▼▼
              width: '30%',      // 设置宽度为父容器的 30%
              overflow: 'break', // 超出宽度时自动换行
              lineHeight: 18     // 可选：调整行高，使换行文本更易读
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
