<template>
  <div class="filter-section">
    <!-- 第一行 -->
    <div class="filter-row">
      <div class="filter-item">
        <label>入表时间：</label>
        <select v-model="startDate" ><!-- ✅ -->
          <option value="">开始时间</option>
          <option v-for="option in options.month_time" :key="option" :value="option">{{ option }}</option>
        </select>
        <span class="to-text">-</span>
        <select v-model="endDate" ><!-- ✅ -->
          <option value="">结束时间</option>
          <option v-for="option in options.month_time" :key="option" :value="option">{{ option }}</option>
        </select>
      </div>
      <div class="filter-item">
        <label>省级行政区：</label>
        <select v-model="province" ><!-- ✅ -->
          <option value="">全部</option>
          <option v-for="option in options.province_area" :key="option" :value="option">{{ option }}</option>
        </select>
      </div>
    </div>

    <!-- 第二行 -->
    <div class="filter-row">
      <div class="filter-item">
        <label>入表企业：</label>
        <el-select @clear="onCompanyCleared"
          v-model="company"
          filterable
          remote
          clearable
          placeholder="请输入关键词"
          :remote-method="fetchCompanyOptions"
          :loading="loading.company"
        >
          <el-option
            v-for="item in companyOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </div>
      <div class="filter-item">
        <label>数据资产内容：</label>
        <el-select @clear="onContentCleared"
          v-model="content"
          filterable
          remote
          clearable
          placeholder="请输入关键词"
          :remote-method="fetchContentOptions"
          :loading="loading.content"
        >
          <el-option
            v-for="item in contentOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </div>
    </div>

    <!-- 第三行 -->
    <div class="filter-row">
      <div class="filter-item">
        <button class="confirm-btn" @click="confirmFilters">确认</button>
        <button class="clear-all-btn" @click="clearFilters">清除筛选</button>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'FilterSection',
  props: {
    apiPrefix: { type: String, required: true },
    options: { type: Object, required: true },
    filters: { type: Object, required: true }
  },
  data() {
    return {
      startDate: '',
      endDate: '',
      province: '',
      company: '',
      content: '',
      companyOptions: [],
      contentOptions: [],
      loading: {
        company: false,
        content: false
      }
    };
  },
  watch: {
    filters: {
      immediate: true,
      deep: true,
      handler(newVal) {
        this.startDate = newVal.startDate || '';
        this.endDate = newVal.endDate || '';
        this.province = newVal.province || '';
        this.company = newVal.company || '';
        this.content = newVal.content || '';
      }
    }
  },
  methods: {
    fetchCompanyOptions(query) {
      if (!query) return;
      this.loading.company = true;
      axios
        .get(`${this.apiPrefix}/search/company?q=${query}`)
        .then(res => {
          this.companyOptions = (res.data || []).map(item => ({
            label: item,
            value: item
          }));
        })
        .finally(() => {
          this.loading.company = false;
        });
    },
    fetchContentOptions(query) {
      if (!query) return;
      this.loading.content = true;
      axios
        .get(`${this.apiPrefix}/search/content?q=${query}`)
        .then(res => {
          this.contentOptions = (res.data || []).map(item => ({
            label: item,
            value: item
          }));
        })
        .finally(() => {
          this.loading.content = false;
        });
    },
    confirmFilters() {
      this.$emit('filter-change', {
        startDate: this.startDate,
        endDate: this.endDate,
        province: this.province,
        company: this.company,
        content: this.content
      });
    },
    clearFilters() {
      this.startDate = '';
      this.endDate = '';
      this.province = '';
      this.company = '';
      this.content = '';
      this.confirmFilters();
    },
    onCompanyCleared() {
      this.company = '';
      this.confirmFilters();
    },
    onContentCleared() {
      this.content = '';
      this.confirmFilters();
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

  .confirm-btn,
  .clear-all-btn {
    background-color: #003049;
    color: white;
    padding: 6px 22px;
    border-radius: 4px;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.3s ease;
    margin-top: 10px;
  }

  .confirm-btn:hover,
  .clear-all-btn:hover {
    background-color: white;
    color: #003049;
  }

</style>