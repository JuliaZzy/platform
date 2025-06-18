<template>
  <div class="chart-grid">
    <div class="chart-row">
      <div class="chart-full" v-if="comboData.barSeries?.length && comboData.lineSeries?.data?.length">
        <ComboBarLineChart 
          chartTitle="A股数据资源入表企业数量和金额"
          :categories="comboData.categories"
          :barSeries="comboData.barSeries"
          y-axis-bar-name="入表企业数量（家）"
          :lineSeries="comboData.lineSeries"
          y-axis-line-name="入表企业金额（亿）"

          :y-axis-bar-max="120"
          :y-axis-bar-interval="20"
          :y-axis-line-max="24"
          :y-axis-line-interval="4"

          :chart-height="500" 
        />
      </div>
    </div>

    <div class="chart-row">
      <div class="subject-chart-container width-40" v-if="groupedSubjectData.countSeries?.length">
        <GroupedBarChart
          :chart-data="groupedSubjectData.countSeries"
          chartTitle="A股数据资源入表公司分科目分布情况"
          row-key="入表科目"
          col-key="报告时间" 
        />
      </div>
      <div class="subject-chart-container width-60" v-if="actualControllerData?.length">
        <GroupedBarChart
          :chart-data="actualControllerData"
          chartTitle="A股数据资源入表公司分实控人分布情况"
          row-key="name"
          col-key="报告时间"
        />
      </div>
    </div>

    <div class="chart-row" v-for="item in groupedFields" :key="item.field">
      <div class="chart-full" v-if="groupedCharts[item.field]?.length">
        <GroupedBarChart
          :chart-data="groupedCharts[item.field]"
          :chartTitle="item.title"
          row-key="name"
          col-key="报告时间"
        />
      </div>
    </div>
  </div>
</template>

<script>
import ComboBarLineChart from '@/components/dashboard/charts/ComboBarLineChart.vue';
import GroupedBarChart from '@/components/dashboard/charts/GroupedBarChart.vue';
import axios from 'axios';

