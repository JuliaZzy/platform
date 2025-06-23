<template>
  <div class="chart-wrapper">
    <div class="chart-title">{{ chartTitle }}</div>
    <ChartSpinner :visible="loading" />
    <v-chart
      ref="vueChartRef"
      :option="chartOption"
      autoresize
      :style="{ width: '90%', height: chartHeight + 'px' }"
    />
  </div>
</template>

<script>
import { defineComponent, ref, watch, nextTick } from 'vue';
import { useResponsiveCharts } from '@/utils/useResponsiveCharts.js'; 
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
    LegendComponent,
    DataZoomComponent
} from 'echarts/components';

use([
    CanvasRenderer,
    BarChart,
    TitleComponent,
    TooltipComponent,
    GridComponent,
    LegendComponent,
    DataZoomComponent
]);

export default defineComponent({
    name: 'ResponsiveBarChart',
    components: {
        'v-chart': VChart,
        ChartSpinner
  },
  props: {
    chartTitle: { type: String, required: true },
    chartData: { type: Array, default: () => [] },
    chartHeight: { type: Number, default: 400 },
    yAxisName: { type: String, default: '数量' },
    enableDataZoom: { type: Boolean, default: false },
    xAxisMobileRotate: { type: Number, default: 35 } 
  },
  setup(props) {
    const { isMobile } = useResponsiveCharts();
    const chartOption = ref({});
    const loading = ref(false);
    const vueChartRef = ref(null);

    const updateChart = () => {
        loading.value = true;
        setTimeout(() => {
            const barLabelOption = {
            show: true,
            position: 'top',
            formatter: '{c}',
            fontSize: isMobile.value ? 9 : 12,
            color: '#005f73',
            };

        const yAxisNameTextStyle = {
            fontSize: isMobile.value ? 10 : 14,
            padding: isMobile.value ? [0, 0, 0, 40] : [0, 0, 0, 0]
        };

        chartOption.value = {
            color: chartColors,
            tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
            grid: {
                left: '3%',
                right: '4%',
                bottom: isMobile.value ? '25%' : '15%',
                containLabel: true
            },
            xAxis: {
                type: 'category',
                data: props.chartData.map(item => item.name),
                axisLabel: {
                interval: 0,
                rich: {
                    customStyle: {
                    lineHeight: 18,
                    fontSize: isMobile.value ? 8 : 11
                    }
                },
                formatter: val => {
                    const lines = val.match(/.{1,5}/g)?.slice(0, 5) || [val];
                    return lines.map(line => `{customStyle|${line}}`).join('\n');
                }
                }
            },
            yAxis: {
                type: 'value',
                name: props.yAxisName,
                nameLocation: isMobile.value ? 'end' : 'middle',
                nameGap: isMobile.value ? 25 : 40,
                nameTextStyle: yAxisNameTextStyle,
                axisLabel: {
                    fontSize: isMobile.value ? 9 : 12
                },
                
            },
            series: [{
                type: 'bar',
                data: props.chartData.map(item => item.value),
                label: barLabelOption
            }],
        }

        if (isMobile.value && props.chartData.length > 8) {
          chartOption.value.dataZoom = [
            {
                type: 'slider',
                show: true,
                xAxisIndex: [0],
                start: 0,
                end: (8 / props.chartData.length) * 100, 
                handleSize: '30%',
                handleStyle: {
                    color: '#fff',
                    shadowBlur: 3,
                    shadowColor: 'rgba(0, 0, 0, 0.6)',
                    shadowOffsetX: 2,
                    shadowOffsetY: 2
                }
            }
          ];
        } else {
        chartOption.value.dataZoom = []; 
        }

        loading.value = false;
        
        nextTick(() => {
            vueChartRef.value?.chart?.resize();
        });
      }, 500);
    };

    watch(() => props.chartData, updateChart, { immediate: true, deep: true });
    watch(isMobile, updateChart);

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
    margin: 15px 0px;
    text-align: center;
    color: #2e3968;
}

@media (max-width: 768px) {
    .chart-title {
        font-size: 16px;
        margin: 15px 0;
    }
}
</style>