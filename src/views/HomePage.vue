<template>
  <div class="page-container">
    <!-- 页面头部 -->
    <div class="header">
      <img src="../assets/header_image.jpg" alt="Header Image"> <!-- 使用 Webpack 处理图片路径 -->
      <div class="header-content">
        <div class="left">
          <h1>中国企业数据资产<br>入表跟踪</h1>
          <p>Discover the Power of<br>Partnership for<br>Sustainable Water Solutions</p> <!-- 英文翻译 -->
        </div>
      </div>
    </div>

    <!-- 管理员登录按钮 -->
    <div class="admin">
      <button class="admin-login-button" @click="openLoginModal">管理员登录</button> <!-- 点击按钮打开登录弹窗 -->
    </div>

    <!-- 登录弹窗 -->
    <div v-if="isLoginModalVisible" class="login-modal">
      <div class="modal-content">
        <LoginForm @login-success="handleLoginSuccess" />
        <button class="login-close-button" @click="closeLoginModal">关闭</button>
      </div>
    </div>

    <div class="description">
      说明：管理员拥有全部功能，可以实现对底层数据（入表企业清单）的日常维护；普通用户无法增删改，只能浏览、查询和下载。
    </div>

    <!-- 状态展示区 -->
    <div class="status-row">
      <div
        class="status-box"
        v-for="(label, index) in labels"
        :key="index"
        :class="{ clickable: label === '非上市公司入表' || label === '上市公司入表' }"
        @click="handleStatusBoxClick(label)"
      >
      <h3>截至{{ currentMonth }}</h3>

        <p class="status-title">{{ label }}</p>

        <p class="status-number">
          {{
            label === '上市公司入表'
              ? listedCompanyCount
              : label === '非上市公司入表'
                ? nonListedCompanyCount
                : '暂无数据'
          }} 家
        </p>

        <div class="status-note">点击查看详情</div>
      </div>
    </div>

    <!-- 数据列表区 -->
    <div class="table-header-container">
      <!-- 榜单小标题 -->
      <div class="table-header">
        <i class="fas fa-list"></i> <span>榜单</span>
      </div>
    </div>

    <div class="grid-container">
      <!-- 第一个表格：上市公司入表清单 -->
      <div class="grid-item">
        <table>
          <tr><th colspan="2">上市公司入表清单</th></tr>
          <tr v-for="(company, index) in listedCompanies" :key="index">
            <td>{{ company.company_name }}</td>
          </tr>

          <!-- 显示分页按钮 -->
          <tr v-if="firstTablePages > 1">
            <td colspan="2" class="pagination">
              <button v-if="firstTablePage > 1" @click="changePage('firstTable', firstTablePage - 1)">上一页</button>
              <span>{{ firstTablePage }} / {{ firstTablePages }}</span>
              <button v-if="firstTablePage < firstTablePages" @click="changePage('firstTable', firstTablePage + 1)">下一页</button>
            </td>
          </tr>
        </table>
      </div>

      <!-- 第二个表格：非上市公司表清单 -->
      <div class="grid-item">
        <table>
          <tr><th colspan="2">非上市公司表清单</th></tr>
          <tr v-for="(company, index) in nonListedCompanies" :key="index">
            <td>{{ company.company_name }}</td>
          </tr>
          <tr v-if="secondTablePages > 1">
            <td colspan="2" class="pagination">
              <button v-if="secondTablePage > 1" @click="changePage('secondTable', secondTablePage - 1)">上一页</button>
              <span>{{ secondTablePage }} / {{ secondTablePages }}</span>
              <button v-if="secondTablePage < secondTablePages" @click="changePage('secondTable', secondTablePage + 1)">下一页</button>
            </td>
          </tr>
        </table>
      </div>

      <!-- 第三个表格：数据资产融资清单 -->
      <div class="grid-item">
        <table>
          <tr><th colspan="2">数据资产融资清单</th></tr>
          <tr><td>2025年3月</td></tr>
          <tr><td>2024年12月</td></tr>

          <tr v-if="thirdTablePages > 1">
            <td colspan="2" class="pagination">
              <button v-if="thirdTablePage > 1" @click="changePage('thirdTable', thirdTablePage - 1)">上一页</button>
              <span>{{ thirdTablePage }} / {{ thirdTablePages }}</span>
              <button v-if="thirdTablePage < thirdTablePages" @click="changePage('thirdTable', thirdTablePage + 1)">下一页</button>
            </td>
          </tr>
        </table>
      </div>
    </div>

    <!-- 底部链接区 -->
    <div class="footer">
      <div class="footer-overlay"></div>
      <img class="footer-bg" src="@/assets/footer_image.jpg" alt="Footer Image">
      <div class="footer-content">
        <a href="">联系我们</a>
        <a href="">反馈意见/申报</a>
      </div>
    </div>
  </div>
