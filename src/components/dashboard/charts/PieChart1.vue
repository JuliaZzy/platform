<template>
  <div class="chart-wrapper" style="position: relative;">
    <div class="chart-title">企业数量按企业类型分布</div>
    <ChartSpinner :visible="loading" />
    <v-chart
      :option="chartOption"
      style="width: 100%; height: 360px;"
    />
  </div>
</template>

<script>
import { defineComponent, watch, ref, onMounted } from 'vue';
import VChart from 'vue-echarts';
import ChartSpinner from '@/components/common/ChartSpinner.vue';
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
import { use } from 'echarts/core';
import chartColors from '@/utils/chartColors.js';
import axios from 'axios';

use([
  CanvasRenderer,
  PieChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GraphicComponent
]);

export default defineComponent({
  name: 'PieChart1',
  components: {
    VChart,
    ChartSpinner
  },
  props: {
    chartData: {
      type: Array,
      required: true
    },
    filters: {
      type: Object,
      required: true
    },
    mode: {
      type: String,
      default: 'nls'
    }
  },
  setup(props) {
    const chartOption = ref({});
    const loading = ref(false);

    const buildChart = async () => {
      loading.value = true;
      const parentData = props.chartData || [];
      const targetCompanyType = '地方国企';
      const apiPath = props.mode === 'ls' ? '/api/lasset/summary' : '/api/nlasset/summary';

      try {
        const res = await axios.post(apiPath, {
          filters: {
            ...props.filters,
            company_type: targetCompanyType
          },
          page: 1,
          pageSize: 1
        });

        const childData = res.data.charts?.admin_level || [];

        chartOption.value = {
          color: chartColors,
          tooltip: { trigger: 'item' },
          legend: { show: false },
          series: [
            {
              name: '企业类型',
              type: 'pie',
              radius: '50%',
              center: ['35%', '35%'],
              label: {
                show: true,
                formatter: ({ name, value }) => `${name}: ${value}`,
                position: 'outside'
              },
              startAngle: 145, // ✅ 逆时针旋转 45°
              labelLine: { show: true },
              data: parentData
            },
            {
              name: '行政级别',
              type: 'pie',
              radius: '40%',
              center: ['65%', '35%'],
              label: {
                show: true,
                formatter: ({ name, value }) => `${name}: ${value}`,
                position: 'inside'
              },
              labelLine: { show: true },
              data: childData
            }
          ],
          graphic: [
            {
              type: 'line',
              shape: { x1: 495, y1: 36, x2: 925, y2: 54 },
              style: { stroke: '#888', lineWidth: 1 }
            },
            {
              type: 'line',
              shape: { x1: 495, y1: 216, x2: 925, y2: 198 },
              style: { stroke: '#888', lineWidth: 1 }
            }
          ]
        };
      } catch (err) {
        console.error('❌ 加载 PieChart1 数据失败:', err);
      } finally {
        loading.value = false;
      }
    };

    onMounted(buildChart);
    watch(() => props.chartData, buildChart, { deep: true });
    watch(() => props.filters, buildChart, { deep: true });

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
