<template>
  <div class="chart-wrapper">
    <div class="chart-title">各企业类型与行政级别占比</div>
    <v-chart :option="chartOption" style="width: 100%; height: 360px;" />
  </div>
</template>

<script>
import { defineComponent } from 'vue';
import { use } from 'echarts/core';
import VChart from 'vue-echarts';
import {
  CanvasRenderer
} from 'echarts/renderers';
import {
  PieChart
} from 'echarts/charts';
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GraphicComponent
} from 'echarts/components';
import axios from 'axios';
import chartColors from '@/utils/chartColors.js';

use([
  CanvasRenderer,
  PieChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GraphicComponent
]);

export default defineComponent({
  name: 'LSPieChart1',
  components: { VChart },
  props: {
    filters: {
      type: Object,
      required: true  // 可选，表示必须由父组件传值
    }
  },
  data() {
    return {
      chartOption: {}
    };
  },
  mounted() {
    this.loadData();
  },
  watch: {
    filters: {
      handler() {
        this.loadData();
      },
      immediate: true,
      deep: true
    }
  },
  methods: {
    async loadData() {
      try {
        const parentRes = await axios.post('/api/lasset/stats', {
          field: 'company_type',
          filters: this.filters
        });
        const parentData = parentRes.data;

        const childRes = await axios.post('/api/lasset/stats', {
          field: 'admin_level',
          filters: {
            ...this.filters,
            company_type: '地方国企'
          }
        });
        const childData = childRes.data;

        this.chartOption = {
          color: chartColors,
          tooltip: { trigger: 'item' },
          legend: { show: false },
          series: [
            {
              name: '企业类型',
              type: 'pie',
              radius: '50%',
              center: ['25%', '50%'],
              label: {
                show: true,
                formatter: (params) => `${params.name}: ${params.value}`,
                position: 'outside'
              },
              labelLine: { show: true },
              data: parentData
            },
            {
              name: '行政级别',
              type: 'pie',
              radius: '40%',
              center: ['75%', '50%'],
              label: {
                show: true,
                formatter: (params) => `${params.name}: ${params.value}`,
                position: 'inside'
              },
              labelLine: { show: true },
              data: childData
            }
          ],
          graphic: [
            {
              type: 'line',
              shape: { x1: 150, y1: 90, x2: 455, y2: 108 },
              style: { stroke: '#888', lineWidth: 1 }
            },
            {
              type: 'line',
              shape: { x1: 150, y1: 270, x2: 455, y2: 252 },
              style: { stroke: '#888', lineWidth: 1 }
            }
          ]
        };
      } catch (error) {
        console.error('加载图表数据失败:', error);
      }
    }
  }
});
</script>

<style scoped>
.chart-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  /* ❌ 无背景、padding、边框等 */
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
