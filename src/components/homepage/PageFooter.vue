<template>
  <div class="footer-container">
    <nav class="footer-nav">
      <a href="#" @click.prevent="$emit('open-login')">管理员登录</a>
      <span class="separator">|</span>
      <span class="contact-info">联系我们：dfcc@saif.sjtu.edu.cn</span>
      <span class="separator">|</span>
      <a href="#" @click.prevent="$emit('open-feedback')">反馈意见/申报</a>
      <span class="separator">|</span>
      <a href="#" @click.prevent="$emit('open-disclaimer')">免责声明</a>
    </nav>
  </div>
</template>

<script>
export default {
  name: 'PageFooter'
};
</script>

<style scoped>
.footer-container {
  padding: 40px 20px;
  background-color: transparent;
}

.footer-nav {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px 20px;
}

.footer-nav a,
.footer-nav .contact-info {
  color: #555;
  font-size: 14px;
  text-decoration: none;
}

.footer-nav a {
  transition: color 0.2s ease;
}

.footer-nav a:hover {
  color: #171d8f;
  text-decoration: underline;
}

.separator {
  color: #ccc;
  font-size: 14px;
}

@media (max-width: 768px) {
  .footer-nav {
    flex-direction: column;
    gap: 15px;
  }
  .separator {
    display: none;
  }
}
</style>