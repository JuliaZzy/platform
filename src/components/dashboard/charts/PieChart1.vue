<template>
  <div class="chart-wrapper" style="position: relative;">
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
import { defineComponent, watch, ref, onMounted, nextTick } from 'vue';
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
  name: 'PieChart1',
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
    const chartOption = ref({});
    const loading = ref(false);
    const pieChartRef = ref(null);
    let chartInstance = null;

    console.log('[PieChart1] setup: Component setup initiated.');

    const updateConnectingLines = () => {
      // ... (此函数内部逻辑保持不变，但依赖 chartInstance 被正确设置)
      console.log('[PieChart1] updateConnectingLines: Attempting to update lines.');
      if (!chartInstance) {
        console.warn('[PieChart1] updateConnectingLines: chartInstance is NULL. Cannot update lines.');
        return;
      }
      if (!chartOption.value.series || chartOption.value.series.length < 2) {
        console.warn('[PieChart1] updateConnectingLines: Series data not ready. Cannot update lines.');
        return;
      }
      const W = chartInstance.getWidth();
      const H = chartInstance.getHeight();
      console.log(`[PieChart1] updateConnectingLines: Chart dimensions W: ${W}, H: ${H}`);
      if (!W || !H || W <= 0 || H <= 0) {
        console.warn('[PieChart1] updateConnectingLines: Chart dimensions invalid. Cannot update lines.');
        return;
      }
      try {
        const pie1Cfg = chartOption.value.series[0];
        const p1c_x_pct = parseFloat(pie1Cfg.center[0]) / 100;
        const p1c_y_pct = parseFloat(pie1Cfg.center[1]) / 100;
        const p1r_str = pie1Cfg.radius;
        let p1RadiusPixels;
        if (typeof p1r_str === 'string' && p1r_str.endsWith('%')) {
          p1RadiusPixels = (parseFloat(p1r_str) / 100) * (Math.min(W, H) / 2);
        } else { p1RadiusPixels = parseFloat(p1r_str); }
        const p1_center_x = p1c_x_pct * W;
        const p1_center_y = p1c_y_pct * H;

        const pie2Cfg = chartOption.value.series[1];
        const p2c_x_pct = parseFloat(pie2Cfg.center[0]) / 100;
        const p2c_y_pct = parseFloat(pie2Cfg.center[1]) / 100;
        const p2r_str = pie2Cfg.radius;
        let p2RadiusPixels;
        if (typeof p2r_str === 'string' && p2r_str.endsWith('%')) {
          p2RadiusPixels = (parseFloat(p2r_str) / 100) * (Math.min(W, H) / 2);
        } else { p2RadiusPixels = parseFloat(p2r_str); }
        const p2_center_x = p2c_x_pct * W;
        const p2_center_y = p2c_y_pct * H;

        const x1_top_vertex = p1_center_x;
        const y1_top_vertex = p1_center_y - p1RadiusPixels;
        const x2_top_vertex = p2_center_x;
        const y2_top_vertex = p2_center_y - p2RadiusPixels;

        const x1_bottom_vertex = p1_center_x;
        const y1_bottom_vertex = p1_center_y + p1RadiusPixels;
        const x2_bottom_vertex = p2_center_x;
        const y2_bottom_vertex = p2_center_y + p2RadiusPixels;
        
        console.log('[PieChart1] updateConnectingLines: Calculated Line1 Coords:', `x1:${x1_top_vertex}, y1:${y1_top_vertex}, x2:${x2_top_vertex}, y2:${y2_top_vertex}`);
        console.log('[PieChart1] updateConnectingLines: Calculated Line2 Coords:', `x1:${x1_bottom_vertex}, y1:${y1_bottom_vertex}, x2:${x2_bottom_vertex}, y2:${y2_bottom_vertex}`);

        chartInstance.setOption({
          graphic: [
            { id: 'line1', shape: { x1: x1_top_vertex, y1: y1_top_vertex, x2: x2_top_vertex, y2: y2_top_vertex } },
            { id: 'line2', shape: { x1: x1_bottom_vertex, y1: y1_bottom_vertex, x2: x2_bottom_vertex, y2: y2_bottom_vertex } }
          ]
        });
        console.log('[PieChart1] updateConnectingLines: chart.setOption CALLED for graphic update.');
      } catch (error) {
        console.error('[PieChart1] updateConnectingLines: Error during calculation or setOption:', error);
      }
    };

    const initChartInstanceAndListeners = async () => {
      if (chartInstance) {
        return;
      }
      await nextTick(); 
      if (pieChartRef.value) {
        // ✅ 修改获取实例的方式：尝试 .chart 属性
        const inst = pieChartRef.value.chart; 
        console.log('[PieChart1] initChartInstanceAndListeners: Attempting to get instance via pieChartRef.value.chart. Value:', inst);

        if (inst && typeof inst.getWidth === 'function') { // 检查 inst 是否是一个有效的 ECharts 实例
          console.log('[PieChart1] initChartInstanceAndListeners: Successfully got chart instance via ref using .chart property!');
          chartInstance = inst;
          chartInstance.on('finished', () => {
            console.log('[PieChart1] Event Listener: ECharts "finished" event. Calling updateConnectingLines.');
            updateConnectingLines();
          });
          chartInstance.on('resize', () => {
            console.log('[PieChart1] Event Listener: ECharts "resize" event. Calling updateConnectingLines.');
            updateConnectingLines();
          });
          if (chartInstance.getWidth() > 0 && chartInstance.getHeight() > 0) {
             console.log('[PieChart1] initChartInstanceAndListeners: Initial call to updateConnectingLines after getting instance.');
             updateConnectingLines();
          } else {
             console.warn('[PieChart1] initChartInstanceAndListeners: Chart dimensions are zero on first instance retrieval. Relying on "finished" event.');
          }
        } else {
          console.error('[PieChart1] initChartInstanceAndListeners: Failed to get a valid ECharts instance. pieChartRef.value.chart is:', pieChartRef.value.chart);
        }
      } else {
        console.error('[PieChart1] initChartInstanceAndListeners: pieChartRef.value is null or undefined.');
      }
    };

    const buildChart = async () => {
      console.log('[PieChart1] buildChart: Function called.');
      loading.value = true;
      const parentData = props.chartData || [];
      const targetCompanyType = '地方国企';
      const apiPath = props.mode === 'ls' ? '/api/lasset/summary' : '/api/nlasset/summary';

      try {
        const res = await axios.post(apiPath, {
          filters: { ...props.filters, company_type: targetCompanyType },
          page: 1, pageSize: 1
        });
        const childData = res.data.charts?.admin_level || [];
        // ... (chartOption.value 设置部分保持不变) ...
        chartOption.value = {
          color: chartColors,
          tooltip: { trigger: 'item' },
          legend: { show: false },
          series: [
            { name: '企业类型', type: 'pie', radius: '50%', center: ['35%', '35%'], label: { show: true, formatter: ({ name, value }) => `${name}: ${value}`, position: 'outside' }, startAngle: 145, labelLine: { show: true }, data: parentData, z: 101 },
            { name: '行政级别', type: 'pie', radius: '40%', center: ['65%', '35%'], label: { show: true, formatter: ({ name, value }) => `${name}: ${value}`, position: 'inside' }, labelLine: { show: true }, data: childData, z: 101 }
          ],
          graphic: [
            { id: 'line1', type: 'line', shape: { x1: 0, y1: 0, x2: 0, y2: 0 }, style: { stroke: '#888', lineWidth: 1 }, z: 100 },
            { id: 'line2', type: 'line', shape: { x1: 0, y1: 0, x2: 0, y2: 0 }, style: { stroke: '#888', lineWidth: 1 }, z: 100 }
          ]
        };
        console.log('[PieChart1] buildChart: chartOption updated.');
        
        await nextTick(); 
        console.log('[PieChart1] buildChart: nextTick finished.');
        await initChartInstanceAndListeners();

      } catch (err) {
        console.error('❌ [PieChart1] buildChart: 加载 PieChart1 数据失败:', err);
      } finally {
        loading.value = false;
      }
    };
    
    const onChartReady = (instance) => { 
      console.log('[PieChart1] onChartReady (event handler): Called. Instance:', instance ? 'Exists' : 'Null');
      // 这个回调现在作为备用，或者如果它确实触发了，就用它
      if (instance && !chartInstance) {
        console.log('[PieChart1] onChartReady: Setting chartInstance via @ready event (likely primary method failed).');
        chartInstance = instance;
        instance.on('finished', updateConnectingLines);
        instance.on('resize', updateConnectingLines);
        if (chartInstance.getWidth() > 0 && chartInstance.getHeight() > 0) {
           updateConnectingLines();
        }
      }
    };

    onMounted(async () => {
      console.log('[PieChart1] onMounted: Hook called.');
      await buildChart();
      if (!chartInstance) {
        console.log('[PieChart1] onMounted: chartInstance still null after buildChart. Attempting initChartInstanceAndListeners again (could be redundant if buildChart already succeeded).');
        await initChartInstanceAndListeners();
      }
    });

    watch(() => [props.chartData, props.filters], async () => {
      console.log('[PieChart1] watch: Props changed, calling buildChart.');
      await buildChart();
    }, { deep: true });

    return {
      chartOption, loading, pieChartRef, onChartReady
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
