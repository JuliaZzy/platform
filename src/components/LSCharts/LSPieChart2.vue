<template>
  <div class="chart-wrapper">
    <div class="chart-title">各数据资产类型的企业数量</div>
    <v-chart :option="chartOption" style="width: 600px; height: 400px;" />
  </div>
</template>

<script>
import { defineComponent } from 'vue';
import VChart from 'vue-echarts';
import axios from 'axios';
import chartColors from '@/utils/chartColors.js'; // ✅ 引入统一配色

export default defineComponent({
  name: 'LSPieChart2',
  components: { 'v-chart': VChart },
  props: ['filters'],
  data() {
    return { chartOption: {} };
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
        field: 'dataasset_type',
        filters: this.filters
      }).then(res => {
        this.chartOption = {
          color: chartColors, // ✅ 应用统一配色
          tooltip: { trigger: 'item' },
          legend: { show: false },
          series: [
            {
              type: 'pie',
              radius: '60%',
              label: {
                show: true,
                formatter: function (params) {
                  return `${params.name}: ${params.value}`;
                },
                position: 'outside'
              },
              labelLine: { show: true },
              emphasis: {
                itemStyle: {
                  shadowBlur: 10,
                  shadowOffsetX: 0,
                  shadowColor: 'rgba(0, 0, 0, 0.5)'
                }
              },
              data: res.data
            }
          ]
        };
      }).catch(err => {
        console.error('加载 PieChart2 图表失败:', err);
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
