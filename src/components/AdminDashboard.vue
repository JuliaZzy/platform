<template>
  <div class="dashboard-container">
    <div class="dashboard-header">
      <h2>管理员仪表盘</h2>
      <p>在这里可以管理和维护非上市公司数据。</p>
    </div>

    <!-- 非上市公司管理部分 -->
    <div class="dashboard-section">
      <h3>非上市公司数据</h3>
      <div class="button-container">
        <button @click="viewData">查看数据</button>
        <button @click="editData">编辑数据</button>
        <button @click="addData">添加新公司</button>
      </div>
    </div>

    <!-- 数据维护部分 -->
    <div class="dashboard-section">
      <h3>数据维护</h3>
      <div class="button-container">
        <button @click="importData">导入数据</button>
        <button @click="exportData">导出数据</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "AdminDashboard",
  methods: {
    // 查看数据
    viewData() {
      this.$router.push('/view-data');  // 假设你有一个查看数据的页面
    },
    // 编辑数据
    editData() {
      this.$router.push('/edit-data');  // 假设你有一个编辑数据的页面
    },
    // 添加新公司
    addData() {
      this.$router.push('/add-new-company');  // 假设你有一个添加新公司的页面
    },
    // 导入数据
    importData() {
      alert("导入数据功能");
      // 你可以使用文件上传等功能实现
    },
    // 导出数据
    exportData() {
      alert("导出数据功能");
      // 你可以将数据导出为文件，例如 CSV
    }
  }
};
</script>

<style scoped>
.dashboard-container {
  padding: 20px;
}

.dashboard-header {
  text-align: center;
}

.dashboard-section {
  margin-top: 30px;
}

.button-container {
  display: flex;
  justify-content: space-around;
}

button {
  padding: 10px 20px;
  font-size: 16px;
  cursor: pointer;
}
</style>