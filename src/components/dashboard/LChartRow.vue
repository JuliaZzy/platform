<template>
  <div class="chart-grid">
    <div class="chart-row">
      <div class="chart-full" v-if="comboData.barSeries?.length && comboData.lineSeries?.data?.length">
        <ComboBarLineChart 
          chartTitle="2024年数据资源入表情况"
          :categories="comboData.categories"
          :barSeries="comboData.barSeries"
          :lineSeries="comboData.lineSeries"
        />
      </div>
    </div>

    <div class="chart-row">
      <div class="chart-full" v-if="comboData.tableRows?.length">
        <ComboTable :table-rows="comboData.tableRows" />
      </div>
    </div>

    <div class="chart-row">
      <div class="subject-chart-container equal-half" v-if="groupedSubjectData.countSeries?.length">
        <GroupedBarChart
          :chart-data="groupedSubjectData.countSeries"
          chartTitle="入表科目数量汇总"
          row-key="入表科目"
          col-key="报告时间" 
        />
      </div>
      <div class="subject-chart-container equal-half" v-if="groupedSubjectData.sumSeries?.length">
        <GroupedBarChart
          :chart-data="groupedSubjectData.sumSeries"
          chartTitle="入表科目金额汇总（亿元）"
          row-key="入表科目"
          col-key="报告时间"
        />
      </div>
    </div>

    <div class="chart-row">
      <div
        class="chart-full"
        v-for="(subject, index) in filteredSubjectNames"
        :key="index"
      >
        <SubjectTable
          :title="subject"
          :count-data="subjectTables[subject]?.count"
          :sum-data="subjectTables[subject]?.total"
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
      <div class="chart-full" v-if="flatTableData[item.field]?.length">
        <TransposedTable
          :data="flatTableData[item.field]"   
          :row-key="'name'"                   
          :col-key="'报告时间'"             
          val-key="value"                     
          :chartTitle="item.title"  
          :row-label="item.displayKey || item.title"
        />
      </div>
    </div>

    <div class="chart-row">
      <div class="chart-full" v-if="controlData.classified?.length"> 
        <TransposedTable
          :data="flattenClassified(controlData.classified)"
          row-key="name"
          col-key="报告时间"
          val-key="value"
          title="实控人分类汇总"
        />
      </div>
    </div>
  </div>
</template>

<script>
import ComboBarLineChart from '@/components/dashboard/charts/ComboBarLineChart.vue';
import ComboTable from '@/components/dashboard/charts/ComboTable.vue';
import GroupedBarChart from '@/components/dashboard/charts/GroupedBarChart.vue';
import SubjectTable from '@/components/dashboard/charts/SubjectTable.vue';
import TransposedTable from '@/components/dashboard/charts/TransposedTable.vue';
import axios from 'axios';