</template>



<script>
import axios from 'axios';
import LoginForm from '@/components/LoginForm.vue';

export default {
  name: 'App',
  components: {
    LoginForm
  },
  data() {
    return {
      currentMonth: '',  // 当前月份
      labels: [
        '上市公司入表',
        '非上市公司入表',
        '凭数据资产融资'
      ],
      listedCompanyCount: 0,  // 用于存储上市公司数量
      listedCompanies: [],    // 用于存储上市公司列表
      nonListedCompanyCount: 0,  // 用于存储非上市公司数量
      nonListedCompanies: [],    // 用于存储非上市公司列表
      firstTablePage: 1,         // 第一个表格当前页
      firstTablePages: 1,        // 第一个表格总页数
      secondTablePage: 1,        // 第二个表格当前页
      secondTablePages: 1,       // 第二个表格总页数
      thirdTablePage: 1,         // 第三个表格当前页
      thirdTablePages: 1,        // 第三个表格总页数
      isLoginModalVisible: false,  // 控制弹窗显示
    };
  },
  mounted() {
    // 获取当前日期
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    this.currentMonth = `${year}年${month}月`;

    // 获取所有公司数量和名称（分页数据）
    this.fetchCompanies();
  },
  methods: {
    // 获取所有表格的分页数据
    fetchCompanies() {
      // 获取第一个表格（上市公司数量）
      axios.get('/api/company/listed-companies-count')  // 获取公司数量
        .then((response) => {
          this.listedCompanyCount = response.data.count;
          this.firstTablePages = Math.ceil(this.listedCompanyCount / 10); // 计算总页数
        })
        .catch((error) => {
          console.error('获取上市公司数量失败:', error);
        });

      // 获取第一个表格的上市公司名称列表（分页）
      axios.get(`/api/company/listed-companies?page=${this.firstTablePage}`)
        .then((response) => {
          this.listedCompanies = response.data;  // 更新当前页的数据
        })
        .catch((error) => {
          console.error('获取上市公司列表失败:', error);
        });

      // 获取第二个表格（非上市公司数量）
      axios.get('/api/company/non-listed-companies-count')  // 获取公司数量
        .then((response) => {
          this.nonListedCompanyCount = response.data.count;
          this.secondTablePages = Math.ceil(this.nonListedCompanyCount / 10); // 计算总页数
        })
        .catch((error) => {
          console.error('获取非上市公司数量失败:', error);
        });

      // 获取第二个表格的非上市公司名称列表（分页）
      axios.get(`/api/company/non-listed-companies?page=${this.secondTablePage}`)
      .then((res) => {
        this.nonListedCompanies = res.data.data; // 当前页数据
        this.nonListedCompanyCount = res.data.total; // 总公司数
        this.secondTablePages = Math.ceil(this.nonListedCompanyCount / 10); // 页数
      });

      // 获取第三个表格的分页数据（假设第一页没有数据时）
      axios.get(`/api/company/non-listed-companies?page=${this.thirdTablePage}`)
        .then(response => {
          this.thirdTablePages = Math.ceil(response.data.count / 10);  // 计算总页数
        });
    },

    // 切换页面
    changePage(table, page) {
      // 根据不同的表格处理不同的页码
      if (page < 1 || page > this[`${table}Pages`]) return; // 不允许超出页码范围

      this[`${table}Page`] = page;
      this.fetchCompanies(); // 获取对应页的数据
    },

    // 打开登录弹窗
    openLoginModal() {
      this.isLoginModalVisible = true;
    },

    // 关闭登录弹窗
    closeLoginModal() {
      this.isLoginModalVisible = false;
    },

    // 登录成功后的回调
    handleLoginSuccess() {
      this.closeLoginModal();  // 关闭弹窗
      this.$router.push('/admin-page');  // 跳转到 AdminPage
    },

    // 点击“上市公司/非上市公司”进入数据可视化界面
    handleStatusBoxClick(label) {
      if (label === '非上市公司入表') {
        this.$router.push('/dashboard');
      } else if (label === '上市公司入表') {
        this.$router.push('/lsdashboard');
      }
    }
  },
};
</script>


