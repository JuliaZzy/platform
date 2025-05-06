<template>
  <div class="dashboard-page">
    <!-- 页面标题 + 副标题 -->
    <div class="dashboard-title-block">
      <h1 class="dashboard-title">上市公司数据资产情况</h1>
      <p class="dashboard-subtitle">Overview of Listed Company Data Assets</p>
    </div>

    <!-- 筛选区 -->
    <FilterSection @filter-change="handleFilterChange" />

    <div class="dashboard-container">
      <ChartRow :filters="filters" />
      <DataTable :filters="filters" @page-data="currentPageData = $event" />
    </div>
  </div>
</template>


<script>
import FilterSection from '@/components/filters/LSFilterSection.vue';
import ChartRow from '@/components/LSChartRow.vue';
import DataTable from '@/components/LSDataTable.vue';

export default {
  name: 'ListedCompanyDashboardPage',
  components: {
    FilterSection,
    ChartRow,
    DataTable,
  },
  data() {
    return {
      filters: {},
      currentPageData: []  // 当前页数据，用于导出
    };
  },
  methods: {
    handleFilterChange(newFilters) {
      this.filters = newFilters; // ✅ 会触发子组件自动更新
    }
  }
};
</script>

<style scoped>
.dashboard-title-block {
  margin: 30px 30px 10px;
}

.dashboard-title {
  font-size: 24px;
  font-weight: bold;
  color: #003049;
  margin: 0;
}

.dashboard-subtitle {
  font-size: 18px;
  font-weight: bold;
  color: #005f73;
  margin-top: 6px;
}


.dashboard-container {
  padding: 30px;
  background: #f9f9f9;
}

.section {
  background-color: white;
  padding: 20px;
  margin-bottom: 30px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}
</style>
