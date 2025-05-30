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
        />
      </div>
    </div>

    <div class="chart-row">
      <div class="subject-chart-container equal-half" v-if="groupedSubjectData.countSeries?.length">
        <GroupedBarChart
          :chart-data="groupedSubjectData.countSeries"
          chartTitle="A股数据资源入表公司分科目分布情况"
          row-key="入表科目"
          col-key="报告时间" 
        />
      </div>
      <div class="subject-chart-container equal-half" v-if="groupedSubjectData.sumSeries?.length">
        <GroupedBarChart
          :chart-data="groupedSubjectData.sumSeries"
          chartTitle="A股数据资源入表公司分科目金额分布情况（亿元）"
          row-key="入表科目"
          col-key="报告时间"
          yAxisName="入表企业金额（亿）"
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
      groupedFields: [
        { field: '所属证券行业分布', displayKey: '所属证券行业分布', title: 'A股数据资源入表公司分行业分布情况' },
        { field: '市值规模', displayKey: '市值规模', title: 'A股数据资源入表公司分市值规模分布情况' },
        { field: '省份', displayKey: '省份', title: 'A股数据资源入表公司分区域位置分布情况' },
        { field: '实控人', displayKey: '实控人', title: 'A股数据资源入表公司分实控人分布情况' }
      ],
      groupedCharts: {},   // 给 GroupedBarChart 用的嵌套数据
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
      if (!flatData || flatData.length === 0) return [];
      const seriesCollection = new Map();
      flatData.forEach(item => {
        const seriesName = item[seriesNameKey];     
        const categoryName = item[categoryNameKey]; 
        const rawValue = item[valueKey];
        const value = parseFloat(rawValue);   
        if (!seriesCollection.has(seriesName)) {
          seriesCollection.set(seriesName, {
            name: seriesName, 
            data: []          
          });
        }
        seriesCollection.get(seriesName).data.push({
          [categoryNameKey]: categoryName, 
          [valueKey]: isNaN(value) ? 0 : value 
        });
      });
      return Array.from(seriesCollection.values());
    },

    async loadAllData() {
      if (this.isTablesLoading !== undefined) this.isTablesLoading = true;
      // console.log('✅ LChartRow: loadAllData called with filters:', JSON.parse(JSON.stringify(this.filters)));
      try {
        const promises = [
          axios.post('/api/lchart/combo1', { filters: this.filters }),
          axios.post('/api/lchart/subject-bars', { filters: this.filters }),
        ];

        // 添加 groupedFields 的请求
        this.groupedFields.forEach(f => {
          promises.push(axios.post('/api/lchart/group-field', {
            filters: this.filters,
            field: f.field
          }));
        });

        // ✅ 使用 await Promise.all(promises) 获取所有结果
        const results = await Promise.all(promises);

        // ✅ 按顺序解构结果
        const comboRes = results[0];
        const barRes = results[1];
        // groupedFields 的结果从索引 2 开始，长度是 this.groupedFields.length
        const groupedFieldsResponses = results.slice(2, 2 + this.groupedFields.length); 


        // ComboData 处理
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
        
        // Grouped Subject Data (Charts 2-3)
        const subjectBarsData = barRes.data || {};
        let rawCountSeriesData = subjectBarsData.countSeries || [];
        let rawSumSeriesData = subjectBarsData.sumSeries || [];
        
        const transformedCountSeries = this.restructureDataForGroupedBarChart(rawCountSeriesData, '报告时间', '入表科目', 'value');
        const transformedSumSeries = this.restructureDataForGroupedBarChart(rawSumSeriesData, '报告时间', '入表科目', 'value');
        
        this.groupedSubjectData = { 
            countSeries: transformedCountSeries,
            sumSeries: transformedSumSeries
        };

        // Grouped Fields Data
        this.groupedFields.forEach((f, idx) => {
          // ▼▼▼ 使用 groupedFieldsResponses[idx] ▼▼▼
          const rawBackendData = (groupedFieldsResponses[idx] && groupedFieldsResponses[idx].data) ? groupedFieldsResponses[idx].data : []; 
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
  gap: 20px;
}

.chart-full {
  flex: 1 1 100%;
  background: #fff;
  padding: 20px;
  border-radius: 8px;
}

.chart-half {
  flex: 1 1 40%;
  background: #fff;
  padding: 20px;
  border-radius: 8px;
}

/* LChartRow.vue <style scoped> */
.chart-row {
  display: flex;
  gap: 20px; /* 两个图表之间的间隙 */
  /* flex-wrap: wrap; */ /* 如果希望在屏幕非常窄时换行，可以保留；如果必须并排，可以去掉或测试效果 */
}

.subject-chart-container { /* 通用样式 */
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  /* 这个类可以只保留通用样式，宽度控制交给 .equal-half */
}

.equal-half {
  flex-grow: 1;   /* 允许放大 */
  flex-shrink: 1; /* 允许缩小 */
  flex-basis: 0;    /* 从0开始，让flex-grow根据比例分配可用空间 */
  min-width: 0;   /* 允许元素收缩到小于其内容的固有宽度，配合图表组件内部min-width的修改 */
  /* 上面三行通常简写为: flex: 1; min-width: 0; */
}
</style>
