<template>
  <div class="chart-wrapper">
    <div class="chart-title">各省份企业数量</div>
    <v-chart :option="barChartOption" style="width: 100%; height: 360px;" />
  </div>
</template>

<script>
import { defineComponent } from 'vue';
import VChart from 'vue-echarts';
import axios from 'axios';
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
  name: 'LSBarChart1',
  components: { 'v-chart': VChart },
  props: ['filters'],
  data() {
    return {
      barChartOption: {}
    };
  },
  watch: {
    filters: {
      handler() {
        this.loadChart();
      },
      immediate: true,
      deep: true
    }
  },
  methods: {
    loadChart() {
      axios.post('/api/lasset/stats', {
        field: 'province_area',
        filters: this.filters
      }).then(res => {
        const chartData = res.data;
        this.barChartOption = {
          color: chartColors, // ✅ 应用统一配色
          tooltip: {},
          xAxis: {
            type: 'category',
            data: chartData.map(item => item.name),
            axisLabel: {
              rotate: 30,
              overflow: 'truncate',
              formatter: function (val) {
                return val.length > 6 ? val.slice(0, 6) + '…' : val;
              }
            }
          },
          yAxis: {
            type: 'value',
            name: '入表企业数量（家）',
            nameLocation: 'middle',
            nameGap: 40,
            nameTextStyle: {
              fontSize: 12
            }
          },
          series: [{
            type: 'bar',
            data: chartData.map(item => item.value)
          }]
        };
      }).catch(err => {
        console.error('加载图表失败:', err);
      });
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
}

.chart-title {
  font-size: 18px;
  font-weight: bold;
  margin: 20px 0;
  text-align: center;
  color: #003049;
}
</style>
