<template>
  <div class="dashboard-page">
    <LoadingSpinner :visible="isLoading" />

    <div class="dashboard-title-block" v-show="!isLoading">
      <h1 class="dashboard-title">上市公司数据资产情况</h1>
      <p class="dashboard-subtitle">Overview of Listed Company Data Assets</p>
    </div>
    
    <transition name="slide-fade">
    <LFilterSection
      v-if="!isLoading && initialOptionsLoaded" 
      :filters="currentFilters"    
      :options="filterDropdownOptions" 
      :api-prefix="'/api/lasset'"   
      @filter-change="handleFilterApply" 
      ref="lFilterSectionRef"
    />
    </transition>

    <div class="dashboard-container" v-show="!isLoading">
      <LChartRow :filters="activeFilters" /> 
    </div>
  </div>
</template>

<script>
import LFilterSection from '@/components/dashboard/filters/LFilterSection.vue'; 
import LChartRow from '@/components/dashboard/LChartRow.vue';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';
import axios from 'axios';

export default {
  name: 'LSDashboardPage',
  components: {
    LFilterSection,
    LChartRow,
    LoadingSpinner
  },
  data() {
    return {
      isLoading: true,
      initialOptionsLoaded: false, // 新增状态，用于控制 LFilterSection 的渲染
      currentFilters: { 
        quarter: '',
        province_area: '',
        company: '',
        dataasset_content: '',
      },
      activeFilters: {}, 
      filterDropdownOptions: { 
        quarter: [], 
        province_area: [] 
      }
    };
  },
  methods: {
    handleFilterApply(confirmedFilters) {
      // console.log('LSDashboardPage: Filters confirmed and applied', confirmedFilters);
      this.activeFilters = { ...confirmedFilters }; 
      this.currentFilters = { ...confirmedFilters }; // 保持筛选框状态与激活状态一致
    },
    async fetchInitialData() {
      this.isLoading = true;
      try {
        // 从后端获取筛选下拉框的选项数据
        // 假设上市公司筛选选项的API是 '/api/lasset/summary' (基于你提供的后端文件名和结构)
        const response = await axios.post('/api/lasset/summary', { 
            filters: {}, // 初始获取选项时可能不需要筛选条件
            page: 1,     // summary接口可能也用于其他数据，带上默认分页参数
            pageSize: 1 
        }); 
        
        if (response.data && response.data.options) {
          this.filterDropdownOptions.quarter = response.data.options.quarter || [];
          this.filterDropdownOptions.province_area = response.data.options.province_area || [];
          this.initialOptionsLoaded = true; // 标记选项已加载
        } else {
          console.error('Failed to load filter options: No options data in response');
          this.filterDropdownOptions = { quarter: [], province_area: [] }; // 保证是数组
        }

        // 初始化 activeFilters 以便 LChartRow 首次加载数据
        // 可以在这里从路由参数或其他地方读取初始筛选条件并设置 currentFilters
        this.activeFilters = { ...this.currentFilters }; 

      } catch (error) {
        console.error('Error fetching initial data for LSDashboardPage:', error);
        this.filterDropdownOptions = { quarter: [], province_area: [] }; // 出错时保证是数组
        this.initialOptionsLoaded = true; // 即使出错也允许页面继续，避免筛选区不显示
      } finally {
        this.isLoading = false;
      }
    }
  },
  async mounted() {
    await this.fetchInitialData();
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
    overflow-x: hidden; /* 彻底移除横向滚动条 */
  }

  .slide-fade-enter-active {
    transition: all 0.3s ease-out; /* 定义进入动画的耗时和缓动函数 */
  }

  .slide-fade-leave-active {
    transition: all 0.3s cubic-bezier(1, 0.5, 0.8, 1); /* 定义离开动画 */
  }

  .slide-fade-enter-from,
  .slide-fade-leave-to {
    transform: translateY(-20px); /* 起始时向上偏移20px (使其有向下滑动的感觉) */
    opacity: 0;                  /* 起始时透明 */
    max-height: 0;               /* 起始时最大高度为0 (用于平滑高度展开) */
    overflow: hidden;            /* 配合max-height，确保内容不溢出 */
    margin-top: 0 !important;    /* 确保动画期间的margin正确 */
    margin-bottom: 0 !important;
    padding-top: 0 !important;
    padding-bottom: 0 !important;
    border-width: 0 !important; /* 如果有边框，也一并过渡 */
  }

  .slide-fade-enter-to,
  .slide-fade-leave-from {
    opacity: 1;
    transform: translateY(0);
    /* LFilterSection 自身有 margin: 0 30px 30px 30px; 和 padding: 20px 30px; */
    /* 我们需要一个足够大的 max-height 来容纳它 */
    max-height: 500px; /* ！！！重要：这个值需要大于 LFilterSection 的实际最大高度 */
                        /* 你可以根据 LFilterSection 的内容估算一个值，例如它的3行内容+padding+margin */
    overflow: hidden; /* 动画结束前保持 hidden，动画结束后Vue会移除这些class，恢复正常overflow */
  }

</style>
