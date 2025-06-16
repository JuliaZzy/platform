<template>
  <div class="header">
    <div class="header-logos">
      <img src="@/assets/logo/实验室.png" alt="Lab Logo" />
    </div>
    <img class="header-bg-image" src="@/assets/header_image.png" alt="Header Image" />
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
.header {
  position: relative;
  width: 100%;
  text-align: left;
  font-size: 36px;
  letter-spacing: 8px;
  box-sizing: border-box;
}

.header .header-bg-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: auto;
  object-fit: cover;
  z-index: 1;
}

.header-logos {
  position: absolute;
  top: 20px;
  left: 76%;
  display: flex;
  justify-content: flex-end;
  z-index: 5;
}

.header-logos img {
  height: 90px;
  max-height: 200px;
  margin-top: 0;
}

.header-content {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  left: 15%;
  min-height: 300px;
  padding-top: 50px; 
  box-sizing: border-box;
}

.header-content .left {
  background-color: rgba(74, 90, 156, 0.8);
  padding: 30px 50px;
}

.header-content .left h1 {
  color: #FFFFFF;
  font-size: 42px;
  letter-spacing: 12px;
  margin: 0;
  line-height: 1.5;
}

@media (max-width: 768px) {
  .header {
    min-height: 300px;
    padding: 20px;
    text-align: center;
  }
  .header-content {
    left: 0;
    width: 100%;
    padding: 20px 0 0 0;
    justify-content: center;
    align-items: center;
    
    min-height: 300px;
  }
  .header-content .left {
    padding: 20px;
  }
  .header-content .left h1 {
    font-size: 28px;
    letter-spacing: 4px;
    line-height: 1.4;
  }
  .header-logos {
    top: 15px;
    left: 50%;
    transform: translateX(-50%);
  }
  .header-logos img {
    height: 40px;
    margin-top: 0;
  }
}
</style>