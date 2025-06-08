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
      internalFilters: { // 只保留这一个 internalFilters 定义
        quarter: '',
        province_area: '',
        company: '',
        dataasset_content: '',
      },
      companyOptions: [],
      contentOptions: [],
      // 移除了这里重复的 internalFilters: {},
      loading: {
        company: false,
        content: false,
        download: false 
      },
      tempCompany: '',      // 这些 temp 变量当前在方法中没有被使用，
      tempDataassetContent: '' // 如果确实不需要，未来可以考虑移除
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
        // 如果上市公司下载需要排除列，可以在这里添加：
        // excludedColumns: ["实控人", "市值（亿元）", "市值规模"], 
        defaultFilename: `A股上市公司数据资产入表清单_${quarter}.pdf`,
        onStart: () => { this.loading.download = true; },
        onFinish: () => { this.loading.download = false; },
        onError: (msg) => { alert(msg); } // 或者使用 Element UI 的 Message 组件
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
  gap: 30px; /* 行之间的间距 */
}

.filter-row {
  display: flex;
  gap: 160px; /* 筛选项目之间的主间距，可以调大一些，参考图2 */
  align-items: center; 
}

.filter-item {
  display: flex;
  align-items: center;
  gap: 20px; /* 标签和输入框之间的间距 */
  flex: 0 1 auto; /* 项目本身不放大，允许缩小，宽度由内容决定。可以按需调整，例如 flex: 1 1 400px; 如果希望它们占据更多空间但有最大宽度限制 */
                  /* 如果希望每行固定放两个，可以考虑 flex-basis: calc(50% - 20px); (20px是gap的一半) */
}

.filter-item label {
  font-weight: bold;
  color: #2e3968;
  white-space: nowrap; /* 防止标签文字换行 */
  width: 130px;         /* 给标签一个固定宽度，你需要根据你最长的标签来调整这个值 */
                        /* 例如“所属证券行业分布：”这个标签比较长 */
  text-align: left;    /* 让文字在标签的固定宽度内靠右对齐，这样冒号就能对齐 */
}

/* 针对原生 select 元素 */
select {
  padding: 6px 10px; /* 调整内边距使其与el-select视觉高度接近 */
  border-radius: 4px;
  border: 1px solid #ccc;
  min-width: 200px; /* 给一个最小宽度 */
  width: 250px;     /* 设置一个固定宽度，或者用 max-width 控制 */
  height: 34px;     /* 与el-select视觉高度统一 */
  box-sizing: border-box;
}

/* 针对 Element UI 的 el-select 组件 */
.filter-item >>> .el-select {
  min-width: 200px; /* 最小宽度 */
  width: 250px;     /* 设置一个固定宽度，与原生select协调 */
  height: 34px;     /* 设置高度 */
  line-height: 32px; /* 调整行高以适应高度 */
  border-radius: 4px;
  border: 1px solid #ccc; /* 给 .el-select 外部容器也加上边框，使其看起来更像普通输入框 */
  padding: 0; /* 移除 el-select 外部容器可能有的padding */
  box-sizing: border-box;
}

.filter-item >>> .el-select .el-input__inner {
  border: none !important; /* 移除 el-select 内部 input 的边框 */
  height: 100% !important; /* 让内部input高度充满el-select容器 */
  line-height: inherit !important; /* 继承el-select的行高 */
  padding-left: 10px;
  padding-right: 30px; /* 为清除和下拉箭头留空间 */
  box-sizing: border-box;
}
.filter-item >>> .el-select .el-input .el-select__caret {
  line-height: inherit; /* 确保箭头也垂直居中 */
}
/* 针对 <li> 元素本身 (el-select-dropdown__item) */
::v-deep .el-select-dropdown__item.custom-all-option,
::v-deep .el-select-dropdown__item.custom-all-option:hover,
::v-deep .el-select-dropdown__item.custom-all-option.selected {
  color: #000000 !important;      /* 强制文字为黑色 */
  font-weight: normal !important; /* 强制字体不加粗 */
  /* Element UI 的 .selected 状态通常有背景色，我们这里不覆盖背景色，只改文字 */
}

/* 针对 <li> 元素内部的 <span> (实际显示文字的地方) */
::v-deep .el-select-dropdown__item.custom-all-option span,
::v-deep .el-select-dropdown__item.custom-all-option:hover span,
::v-deep .el-select-dropdown__item.custom-all-option.selected span {
  color: #000000 !important;      /* 强制文字为黑色 */
  font-weight: normal !important; /* 强制字体不加粗 */
}


/* 按钮行的布局 */
.row-actions {
  justify-content: flex-end; 
  width: 100%; /* 确保按钮行本身占据全部宽度，以便内容可以靠右 */
  margin-top: 10px; /* 与筛选条件行之间增加一点上边距 */
}
.action-buttons {
  display: flex;
  gap: 20px; 
}

/* 按钮样式 */
.confirm-btn,
.clear-all-btn {
  background-color: #2e3968;
  color: white;
  padding: 6px 22px;
  border: 1px solid #2e3968; 
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.3s ease, color 0.3s ease; /* 更平滑的过渡 */
  min-width: 100px;
  box-sizing: border-box;
  height: 34px; /* 与输入框高度一致 */
  display: inline-flex; /* 用于垂直居中文字 */
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
  align-items: center; /* 让所有按钮垂直对齐 */
  gap: 20px; /* 你原来是30px，可以按需调整，20px可能更紧凑些 */
}

.confirm-btn,
.clear-all-btn,
.download-btn { /* ▼▼▼ 将 .download-btn 加入到通用按钮样式组 ▼▼▼ */
  background-color: #2e3968;
  color: white;
  padding: 0 22px; /* 修改 padding 以适应固定高度和文字居中 */
  border: 1px solid #2e3968; 
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.3s ease, color 0.3s ease; 
  min-width: 100px; /* 保持最小宽度 */
  height: 34px; 
  display: inline-flex; 
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
}

/* 单独为 download-btn 的 el-button 组件调整，使其更好地融入 */
/* el-button 默认有自己的padding，可能需要微调 */
.download-btn.el-button { /* Element UI 按钮会有 el-button class */
  padding: 0 15px; /* 调整 el-button 的 padding */
  /* 如果继承的 min-width:100px 加上 el-icon ทำให้过宽，可以设小一点 */
  /* min-width: auto; */ 
}
.download-btn .el-icon--right {
  margin-left: 5px;
}


.confirm-btn:hover,
.clear-all-btn:hover,
.download-btn:hover { /* ▼▼▼ download-btn 也应用 hover 效果 ▼▼▼ */
  background-color: white;
  color: #2e3968;
}

.el-dropdown-menu {
  /* min-width: 120px; */ /* 根据内容调整 */
}
.el-dropdown-menu__item { /* Element UI v2.x */
  font-size: 14px;
  padding: 8px 20px;
}
.el-dropdown-menu__item:hover {
  background-color: #f5f5f5; /* 一个通用的 hover 背景色 */
  color: #2e3968;      /* hover 时的文字颜色 */
}

</style>