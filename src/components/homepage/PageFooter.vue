<template>
  <div class="footer-container">
    <nav class="footer-nav">
      <a href="#" @click.prevent="$emit('open-login')">管理员登录</a>
      <span class="separator">|</span>
      <span class="contact-info">联系我们：dfcc@saif.sjtu.edu.cn</span>
      <span class="separator">|</span>
      <a href="#" @click.prevent="$emit('open-feedback')">反馈意见/申报</a>
    </nav>
  </div>
</template>

<script>
export default {
  name: 'PageFooter'
};
</script>

<style scoped>
/* 1. 外层容器样式 */
.footer-container {
  /* 背景透明，只提供上下边距 */
  padding: 40px 20px;
  background-color: transparent;
}

/* 2. 导航链接的容器 */
.footer-nav {
  display: flex;
  justify-content: center; /* 水平居中 */
  align-items: center;
  flex-wrap: wrap; /* 在小屏幕上允许换行 */
  gap: 10px 20px; /* 控制行间距和列间距 */
}

/* 3. 链接和联系信息的通用样式 */
.footer-nav a,
.footer-nav .contact-info {
  color: #555; /* 深灰色文字 */
  font-size: 14px;
  text-decoration: none;
}

/* 4. 可点击链接的悬浮效果 */
.footer-nav a {
  transition: color 0.2s ease;
}

.footer-nav a:hover {
  color: #171d8f; /* SAIF 蓝色 */
  text-decoration: underline;
}

/* 5. 分隔符样式 */
.separator {
  color: #ccc; /* 浅灰色分隔符 */
  font-size: 14px;
}

/* 响应式布局：在小屏幕上，隐藏分隔符，让每个项目占一行 */
@media (max-width: 768px) {
  .footer-nav {
    flex-direction: column; /* 垂直排列 */
    gap: 15px; /* 调整垂直间距 */
  }
  .separator {
    display: none; /* 隐藏分隔符 */
  }
}
</style>