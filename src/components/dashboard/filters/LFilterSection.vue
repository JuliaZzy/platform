<template>
  <div class="filter-section">
    <div class="filter-row">
      <div class="filter-item">
        <label>报告时间：</label>
        <el-select
          v-model="internalFilters.quarter"
          placeholder="全部"
          clearable
          @change="handleImmediateFilterChange" 
          @clear="() => { internalFilters.quarter = ''; handleImmediateFilterChange(); }"
        >
          <el-option
            v-for="option in options.quarter"
            :key="option"
            :label="option"
            :value="option">
          </el-option>
        </el-select>
      </div>
      <div class="filter-item">
        <label>省份：</label>
        <el-select
          v-model="internalFilters.province_area"
          placeholder="全部"
          clearable
          @change="handleImmediateFilterChange"
          @clear="() => { internalFilters.province_area = ''; handleImmediateFilterChange(); }"
        >
          <el-option
            v-for="option in options.province_area"
            :key="option"
            :label="option"
            :value="option">
          </el-option>
        </el-select>
      </div>
    </div>

    <div class="filter-row">
      <div class="filter-item">
        <label>公司：</label>
        <el-select
          v-model="internalFilters.company"
          filterable
          remote
          clearable
          placeholder="请输入公司关键词"
          :remote-method="fetchCompanyOptions"
          :loading="loading.company"
          @change="handleElSelectChange" 
          @clear="() => { internalFilters.company = ''; handleElSelectChange(); }"
        >
          <el-option v-for="item in companyOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </div>
      <div class="filter-item">
        <label>所属证券行业分布：</label>
        <el-select
          v-model="internalFilters.dataasset_content"
          filterable
          remote
          clearable
          placeholder="请输入行业关键词"
          :remote-method="fetchContentOptions"
          :loading="loading.content"
          @change="handleElSelectChange"
          @clear="() => { internalFilters.dataasset_content = ''; handleElSelectChange(); }"
        >
          <el-option v-for="item in contentOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </div>
    </div>

    <div class="filter-row row-actions">
      <div class="action-buttons">
        <button class="confirm-btn" @click="confirmFilters">确认</button>
        <button class="clear-all-btn" @click="clearAllFilters">清除筛选</button>
        <el-dropdown @command="handleDownloadCommand" trigger="hover">
          <el-button class="download-btn">
            下载数据<i class="el-icon-arrow-down el-icon--right"></i>
          </el-button>
          <el-dropdown-menu slot="dropdown">
            <el-dropdown-item 
              v-for="quarterValue in options.quarter" 
              :key="quarterValue" 
              :command="quarterValue">
            {{ quarterValue }} 数据
            </el-dropdown-item>
            <el-dropdown-item v-if="!options.quarter || options.quarter.length === 0" disabled>
              无可用报告时间
            </el-dropdown-item>
          </el-dropdown-menu>
        </el-dropdown>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import { downloadPdf } from '@/utils/pdfDownloader.js';

export default {
  name: 'LFilterSection',
  props: {
    filters: { type: Object, required: true }, 
    options: { type: Object, required: true }, 
    apiPrefix: { type: String, required: true },
  },
  data() {
    return {
      internalFilters: {
        quarter: '',
        province_area: '',
        company: '',
        dataasset_content: '',
      },
      companyOptions: [],
      contentOptions: [],
      loading: {
        company: false,
        content: false,
        download: false 
      },
      tempCompany: '',
      tempDataassetContent: ''
    };
  },
  watch: {
    filters: {
      immediate: true,
      deep: true,
      handler(newVal) {
        this.internalFilters.quarter = newVal.quarter || '';
        this.internalFilters.province_area = newVal.province_area || '';
        this.internalFilters.company = newVal.company || '';
        this.internalFilters.dataasset_content = newVal.dataasset_content || '';
        
        if (newVal.company && (!this.companyOptions.length || !this.companyOptions.some(opt => opt.value === newVal.company))) {
            this.fetchCompanyOptions(newVal.company, true);
        }
        if (newVal.dataasset_content && (!this.contentOptions.length || !this.contentOptions.some(opt => opt.value === newVal.dataasset_content))) {
            this.fetchContentOptions(newVal.dataasset_content, true);
        }
      }
    }
  },
  methods: {
    fetchCompanyOptions(query, setValueAsOption = false) {
      if (!query && !setValueAsOption) {
        this.companyOptions = [];
        return;
      }
      if (!query && setValueAsOption) return;

      this.loading.company = true;
      axios
        .get(`${this.apiPrefix}/search/company?q=${query}`)
        .then(res => {
          this.companyOptions = (res.data || []).map(item => ({ label: String(item), value: String(item) }));
          if (setValueAsOption && query && !this.companyOptions.some(opt => opt.value === query)) {
            this.companyOptions.unshift({ label: String(query), value: String(query) });
          }
        })
        .catch(err => {
          console.error("Error fetching company options:", err);
          this.companyOptions = [];
        })
        .finally(() => {
          this.loading.company = false;
        });
    },
    fetchContentOptions(query, setValueAsOption = false) {
      if (!query && !setValueAsOption) {
        this.contentOptions = [];
        return;
      }
      if (!query && setValueAsOption) return;
      
      this.loading.content = true;
      axios
        .get(`${this.apiPrefix}/search/content?q=${query}`)
        .then(res => {
          this.contentOptions = (res.data || []).map(item => ({ label: String(item), value: String(item) }));
          if (setValueAsOption && query && !this.contentOptions.some(opt => opt.value === query)) {
            this.contentOptions.unshift({ label: String(query), value: String(query) });
          }
        })
        .catch(err => {
          console.error("Error fetching content options:", err);
          this.contentOptions = [];
        })
        .finally(() => {
          this.loading.content = false;
        });
    },
    handleImmediateFilterChange() {
    },
    handleElSelectChange() {
    },
    confirmFilters() {
      this.$emit('filter-change', { ...this.internalFilters });
    },
    clearAllFilters() {
      this.internalFilters.quarter = '';
      this.internalFilters.province_area = '';
      this.internalFilters.company = '';
      this.internalFilters.dataasset_content = '';
      this.companyOptions = []; 
      this.contentOptions = []; 
      this.confirmFilters(); // 清除筛选后，立即应用（将空筛选条件传递给父组件）
    },
    async handleDownloadCommand(quarter) {
      if (!quarter) return;
      await downloadPdf({
        apiUrl: `${this.apiPrefix}/export`,
        filters: { quarter: quarter },
        // excludedColumns: ["实控人", "市值（亿元）", "市值规模"], 
        defaultFilename: `A股上市公司数据资产入表清单_${quarter}.pdf`,
        onStart: () => { this.loading.download = true; },
        onFinish: () => { this.loading.download = false; },
        onError: (msg) => { alert(msg); }
      });
    }
  }
};
</script>


