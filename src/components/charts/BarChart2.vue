<template>
  <div class="chart-wrapper">
    <div class="chart-title">各企业业务类型的企业数量</div>
    <v-chart :option="chartOption" style="width: 1000px; height: 450px;" />
  </div>
</template>

<script>
import { defineComponent } from 'vue';
import VChart from 'vue-echarts';
import axios from 'axios';
import chartColors from '@/utils/chartColors.js';

export default defineComponent({
  name: 'BarChart2',
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
      axios.post('/api/nlasset/stats', {
        field: 'company_business_type',
        filters: this.filters
      }).then(res => {
        const data = res.data;
        this.chartOption = {
          color: chartColors,
          tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'shadow' }
          },
          xAxis: {
            type: 'category',
            data: data.map(item => item.name),
            axisLabel: {
              fontSize: 12,
              rotate: 30,
              formatter: (val) => val.length > 6 ? val.slice(0, 6) + '…' : val
            }
          },
          yAxis: {
            type: 'value',
            name: '企业业务类型',
            nameLocation: 'middle',
            nameGap: 60,
            nameTextStyle: {
              fontSize: 14
            }
          },
          series: [{
            type: 'bar',
            data: data.map(item => item.value)
          }]
        };
      }).catch(err => {
        console.error('加载 BarChart2 图表失败:', err);
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