<style scoped>
  .page-container {
    font-family: 'Arial', sans-serif;
    margin: 0;
    padding: 0; /* 去掉整体的上下左右间隙 */
    background-color: #F5F3F4; /* 浅灰色背景 */
    color: #333;
  }

  .header {
    background-color: rgba(0, 41, 82, 0.85);
    position: relative;
    width: 100%; /* 确保背景铺满整个屏幕 */
    min-height: 500px; /* 设置最小高度，确保内容不被压缩 */
    padding: 50px 30px;
    text-align: left;
    color: white;
    font-size: 36px;
    letter-spacing: 8px;
  }

  .header img {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%; /* 设置图片填充整个header */
    object-fit: cover;
    opacity: 0.2; /* 设置透明度，让文字更清晰 */
  }

  .header-content {
    position: relative;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    padding-left: 150px;
    top: 10px;
    height: 100%;
  }

  .header-content .left {
    border-left: 5px solid white;
    padding-left: 30px;
    margin-right: 30px;
  }

  .header-content .left h1 {
    font-size: 76px; /* 中文稍大 */
    letter-spacing: 16px;
    margin: 0;
    line-height: 1.3;
  }

  .header-content .left p {
    font-size: 36px; /* 英文稍小 */
    letter-spacing: 10px;
    margin: 10px 0 0;
  }

  /* 主界面 "管理员登录" 按钮的样式 */
  .admin, .admin:visited, .admin:active {
    position: absolute;
    right: 30px;
    top: 40px;
    text-decoration: none;
    color: #003049; /* 字体颜色为 header 的深蓝色 */
    font-size: 16px;
    padding: 6px 14px;
    z-index: 2;
  }

  .admin-login-button {
    background-color: #003049;  /* 深蓝色背景 */
    color: white;
    padding: 10px 20px;  /* 增大按钮的内边距 */
    border: none;
    border-radius: 8px;  /* 圆角效果 */
    font-size: 18px;      /* 设置字体大小 */
    cursor: pointer;
    transition: background-color 0.2s ease, color 0.2s ease; /* 增加过渡效果 */
  }

  .admin-login-button:hover {
    background-color: white;  /* 鼠标悬停时背景色变为白色 */
    color: #003049;           /* 鼠标悬停时字体颜色变为深蓝色 */
  }

  /* 弹窗样式 */
  .login-modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 999;
  }

  .modal-content {
    background-color: white;  /* 弹窗内容的背景 */
    border-radius: 10px;      /* 圆角 */
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); /* 阴影 */
    padding: 20px 20px 20px 20px;     /* 增加内边距 */
    width: 500px;             /* 弹窗宽度 */
    max-width: 90%;           /* 最大宽度设置为屏幕宽度的90% */
    height: 450px;             /* 根据内容自适应高度 */
    max-height: 80%;          /* 限制最大高度为屏幕高度的80% */
    overflow-y: auto;         /* 超出部分允许滚动 */
    position: relative;       /* 使按钮能够绝对定位 */
  }

  .login-close-button {
    background-color: transparent;  /* 背景透明 */
    color: #555555;  /* 深灰色字体 */
    font-size: 16px;  /* 设置字体大小 */
    border: none;  /* 去掉边框 */
    cursor: pointer;
    position: absolute;  /* 使用绝对定位 */
    bottom: 20px;  /* 距离底部 20px */
    right: 20px;   /* 距离右侧 20px */
    padding: 0;    /* 去除内边距 */
    text-decoration: none;  /* 移除文本下划线 */
    letter-spacing: 2px;  /* 增加字间距 */
  }

  .login-close-button:hover {
    color: #003049;  /* 鼠标悬停时字体颜色变为深蓝色 */
    text-decoration: underline;
    background-color: transparent !important; /* 确保背景色不会改变 */
  }

  .description {
    color: white;
    position: absolute;
    bottom: 200px;
    right: 10px;
    padding: 20px;
    font-size: 14px;
    z-index: 2; /* 确保描述在内容之上 */
  }

  .status-row {
    display: flex;
    justify-content: space-between;
    margin-top: -60px; /* 让 status-box 与 header 上方重叠 */
    margin-bottom: 50px;
    flex-wrap: wrap; /* 确保响应式布局 */
    margin-left: 50px; /* 左侧距离 30px */
    margin-right: 50px; /* 右侧距离 30px */
  }

  .status-box {
    background-color: white; /* 背景为白色 */
    width: 26%;
    padding: 30px 20px; /* 内边距 */
    text-align: center;
    font-size: 32px;
    color: #003049; /* 深蓝色文字 */
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1); /* 阴影效果增强 */
    position: relative;
    z-index: 1;
    border-radius: 10px; /* 边框圆角 */
    transition: all 0.2s ease; /* 添加平滑过渡效果 */
    min-height: 240px;
  }

  .status-box:hover {
    transform: scale(1.03); /* 鼠标悬停时放大至原有的110% */
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.2); /* 鼠标悬停时阴影更强 */
  }

  .status-box h3 {
    margin: 0;
    font-size: 20px; /* 标题的字体大小 */
    text-align: left;
    color: #003049; /* 深蓝色标题 */
    font-weight: bold; /* 突出标题 */
    margin-bottom: 10px; /* 让标题稍微向上移动 */
    text-transform: uppercase; /* 标题大写，增加视觉冲击力 */
  }

  .status-box p span.number {
    font-size: 36px; /* 数字字体更大 */
    font-weight: bold; /* 数字加粗 */
  }

  .status-box p span.unit {
    font-size: 30px; /* “家”字不加粗，字体稍小 */
    font-weight: normal; /* “家”字不加粗 */
  }

  .status-title {
    font-size: 30px;
    font-weight: normal;
    margin: 0;
    margin-top: 20px;
    color: #003049;
  }

  .status-number {
    font-size: 48px;
    font-weight: bold;
    margin: 10px 0 0;
    color: #003049;
  }

  .status-note {
    font-size: 14px;
    color: #003049;
    text-align: right;
    margin-top: 16px;
    text-transform: none;
    font-weight: normal;
  }

  /*点击样式*/ 
  .status-box.clickable {
    cursor: pointer;
  }
  .status-box.clickable:hover {
    transform: scale(1.05);
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.2);
  }

  /* 新增：独立设置榜单背景和高度 */
  .table-header-container {
    margin: 0 50px; /* 左右留白 50px */
    margin-top: 80px;
  }

  .table-header {
    background: linear-gradient(to right, #003049 0%, rgba(0, 48, 73, 0) 30%); /* 深蓝色背景 */
    border-radius: 5px;
    color: white;
    font-size: 24px;
    height: 50px; /* 高度 50px */
    display: flex;
    align-items: center;
    justify-content: left;
    padding-left: 10px;
    margin-bottom: 20px; /* 榜单与下方表格间的间距 */
  }

  .table-header i {
    margin-right: 10px;
    font-size: 20px;
  }

  .grid-container {
    display: grid;
    grid-template-columns: repeat(3, 1fr); /* 三个表格宽度保持一致 */
    gap: 120px;
    margin-top: 50px; /* 表格与 status box 底部的间距 80px */
    width: 93%; /* 修改为与 status-box 宽度一致 */
    margin-left: 50px;
    margin-right: 50px;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 16px;
  }

  th {
    color: #003049;
    font-weight: bold;
    padding: 14px;
    text-align: center;
    border-top: 2px solid #003049;
    border-bottom: 2px solid #003049;
  }

  td {
    padding: 8px;
    color: #333;
    border-bottom: 1px solid #d3d3d3;
  }

  tr:last-child td {
    border-bottom: 2px solid #003049;
  }

  .pagination {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 15px;
  }

  .pagination .page-info {
    font-size: 16px;
    color: #003049;
    flex: 2; /* 让页码占据中间区域 */
    text-align: center; /* 居中显示页码 */
  }

  .pagination button {
    background-color: #F5F3F4;
    color: #003049;
    border: none;
    padding: 8px 16px;
    border-radius: 5px;
    cursor: pointer;
  }

  .pagination button:hover {
    background-color: #003049;
    color: white;
  }

  .pagination .page-info {
    font-size: 16px;
    color: #003049;
  }

  .footer {
    position: relative;
    height: 150px;
    overflow: hidden;
    color: white;
    margin-top: 60px;
  }

  .footer a {
    color: white;
    font-size: 18px;
    text-decoration: none;
    transition: border-bottom 0.2s;
    border-bottom: 2px solid transparent;
  }

  .footer a:hover {
    border-bottom: 2px solid white;
  }

  .footer-bg {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    z-index: 1;
    object-position: bottom;

  }

  .footer-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 48, 73, 0.5); /* 深蓝色透明层 */
    z-index: 2;
  }

  .footer-content {
    position: relative;
    z-index: 3;
    height: 100%;
    display: flex;
    justify-content: flex-end;
    align-items: center;
    padding-right: 50px;
    gap: 30px;
  }

</style>