export default {
  name: 'LChartRow',
  components: {
    ComboBarLineChart,
    ComboTable,
    GroupedBarChart,
    SubjectTable,
    TransposedTable
  },
  props: {
    filters: { type: Object, required: true }
  },
  computed: {
    filteredSubjectNames() {
      // console.log('📌 subjectTables:', this.subjectTables);
      return this.subjectNames.filter(name => {
        const entry = this.subjectTables[name];
        return Array.isArray(entry?.count) && entry.count.length > 0;
      });
    }
  },
  data() {
    return {
      comboData: { barSeries: [], lineSeries: {}, tableRows: [], tableColumns: [] },
      groupedSubjectData: { countSeries: [], sumSeries: [] },
      subjectTables: {},
      controlData: { original: [], classified: [] },
      subjectNames: ['无形资产', '开发支出', '存货'],
      groupedFields: [
        { field: '所属证券行业分布', displayKey: '所属证券行业分布', title: '所属证券行业分布季度汇总' },
        { field: '市值规模', displayKey: '市值规模', title: '市值规模分布季度汇总' },
        { field: '省份', displayKey: '省份', title: '省份分布季度汇总' },
        { field: '实控人', displayKey: '实控人', title: '实控人分布季度汇总' }
      ],
      groupedCharts: {},   // 给 GroupedBarChart 用的嵌套数据
      flatTableData: {}    // 给 TransposedTable 用的扁平数据 (针对4-7组)
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
    formatToGroupedSeries(raw, quarters = ['Q1', 'Q2', 'Q3', 'Q4']) {
      const grouped = {};
      (raw || []).forEach(({ name, '报告时间': quarter, value }) => {
        if (!grouped[name]) grouped[name] = Array(quarters.length).fill(0);
        const idx = quarters.indexOf(quarter);
        if (idx !== -1) grouped[name][idx] = parseFloat(value);
      });
      return Object.entries(grouped).map(([name, data]) => ({ name, data }));
    },
    flattenClassified(data) {
      const result = [];
      (data || []).forEach(row => {
        const { name, definition, ...rest } = row;
        Object.keys(rest).forEach(key => {
          result.push({
            name,
            definition,
            '报告时间': key,
            value: rest[key]
          });
        });
      });
      return result;
    },
    async loadAllData() {
      // console.log('✅ LChartRow: loadAllData called with filters:', JSON.parse(JSON.stringify(this.filters)));
      try {
        const [comboRes, barRes, tableRes, ...groupedRes] = await Promise.all([
          axios.post('/api/lchart/combo1', { filters: this.filters }),
          axios.post('/api/lchart/subject-bars', { filters: this.filters }),
          axios.post('/api/lchart/subject-tables', { filters: this.filters }),
          ...this.groupedFields.map(f => axios.post('/api/lchart/group-field', {
            filters: this.filters,
            field: f.field
          }))
        ]);

        // ... 获取 comboRes ...
        const comboDataResponse = comboRes.data || {};
        const barRaw = comboDataResponse.barSeries || [];                 // 数量数据
        const lineRawForChart = comboDataResponse.lineSeriesForChart || []; // 金额数据 (亿元) 给图表
        const amountRawForTable = comboDataResponse.amountSeriesForTable || []; // 金额数据 (万元) 给表格

        // 1. 准备统一的 categories (与之前逻辑类似，确保包含所有报告时间)
        const allCategoryNamesSet = new Set();
        barRaw.forEach(item => item['报告时间'] && allCategoryNamesSet.add(item['报告时间']));
        lineRawForChart.forEach(item => item['报告时间'] && allCategoryNamesSet.add(item['报告时间'])); // 也从折线数据获取时间
        // (如果 amountRawForTable 的时间范围可能不同，也应加入)
        // amountRawForTable.forEach(item => item['报告时间'] && allCategoryNamesSet.add(item['报告时间']));

        const sortedCategories = Array.from(allCategoryNamesSet).sort((a, b) => {
          if (a.startsWith('Q') && b.startsWith('Q')) return a.localeCompare(b);
          return a.localeCompare(b);
        });
        this.comboData.categories = sortedCategories;

        // 2. 准备柱状图系列数据 (数量)
        const barDataMap = new Map(barRaw.map(item => [item['报告时间'], parseFloat(item['数据资源入表数量']) || 0]));
        const finalBarData = sortedCategories.map(cat => barDataMap.get(cat) || 0);
        this.comboData.barSeries = [{
          name: '数据资源入表数量',
          data: finalBarData
        }];

        // 3. 准备折线图系列数据 (金额 - 亿元)
        // 注意后端返回的键名是 "数据资源入表总额（单位：亿元）"
        const lineChartDataMap = new Map(lineRawForChart.map(item => [item['报告时间'], parseFloat(item['数据资源入表总额（单位：亿元）']) || 0]));
        const finalLineDataForChart = sortedCategories.map(cat => lineChartDataMap.get(cat) || 0);
        this.comboData.lineSeries = { 
          name: '数据资源入表总额', // 图例名称
          data: finalLineDataForChart
        };
        
        // 4. 准备表格数据 (金额 - 万元)
        // 注意后端返回的键名是 "数据资源入表总额（单位：万元）"
        const amountTableDataMap = new Map(amountRawForTable.map(item => [item['报告时间'], parseFloat(item['数据资源入表总额（单位：万元）']) || 0]));
        this.comboData.tableRows = sortedCategories.map(cat => ({
          '报告时间': cat,
          '入表数量': barDataMap.get(cat) || 0, // 从barDataMap取数量
          '入表总额（万元）': amountTableDataMap.get(cat) || 0 // 从amountTableDataMap取万元金额
        }));
        this.comboData.tableColumns = ['报告时间', '入表数量', '入表总额（万元）'];

        // Grouped Subject Data (Charts 2-3)
        const subjectBarsData = barRes.data || {};
        let rawCountSeriesData = subjectBarsData.countSeries || [];
        let rawSumSeriesData = subjectBarsData.sumSeries || [];
        
        const transformedCountSeries = this.restructureDataForGroupedBarChart(rawCountSeriesData, '报告时间', '入表科目', 'value');
        const transformedSumSeries = this.restructureDataForGroupedBarChart(rawSumSeriesData, '报告时间', '入表科目', 'value');
        
        this.groupedSubjectData = { // Re-assign to ensure reactivity if object was initially empty
            countSeries: transformedCountSeries,
            sumSeries: transformedSumSeries
        };
        // console.log('LChartRow: TRANSFORMED groupedSubjectData.countSeries:', JSON.parse(JSON.stringify(this.groupedSubjectData.countSeries)));

        // Subject Tables Data (Table set 3)
        this.subjectTables = tableRes.data || {};

        // Grouped Fields Data (Charts and Tables 4-7)
        this.groupedFields.forEach((f, idx) => {
          const rawBackendData = (groupedRes[idx] && groupedRes[idx].data) ? groupedRes[idx].data : []; 

          const structuredChartData = this.restructureDataForGroupedBarChart(
            rawBackendData, 
            '报告时间', 
            'name',     
            'value'     
          );
          this.$set(this.groupedCharts, f.field, structuredChartData);

          const cleanedFlatDataForTable = rawBackendData.map(d => ({
            ...d,
            value: parseFloat(d.value) 
          }));
          this.$set(this.flatTableData, f.field, cleanedFlatDataForTable);
          // console.log(`LChartRow: flatTableData for ${f.field}:`, JSON.parse(JSON.stringify(this.flatTableData[f.field])));
        });

        // Control Data (Last row of tables)
        this.controlData = (await axios.post('/api/lchart/control-summary', { filters: this.filters })).data || { original: [], classified: [] };

      } catch (err) {
        console.error('❌ 加载图表数据失败 LChartRow:', err);
        this.comboData = { barSeries: [], lineSeries: {}, tableRows: [], tableColumns: [] };
        this.groupedSubjectData = { countSeries: [], sumSeries: [] };
        this.subjectTables = {};
        this.groupedCharts = {};
        this.flatTableData = {};
        this.controlData = { original: [], classified: [] };
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