<style scoped>
.filter-section {
  background-color: white;
  padding: 20px 30px;
  border-radius: 8px;
  margin: 0 30px 30px 30px; 
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.filter-row {
  display: flex;
  gap: 160px;
  align-items: center; 
}

.filter-item {
  display: flex;
  align-items: center;
  gap: 20px;
  flex: 0 1 auto;
}

.filter-item label {
  font-weight: bold;
  color: #2e3968;
  white-space: nowrap;
  width: 130px;
  text-align: left;
}

select {
  padding: 6px 10px;
  border-radius: 4px;
  border: 1px solid #ccc;
  min-width: 200px;
  width: 250px;
  height: 34px;
  box-sizing: border-box;
}

.filter-item >>> .el-select {
  min-width: 200px;
  width: 250px;
  height: 34px;
  line-height: 32px;
  border-radius: 4px;
  border: 1px solid #ccc;
  padding: 0;
  box-sizing: border-box;
}

.filter-item >>> .el-select .el-input__inner {
  border: none !important;
  height: 100% !important;
  line-height: inherit !important;
  padding-left: 10px;
  padding-right: 30px;
  box-sizing: border-box;
}
.filter-item >>> .el-select .el-input .el-select__caret {
  line-height: inherit;
}
::v-deep .el-select-dropdown__item.custom-all-option,
::v-deep .el-select-dropdown__item.custom-all-option:hover,
::v-deep .el-select-dropdown__item.custom-all-option.selected {
  color: #000000 !important;
  font-weight: normal !important;
}

::v-deep .el-select-dropdown__item.custom-all-option span,
::v-deep .el-select-dropdown__item.custom-all-option:hover span,
::v-deep .el-select-dropdown__item.custom-all-option.selected span {
  color: #000000 !important;
  font-weight: normal !important;
}

.row-actions {
  justify-content: flex-end; 
  width: 100%;
  margin-top: 10px;
}
.action-buttons {
  display: flex;
  gap: 20px; 
}

.confirm-btn,
.clear-all-btn {
  background-color: #2e3968;
  color: white;
  padding: 6px 22px;
  border: 1px solid #2e3968; 
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.3s ease, color 0.3s ease;
  min-width: 100px;
  box-sizing: border-box;
  height: 34px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.confirm-btn:hover,
.clear-all-btn:hover {
  background-color: white;
  color: #2e3968;
}

.row-actions {
  justify-content: flex-end; 
  width: 100%; 
  margin-top: 10px; 
}
.action-buttons {
  display: flex;
  align-items: center;
  gap: 20px;
}

.confirm-btn,
.clear-all-btn,
.download-btn {
  background-color: #2e3968;
  color: white;
  padding: 0 22px;
  border: 1px solid #2e3968; 
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.3s ease, color 0.3s ease; 
  min-width: 100px;
  height: 34px; 
  display: inline-flex; 
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
}

.download-btn.el-button {
  padding: 0 15px;
  /* min-width: auto; */ 
}
.download-btn .el-icon--right {
  margin-left: 5px;
}


.confirm-btn:hover,
.clear-all-btn:hover,
.download-btn:hover {
  background-color: white;
  color: #2e3968;
}

.el-dropdown-menu {
  /* min-width: 120px; */
}
.el-dropdown-menu__item {
  font-size: 14px;
  padding: 8px 20px;
}
.el-dropdown-menu__item:hover {
  background-color: #f5f5f5;
  color: #2e3968;
}

@media (max-width: 992px) {
  .filter-section {
    padding: 15px;
    gap: 20px;
  }

  .filter-row {
    flex-direction: column;
    gap: 20px;
    align-items: stretch;
  }

  .filter-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .filter-item label {
    width: auto;
  }

  .filter-item >>> .el-select {
    width: 100%;
    min-width: unset;
  }

  .row-actions {
    justify-content: flex-start;
    margin-top: 0; 
  }

  .action-buttons {
    flex-direction: column;
    align-items: stretch;
    width: 100%;
    gap: 10px;
  }

  .confirm-btn,
  .clear-all-btn,
  .download-btn {
    width: 100%;
    margin: 0;
    padding: 12px 0;
    font-size: 15px;
  }

  .download-btn.el-button {
    padding: 12px 15px;
  }
}

</style>