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
      // 如果没有数据，直接返回空数组
      if (!flatData || flatData.length === 0) {
        return [];
      }

      // 步骤 1: 提取唯一且保持后端排序的X轴分类 (Categories)
      // 这是整个排序正确的关键。因为 flatData 已经由后端排好序，
      // 我们按顺序提取不重复的 categoryName，就得到了最终的X轴顺序。
      const categories = [];
      const seenCategories = new Set();
      flatData.forEach(item => {
        const categoryName = item[categoryNameKey];
        if (!seenCategories.has(categoryName)) {
          seenCategories.add(categoryName);
          categories.push(categoryName);
        }
      });

      // 步骤 2: 将扁平数据按季度（Series Name）进行分组
      // 我们得到一个 Map，键是季度名，值是那个季度的所有数据。
      const dataBySeries = new Map();
      flatData.forEach(item => {
        const seriesName = item[seriesNameKey];
        if (!dataBySeries.has(seriesName)) {
          dataBySeries.set(seriesName, []);
        }
        dataBySeries.get(seriesName).push(item);
      });

      // 步骤 3: 构建最终的 ECharts Series 结构
      // 确保每个季度的 series.data 都包含所有 categories，且顺序一致
      const sortedSeriesNames = Array.from(dataBySeries.keys()).sort(); // 对季度名进行排序 ('2024Q1', '2024Q2'...)
      
      const finalSeries = sortedSeriesNames.map(seriesName => {
        const seriesItems = dataBySeries.get(seriesName);
        // 为当前季度的已有数据创建一个快速查找的 Map
        const valueMap = new Map(
          seriesItems.map(item => [item[categoryNameKey], parseFloat(item[valueKey]) || 0])
        );

        return {
          name: seriesName,
          // 遍历我们排好序的 master categories 列表
          data: categories.map(category => ({
            [categoryNameKey]: category,
            // 如果当前季度有这个 category 的值，就用它；否则补 0
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

        // 添加 groupedFields 的请求
        this.groupedFields.forEach(f => {
          promises.push(axios.post('/api/lchart/group-field', {
            filters: this.filters,
            field: f.field
          }));
        });

        // ✅ 使用 await Promise.all(promises) 获取所有结果
        const results = await Promise.all(promises);

        // 解构结果
        const comboRes = results[0];
        const barRes = results[1];
        // ✅ “实控人”图表的结果是第三个
        const controllerRes = results[2]; 
        // 其他 groupedFields 的结果从索引 3 开始
        const groupedFieldsResponses = results.slice(3); 


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

        // ✅ 新增：处理“实控人”图表数据
        const rawControllerData = controllerRes.data ?? [];
        this.actualControllerData = this.restructureDataForGroupedBarChart(
          rawControllerData, 
          '报告时间', 
          'name',
          'value'
        );

        // Grouped Fields Data
        this.groupedFields.forEach((f, idx) => {
          // ✅ 使用可选链和空值合并运算符简化
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
          // ✅ 无论成功还是失败，最终都将加载状态设置为 false
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

.width-40 {
  flex: 0 0 43%; /* 不放大，不缩小，固定宽度 40% */
  min-width: 0;
}

.width-60 {
  flex: 0 0 50%; /* 不放大，不缩小，固定宽度 60% */
  min-width: 0;
}
</style>
