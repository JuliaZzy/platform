<template>
  <div class="chart-wrapper" style="position: relative;">
    <div class="chart-title">企业数量按省份分布</div>
    <ChartSpinner :visible="loading" />
    <v-chart
      :option="barChartOption"
      style="width: 100%; height: 360px;"
    />
  </div>
</template>

<script>
import { defineComponent } from 'vue';
import VChart from 'vue-echarts';
import ChartSpinner from '@/components/common/ChartSpinner.vue';
import chartColors from '@/utils/chartColors.js';

import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { BarChart } from 'echarts/charts';
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent
} from 'echarts/components';

use([
  CanvasRenderer,
  BarChart,
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent
]);

export default defineComponent({
  name: 'BarChart1',
  components: {
    VChart,
    ChartSpinner
  },
  props: {
    chartData: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      barChartOption: {},
      loading: false
    };
  },
  watch: {
    chartData: {
      handler() {
        this.updateChart();
      },
      immediate: true
    }
  },
  methods: {
    updateChart() {
      this.loading = true;
      setTimeout(() => {
        const barLabelOption = {
          show: true,         // 是否显示标签
          position: 'top',    // 标签的位置，'top'表示在柱子顶部
          formatter: '{c}',   // 标签内容格式器：{c}会自动显示该数据点的值
          fontSize: 10,       // 标签字体大小
          color: '#005f73',   // 标签字体颜色，深灰色
          // distance: 5,     // 可选：标签与图形的距离
        };
        // 模拟加载时间，真实项目中可替换为 await axios 逻辑
        this.barChartOption = {
          color: chartColors,
          tooltip: {},
          xAxis: {
            type: 'category',
            data: this.chartData.map(item => item.name),
            axisLabel: {
              rotate: 0,
              formatter: val => val.length > 6 ? val.slice(0, 6) + '…' : val
            }
          },
          yAxis: {
            type: 'value',
            name: '入表企业数量（家）',
            nameLocation: 'middle',
            nameGap: 40,
            nameTextStyle: { fontSize: 12 }
          },
          series: [{
            type: 'bar',
            data: this.chartData.map(item => item.value)
          }],
          label: barLabelOption
        };
        this.loading = false;
      }, 500);
    }
  }
});
</script>


<style scoped>
.chart-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 0;
  min-width: 1000px;
}

.chart-title {
  font-size: 18px;
  font-weight: bold;
  margin: 20px 0;
  text-align: center;
  color: #003049;
}
</style>
