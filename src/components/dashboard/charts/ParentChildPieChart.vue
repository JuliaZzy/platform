<template>
  <div class="chart-wrapper">
    <div class="chart-title">企业数量按企业性质分布</div>
    <ChartSpinner :visible="loading" />
    <v-chart
      ref="pieChartRef"
      :option="chartOption"
      style="width: 100%; height: 360px;"
      autoresize
      @ready="onChartReady" />
  </div>
</template>

<script>
import { defineComponent, watch, ref, onMounted, onUnmounted, nextTick } from 'vue';
import { useResponsiveCharts } from '@/utils/useResponsiveCharts.js';
import VChart from 'vue-echarts';
import ChartSpinner from '@/components/common/ChartSpinner.vue';
import { CanvasRenderer } from 'echarts/renderers';
import { PieChart } from 'echarts/charts';
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
  name: 'ParentChildPieChart',
  components: {
    VChart,
    ChartSpinner
  },
  props: {
    chartData: { type: Array, required: true },
    filters: { type: Object, required: true },
    mode: { type: String, default: 'nls' }
  },
  setup(props) {
    const { isMobile } = useResponsiveCharts();
    const chartOption = ref({});
    const loading = ref(false);
    const pieChartRef = ref(null);
    let chartInstance = null;
    let parentPieData = [];
    let childPieData = [];

    const updateConnectingLines = () => {
      if (!chartInstance) { return; }
      if (!chartOption.value.series || chartOption.value.series.length < 2) { return; }
      const W = chartInstance.getWidth();
      const H = chartInstance.getHeight();
      if (!W || !H || W <= 0 || H <= 0) { return; }
      
      try {
        const pie1Cfg = chartOption.value.series[0];
        const p1c_x_pct = parseFloat(pie1Cfg.center[0]) / 100;
        const p1c_y_pct = parseFloat(pie1Cfg.center[1]) / 100;
        const p1r_str = pie1Cfg.radius;
        let p1RadiusPixels = (typeof p1r_str === 'string' && p1r_str.endsWith('%')) 
          ? (parseFloat(p1r_str) / 100) * (Math.min(W, H) / 2) 
          : parseFloat(p1r_str);
        const p1_center_x = p1c_x_pct * W;
        const p1_center_y = p1c_y_pct * H;

        const pie2Cfg = chartOption.value.series[1];
        const p2c_x_pct = parseFloat(pie2Cfg.center[0]) / 100;
        const p2c_y_pct = parseFloat(pie2Cfg.center[1]) / 100;
        const p2r_str = pie2Cfg.radius;
        let p2RadiusPixels = (typeof p2r_str === 'string' && p2r_str.endsWith('%')) 
          ? (parseFloat(p2r_str) / 100) * (Math.min(W, H) / 2) 
          : parseFloat(p2r_str);
        const p2_center_x = p2c_x_pct * W;
        const p2_center_y = p2c_y_pct * H;

        let line1_shape, line2_shape;

        if (isMobile.value) {
          // 手机端
          line1_shape = { x1: p1_center_x - p1RadiusPixels, y1: p1_center_y, x2: p2_center_x - p2RadiusPixels, y2: p2_center_y };
          line2_shape = { x1: p1_center_x + p1RadiusPixels, y1: p1_center_y, x2: p2_center_x + p2RadiusPixels, y2: p2_center_y };
        } else {
          // 桌面端
          line1_shape = { x1: p1_center_x, y1: p1_center_y - p1RadiusPixels, x2: p2_center_x, y2: p2_center_y - p2RadiusPixels };
          line2_shape = { x1: p1_center_x, y1: p1_center_y + p1RadiusPixels, x2: p2_center_x, y2: p2_center_y + p2RadiusPixels };
        }
        
        setTimeout(() => {
          chartInstance.setOption({
            graphic: [
              { id: 'line1', shape: line1_shape },
              { id: 'line2', shape: line2_shape }
            ]
          });
        }, 0);
      } catch (error) {
        console.error('[ParentChildPieChart] Error in updateConnectingLines:', error);
      }
    };
    
    const reapplyChartOptions = async () => {
        const pie1_center = isMobile.value ? ['50%', '30%'] : ['35%', '50%'];
        const pie1_radius = isMobile.value ? '35%' : '55%';
        const pie2_center = isMobile.value ? ['50%', '70%'] : ['65%', '50%'];
        const pie2_radius = isMobile.value ? '25%' : '40%'

        chartOption.value = {
          color: chartColors,
          tooltip: { trigger: 'item' },
          legend: { show: false },
          series: [
            { 
              name: '企业类型', 
              type: 'pie', 
              radius: pie1_radius, 
              center: pie1_center, 
              label: { 
                show: true, 
                formatter: ({ name, value }) => `${name}: ${value}`, 
                position: 'outside' 
              }, 
              startAngle: isMobile.value ? 60 : 145,
              data: parentPieData, 
              z: 101 
            },
            { 
              name: '行政级别', 
              type: 'pie', 
              radius: pie2_radius, 
              center: pie2_center, 
              label: { show: true, formatter: ({ name, value }) => `${name}: ${value}`, position: 'inside' }, 
              startAngle: isMobile.value ? 0 : 90,
              labelLine: { show: true }, 
              data: childPieData, 
              z: 101 
            }
          ],
          graphic: [
            { id: 'line1', type: 'line', shape: { x1: 0, y1: 0, x2: 0, y2: 0 }, style: { stroke: '#888', lineWidth: 1 }, z: 100 },
            { id: 'line2', type: 'line', shape: { x1: 0, y1: 0, x2: 0, y2: 0 }, style: { stroke: '#888', lineWidth: 1 }, z: 100 }
          ]
        };

        await nextTick();
        chartInstance?.resize();
        updateConnectingLines();
    };

    const buildChart = async () => {
      loading.value = true;
      parentPieData = props.chartData || [];
      const targetCompanyType = '地方国企';
      const apiPath = props.mode === 'ls' ? '/api/lasset/summary' : '/api/nlasset/summary';

      try {
        const res = await axios.post(apiPath, {
          filters: { ...props.filters, company_type: targetCompanyType },
          page: 1, pageSize: 1
        });
        childPieData = res.data.charts?.admin_level || [];
        reapplyChartOptions();
        await nextTick(); 

        if (!chartInstance) {
          await initChartInstanceAndListeners();
        }
      } catch (err) {
        console.error('❌ [ParentChildPieChart] buildChart: 加载数据失败:', err);
      } finally {
        loading.value = false;
      }
    };
    
    const handleResize = () => {
        reapplyChartOptions();
    };

    onMounted(() => {
        window.addEventListener('resize', handleResize);
        buildChart();
    });

    onUnmounted(() => {
        window.removeEventListener('resize', handleResize);
    });
    
    const onChartReady = (instance) => { 
      if (instance && !chartInstance) {
        chartInstance = instance;
        chartInstance.on('finished', updateConnectingLines);
      }
    };
    
    const initChartInstanceAndListeners = async () => {
      if (chartInstance) { return; }
      await nextTick(); 
      if (pieChartRef.value) {
        const inst = pieChartRef.value.chart; 
        if (inst && typeof inst.getWidth === 'function') {
          chartInstance = inst;
          chartInstance.on('finished', () => { updateConnectingLines(); });
        }
      }
    };

    watch(() => [props.chartData, props.filters], () => {
      buildChart();
    }, { deep: true });

    return {
      chartOption, loading, pieChartRef, onChartReady
    };
  }
});
</script>

<style scoped>
.chart-wrapper {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 0;
  width: 100%;
}
.chart-title {
  font-size: 18px;
  font-weight: bold;
  margin: 20px 0;
  text-align: center;
  color: #2e3968;
}
</style>