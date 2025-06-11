<template>
  <div class="header">
    <div class="header-logos">
      <img src="@/assets/logo/实验室.png" alt="Lab Logo" />
    </div>
    <img class="header-bg-image" src="@/assets/header_image.jpg" alt="Header Image" />
    <div class="header-content">
      <div class="left">
        <h1>中国企业数据资产<br />入表名录</h1>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'PageHeader'
};
</script>

<style scoped>
/* 从 HomePage.vue 剪切所有与 .header 相关的样式到这里 */
.header {
  background-color: #2e3968;
  position: relative;
  width: 100%;
  min-height: 470px;
  padding: 80px 30px;
  text-align: left;
  color: #BDA36C;
  font-size: 36px;
  letter-spacing: 8px;
  box-sizing: border-box;
}

.header .header-bg-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0.2;
}

.header-logos {
  position: absolute;
  top: 30px;
  left: 85%;
  display: flex;
  align-items: right;
  z-index: 5;
}

.header-logos img {
  height: 100px;
  max-height: 200px;
}

.header-content {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding-left: 150px;
  top: 60px;
  height: 100%;
}

.header-content .left {
  border-left: 5px solid #BDA36C;
  padding-left: 30px;
  margin-right: 30px;
  line-height: 55px;
  top: 10px;
}

.header-content .left h1 {
  font-size: 76px;
  letter-spacing: 16px;
  margin: 0;
  line-height: 1.3;
  top: 20px;
}

/* 响应式样式也一并移入 */
@media (max-width: 768px) {
  .header {
    min-height: 300px;
    padding: 60px 15px 20px 15px;
    text-align: center;
  }
  .header-content {
    padding-left: 0;
    justify-content: center;
    top: 30px;
  }
  .header-content .left {
    border-left: 4px solid #BDA36C;
    padding-left: 20px;
    margin-right: 0;
  }
  .header-content .left h1 {
    font-size: 36px;
    letter-spacing: 4px;
    line-height: 1.4;
  }
  .header-logos {
    top: 15px;
    left: 50%;
    transform: translateX(-50%);
    align-items: center;
  }
  .header-logos img {
    height: 60px;
  }
}
</style>