<template>
  <div class="filter-section">
    <!-- 第一行 -->
    <div class="filter-row">
      <div class="filter-item">
        <label>入表时间：</label>
        <el-select 
          v-model="startDate" 
          placeholder="开始时间"
          clearable
          @clear="() => { startDate = ''; }"
        >
        <el-option v-for="option in options.month_time" :key="option" :label="option" :value="option"></el-option>
        </el-select>
        <span class="to-text">-</span>
        <el-select 
          v-model="endDate" 
          placeholder="结束时间"
          clearable
          @clear="() => { endDate = ''; }"
        >
          <el-option v-for="option in options.month_time" :key="option" :label="option" :value="option"></el-option>
        </el-select>
      </div>
      <div class="filter-item">
        <label>省级行政区：</label>
        <el-select 
          v-model="province" 
          placeholder="全部"
          clearable
          @clear="() => { province = ''; }"
        >
          <el-option v-for="option in options.province_area" :key="option" :label="option" :value="option"></el-option>
        </el-select>
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
    <div class="filter-row row-actions">
      <div class="action-buttons">
        <button class="confirm-btn" @click="confirmFilters">确认</button>
        <button class="clear-all-btn" @click="clearFilters">清除筛选</button>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'NLFilterSection',
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
      const payload = { 
        startDate: this.startDate,
        endDate: this.endDate,
        province: this.province,
        company: this.company,
        content: this.content 
      };

      this.$emit('filter-change', payload);
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
    color: #2e3968;
    white-space: nowrap;
    width: 110px;
    text-align: left;
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

  .row-actions {
    justify-content: flex-end;
  }

  .action-buttons {
    display: flex;
    gap: 30px;
    margin-right: 100px;
  }
  .confirm-btn,
  .clear-all-btn {
    background-color: #2e3968;
    color: white;
    padding: 6px 22px;
    border-radius: 4px;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.3s ease;
    margin-top: 20px;
    min-width: 100px;
  }

  .confirm-btn:hover,
  .clear-all-btn:hover {
    background-color: white;
    color: #2e3968;
  }

</style>