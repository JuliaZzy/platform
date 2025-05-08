<template>
  <div class="chart-grid">
    <!-- 第1行：BarChart1 -->
    <div class="chart-row">
      <div class="chart-full" v-if="charts.province_area?.length">
        <BarChart1 :chart-data="charts.province_area" />
      </div>
    </div>

    <!-- 第2行：PieChart1 -->
    <div class="chart-row">
      <div class="pie-1" v-if="charts.company_type?.length">
        <PieChart1 :chart-data="charts.company_type" :filters="filters" :mode="mode" />
      </div>
    </div>

    <!-- 第3行：BarChart2 -->
    <div class="chart-row" v-if="charts[barChart2Field]?.length">
      <div class="chart-full">
        <BarChart2 :chart-data="charts[barChart2Field]" />
      </div>
    </div>

    <!-- 第4行：PieChart2 和 PieChart3 定位在 30% / 70% -->
    <div class="fixed-pie-row">
      <div class="pie-30" v-if="charts.dataasset_type?.length">
        <PieChart2 :chart-data="charts.dataasset_type" />
      </div>
      <div class="pie-70" v-if="charts.dataasset_register_addrtype?.length">
        <PieChart3 :chart-data="charts.dataasset_register_addrtype" />
      </div>
    </div>
  </div>
</template>

<script>
import BarChart1 from '@/components/dashboard/charts/BarChart1.vue';
import PieChart1 from '@/components/dashboard/charts/PieChart1.vue';
import BarChart2 from '@/components/dashboard/charts/BarChart2.vue';
import PieChart2 from '@/components/dashboard/charts/PieChart2.vue';
import PieChart3 from '@/components/dashboard/charts/PieChart3.vue';

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
    charts: { type: Object, required: true },
    filters: { type: Object, required: true },
    mode: {
      type: String,
      required: true,
      validator: val => ['nls', 'ls'].includes(val)
    }
  },
  computed: {
    barChart2Field() {
      return this.mode === 'ls' ? 'business_type' : 'company_business_type';
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

.chart-full {
  flex: 1 1 100%;
  background: #fff;
  padding: 20px;
  border-radius: 8px;
}

.pie-1 {
  flex: 1 1 100%;
  padding: 20px;
  border-radius: 8px;
}

/* ✅ 定位图表行 */
.fixed-pie-row {
  position: relative;
  height: 400px; /* 与图表高度保持一致 */
}

/* ✅ PieChart2 定位在页面宽度的 30% */
.pie-30,
.pie-70 {
  position: absolute;
  width: 600px;
  height: 360px;
  padding: 10px;
  transform: translateX(-50%);
}

.pie-30 {
  left: 30%;
  top: 0;
}

.pie-70 {
  left: 70%;
  top: 0;
}
</style>
