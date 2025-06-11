<template>
  <div class="footer">
    <div class="footer-overlay"></div>
    <img class="footer-bg" src="@/assets/footer_image.jpg" alt="Footer Image" />
    <div class="admin">
      <button class="admin-login-button" @click="$emit('open-login')">管理员登录</button>
    </div>
    <div class="footer-content">
      <div class="footer-links">
        <p>联系我们：dfcc@saif.sjtu.edu.cn</p>
        <a href="#" @click.prevent="$emit('open-feedback')">反馈意见/申报</a>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'PageFooter'
};
</script>

<style scoped>
/* 从 HomePage.vue 剪切所有与 .footer 和 .admin 相关的样式 */
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
  color: #f0dfc7;
  border-bottom: 1px solid #f0dfc7;
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
  opacity: 0.8;
}
.footer-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 48, 73, 0.4);
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
.footer-links {
  text-align: left;
}
.footer-links p {
  margin: 5px 0;
  color: white;
  font-size: 16px;
}
.footer-links a {
  color: white;
  font-size: 16px;
  text-decoration: none;
  transition: border-bottom 0.2s;
  border-bottom: 1px solid transparent;
  display: inline-block;
  margin: 5px 0;
  cursor: pointer;
}
.admin, .admin:visited, .admin:active {
  position: absolute;
  left: 30px;
  top: auto;
  bottom: 40px;
  text-decoration: none;
  color: #2e3968;
  font-size: 16px;
  padding: 6px 14px;
  z-index: 200;
}
.admin-login-button {
  background-color: white;
  color: #2e3968;
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-size: 18px;
  cursor: pointer;
  transition: background-color 0.2s ease, color 0.2s ease;
}
.admin-login-button:hover {
  background-color: #BDA36C;
  color: white;
}
@media (max-width: 768px) {
  .footer-content {
    justify-content: center;
    padding-right: 20px;
    padding-left: 20px;
    flex-direction: column;
    gap: 15px;
    text-align: center;
  }
  .admin {
    position: static;
    order: 2;
  }
  .footer-links {
    order: 1;
    text-align: center;
  }
}
</style>