export default {
  name: 'LChartRow',
  components: {
    ComboBarLineChart,
    GroupedBarChart
  },
  props: {
    filters: { type: Object, required: true }
  },
  data() {
    return {
      comboData: { barSeries: [], lineSeries: {} },
      groupedSubjectData: { countSeries: [], sumSeries: [] },
      actualControllerData: [], 
      groupedFields: [
        { field: '所属证券行业分布', displayKey: '所属证券行业分布', title: 'A股数据资源入表公司分行业分布情况' },
        { field: '市值规模', displayKey: '市值规模', title: 'A股数据资源入表公司分市值规模分布情况' },
        { field: '省份', displayKey: '省份', title: 'A股数据资源入表公司分区域位置分布情况' }
      ],
      groupedCharts: {},
      isTablesLoading: true
    };
  },
  watch: {
    filters: {
      handler() { this.loadAllData(); },
      deep: true,
      immediate: true
    }
  },
  methods: {
    restructureDataForGroupedBarChart(flatData, seriesNameKey, categoryNameKey, valueKey) {
      // 没有数据返回空数组
      if (!flatData || flatData.length === 0) {
        return [];
      }

      const categories = [];
      const seenCategories = new Set();
      flatData.forEach(item => {
        const categoryName = item[categoryNameKey];
        if (!seenCategories.has(categoryName)) {
          seenCategories.add(categoryName);
          categories.push(categoryName);
        }
      });

      const dataBySeries = new Map();
      flatData.forEach(item => {
        const seriesName = item[seriesNameKey];
        if (!dataBySeries.has(seriesName)) {
          dataBySeries.set(seriesName, []);
        }
        dataBySeries.get(seriesName).push(item);
      });

      const sortedSeriesNames = Array.from(dataBySeries.keys()).sort();
      
      const finalSeries = sortedSeriesNames.map(seriesName => {
        const seriesItems = dataBySeries.get(seriesName);
        const valueMap = new Map(
          seriesItems.map(item => [item[categoryNameKey], parseFloat(item[valueKey]) || 0])
        );

        return {
          name: seriesName,
          data: categories.map(category => ({
            [categoryNameKey]: category,
            [valueKey]: valueMap.get(category) || 0
          }))
        };
      });
      
      return finalSeries;
    },

    async loadAllData() {
      if (this.isTablesLoading !== undefined) this.isTablesLoading = true;
      // console.log('✅ LChartRow: loadAllData called with filters:', JSON.parse(JSON.stringify(this.filters)));
      try {
        const promises = [
          axios.post('/api/lchart/combo1', { filters: this.filters }),
          axios.post('/api/lchart/subject-bars', { filters: this.filters }),
          axios.post('/api/lchart/group-field', { 
            filters: this.filters, 
            field: '实控人'
          })
        ];

        this.groupedFields.forEach(f => {
          promises.push(axios.post('/api/lchart/group-field', {
            filters: this.filters,
            field: f.field
          }));
        });

        const results = await Promise.all(promises);
        const comboRes = results[0];
        const barRes = results[1];
        const controllerRes = results[2]; 
        const groupedFieldsResponses = results.slice(3); 
        const comboDataResponse = comboRes.data || {};
        const barRaw = comboDataResponse.barSeries || [];        
        const lineRawForChart = comboDataResponse.lineSeriesForChart || []; 

        const allCategoryNamesSet = new Set();
        barRaw.forEach(item => item['报告时间'] && allCategoryNamesSet.add(item['报告时间']));
        lineRawForChart.forEach(item => item['报告时间'] && allCategoryNamesSet.add(item['报告时间']));
        const sortedCategories = Array.from(allCategoryNamesSet).sort((a, b) => {
          if (a.startsWith('Q') && b.startsWith('Q')) return a.localeCompare(b);
          return a.localeCompare(b);
        });
        this.comboData.categories = sortedCategories;

        const barDataMap = new Map(barRaw.map(item => [item['报告时间'], parseFloat(item['数据资源入表数量']) || 0]));
        const finalBarData = sortedCategories.map(cat => barDataMap.get(cat) || 0);
        this.comboData.barSeries = [{ name: '数据资源入表数量', data: finalBarData }];

        const lineChartDataMap = new Map(lineRawForChart.map(item => [item['报告时间'], parseFloat(item['数据资源入表总额（单位：亿元）']) || 0]));
        const finalLineDataForChart = sortedCategories.map(cat => lineChartDataMap.get(cat) || 0);
        this.comboData.lineSeries = { 
          name: '数据资源入表总额', 
          data: finalLineDataForChart
        };

        const subjectBarsData = barRes.data || {};
        let rawCountSeriesData = subjectBarsData.countSeries || [];
        let rawSumSeriesData = subjectBarsData.sumSeries || [];
        
        const transformedCountSeries = this.restructureDataForGroupedBarChart(rawCountSeriesData, '报告时间', '入表科目', 'value');
        const transformedSumSeries = this.restructureDataForGroupedBarChart(rawSumSeriesData, '报告时间', '入表科目', 'value');
        
        this.groupedSubjectData = { 
            countSeries: transformedCountSeries,
            sumSeries: transformedSumSeries
        };

        const rawControllerData = controllerRes.data ?? [];
        this.actualControllerData = this.restructureDataForGroupedBarChart(
          rawControllerData, 
          '报告时间', 
          'name',
          'value'
        );

        this.groupedFields.forEach((f, idx) => {
          const rawBackendData = groupedFieldsResponses[idx]?.data ?? [];
          const structuredChartData = this.restructureDataForGroupedBarChart(
              rawBackendData,
              '报告时间',
              'name',
              'value'
          );
          this.$set(this.groupedCharts, f.field, structuredChartData);
      });
      } catch (err) {
        console.error('❌ 加载图表数据失败 LChartRow:', err);
        this.comboData = { barSeries: [], lineSeries: {} };
        this.groupedSubjectData = { countSeries: [], sumSeries: [] };
        this.groupedCharts = {};
        this.actualControllerData = [];
      } finally {
          if (this.isTablesLoading !== undefined) this.isTablesLoading = false;
      }
    }
  }
};
</script>

<style scoped>
.chart-grid {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.chart-row {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
}

.chart-full,
.subject-chart-container {
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.chart-full {
  flex: 1 1 100%;
}

.subject-chart-container {
  flex: 1 1 45%;
  min-width: 300px;
}

@media (max-width: 992px) {
  .subject-chart-container {
    flex-basis: 100%;
  }
}
</style>
