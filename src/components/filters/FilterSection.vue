<template>
  <div class="filter-section">
    <!-- 第一行 -->
    <div class="filter-row">
      <div class="filter-item">
        <label>入表时间：</label>
        <select v-model="startDate" @change="emitFilters">
          <option value="">开始时间</option>
          <option v-for="option in options.month_time" :key="option" :value="option">{{ option }}</option>
        </select>
        <span class="to-text">-</span>
        <select v-model="endDate" @change="emitFilters">
          <option value="">结束时间</option>
          <option v-for="option in options.month_time" :key="option" :value="option">{{ option }}</option>
        </select>
      </div>

      <div class="filter-item">
        <label>省级行政区：</label>
        <select v-model="province" @change="emitFilters">
          <option value="">全部</option>
          <option v-for="option in options.province_area" :key="option" :value="option">{{ option }}</option>
        </select>
      </div>
    </div>

    <!-- 第二行 -->
    <div class="filter-row">
      <div class="filter-item">
        <label>入表企业：</label>
        <el-select
          v-model="company"
          filterable
          remote
          clearable
          placeholder="请输入关键词"
          :remote-method="fetchCompanyOptions"
          :loading="loading.company"
          @change="emitFilters"
        >
          <el-option
            v-for="item in companyOptions"
            :key="item"
            :label="item"
            :value="item"
          />
        </el-select>
      </div>

      <div class="filter-item">
        <label>数据资产内容：</label>
        <el-select
          v-model="content"
          filterable
          remote
          clearable
          placeholder="请输入关键词"
          :remote-method="fetchContentOptions"
          :loading="loading.content"
          @change="emitFilters"
        >
          <el-option
            v-for="item in contentOptions"
            :key="item"
            :label="item"
            :value="item"
          />
        </el-select>
      </div>

      <div class="filter-item">
        <button class="clear-all-btn" @click="clearFilters">清除筛选</button>
      </div>

    </div>
  </div>
</template>


<script>
import axios from 'axios';

export default {
  name: 'FilterSection',
  data() {
    return {
      startDate: '',
      endDate: '',
      province: '',
      company: '',
      content: '',
      companyOptions: [],
      contentOptions: [],
      options: {
        month_time: [],
        province_area: []
      },
      loading: {
        company: false,
        content: false
      }
    };
  },
  mounted() {
    this.fetchOptions();
  },
  methods: {
    // 加载时间与省份（静态）
    fetchOptions() {
      axios.get('/api/nlasset/options')
        .then(res => {
          this.options.month_time = res.data.month_time || [];
          this.options.province_area = res.data.province_area || [];
        })
        .catch(err => {
          console.error('加载筛选项失败:', err);
        });
    },

    // 模糊搜索公司名称
    fetchCompanyOptions(query) {
      if (!query) return;
      this.loading.company = true;
      axios.get(`/api/nlasset/search/company?q=${query}`)
        .then(res => {
          this.companyOptions = res.data;
        })
        .finally(() => {
          this.loading.company = false;
        });
    },

    // 模糊搜索数据资产内容
    fetchContentOptions(query) {
      if (!query) return;
      this.loading.content = true;
      axios.get(`/api/nlasset/search/content?q=${query}`)
        .then(res => {
          this.contentOptions = res.data;
        })
        .finally(() => {
          this.loading.content = false;
        });
    },

    // 通知父组件更新筛选结果
    emitFilters() {
      this.$emit('filter-change', {
        startDate: this.startDate,
        endDate: this.endDate,
        province: this.province,
        company: this.company,
        content: this.content
      });
    },

    // 清除筛选
    clearFilters() {
      this.startDate = '';
      this.endDate = '';
      this.province = '';
      this.company = '';
      this.content = '';
      this.emitFilters();  // ✅ 清空后立刻通知父组件刷新
    }
  }
};
</script>


<style scoped>
.filter-section {
  background-color: white;
  padding: 20px 30px;
  border-radius: 8px;
  margin: 30px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.filter-row {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.filter-item {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1 1 300px;
}

.filter-item label {
  font-weight: bold;
  color: #003049;
}

select, input {
  padding: 6px 12px;
  border-radius: 6px;
  border: 1px solid #ccc;
  min-width: 160px;
}

.to-text {
  margin: 0 5px;
}

.clear-all-btn {
  background-color: #f0f0f0;
  color: #003049;
  border: 1px solid #ccc;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 13px;
  cursor: pointer;
  margin-left: auto;  /* ✅ 让它自动靠右 */
}

.clear-all-btn:hover {
  background-color: #003049;
  color: white;
  border-color: #003049;
}

</style>
