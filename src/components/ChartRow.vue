<template>
  <div class="chart-grid">
    <!-- 第1行：BarChart1 + PieChart1 -->
    <div class="chart-row">
      <div class="chart-bar40">
        <BarChart1 :filters="filters" />
      </div>
      <div class="chart-pie60">
        <PieChart1 :filters="filters" />
      </div>
    </div>

    <!-- 第2行：BarChart2 单独 -->
    <div class="chart-row">
      <div class="chart-full">
        <BarChart2 :filters="filters" />
      </div>
    </div>

    <!-- 第3行：PieChart2 + PieChart3 -->
    <div class="chart-row">
      <div class="chart-half">
        <PieChart2 :filters="filters" />
      </div>
      <div class="chart-half">
        <PieChart3 :filters="filters" />
      </div>
    </div>
  </div>
</template>

<script>
import BarChart1 from '@/components/charts/BarChart1.vue';
import PieChart1 from '@/components/charts/PieChart1.vue';
import BarChart2 from '@/components/charts/BarChart2.vue';
import PieChart2 from '@/components/charts/PieChart2.vue';
import PieChart3 from '@/components/charts/PieChart3.vue';

export default {
  name: 'ChartRow',
  components: {
    BarChart1,
    PieChart1,
    BarChart2,
    PieChart2,
    PieChart3
  },
  props: {
    filters: {
      type: Object,
      required: true
    }
  }
};
</script>

<style scoped>
.chart-grid {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.chart-row {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
}

.chart-bar40 {
  flex: 0 0 54%;
  max-width: 100%;
  box-sizing: border-box;
}

.chart-pie60 {
  flex: 0 0 44%;
  max-width: 100%;
  box-sizing: border-box;
}


.chart-full {
  flex: 1 1 100%;
  background: #fff;
  padding: 20px;
  border-radius: 8px;
}

</style>
