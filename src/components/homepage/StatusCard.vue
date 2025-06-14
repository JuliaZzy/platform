<template>
  <div class="status-box clickable" @click="$emit('card-click')">
    <h3>{{ dateText }}</h3>
    <p class="status-title">{{ title }}</p>
    <p class="status-number">{{ count }} {{ unit }}</p>
    <div class="status-note">点击查看详情</div>
  </div>
</template>

<script>
export default {
  name: 'StatusCard',
  props: {
    dateText: { type: String, required: true },
    title: { type: String, required: true },
    count: { type: [Number, String], required: true },
    unit: { type: String, default: '家' }
  }
};
</script>

<style scoped>
/* 从 HomePage.vue 剪切所有与 .status-box 相关的样式 */
.status-box {
  background-color: white;
  width: 100%; /* 在父容器控制宽度，这里设为100%即可 */
  padding: 20px 10px;
  text-align: center;
  font-size: 32px;
  color: #172787;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
  position: relative;
  z-index: 1;
  transition: all 0.2s ease;
  min-height: 240px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.status-box:hover {
  transform: scale(1.03);
  background-color: #172787;
  color: #f0dfc7;
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.2);
}
.status-box:hover * {
  color: #f0dfc7;
}
.status-box h3 {
  margin: 0;
  font-size: 20px;
  text-align: left;
  color: #172787;
  font-weight: bold;
  margin-bottom: 10px;
  text-transform: uppercase;
}
.status-title {
  font-size: 30px;
  font-weight: normal;
  margin: 0;
  margin-top: 20px;
  color: #172787;
}
.status-number {
  font-size: 48px;
  font-weight: bold;
  margin: 10px 0 0;
  color: #C6A86F;
}
.status-note {
  font-size: 14px;
  color: #172787;
  text-align: right;
  margin-top: 30px;
  text-transform: none;
  font-weight: normal;
}
.status-box.clickable {
  cursor: pointer;
}
.status-box.clickable:hover {
  transform: scale(1.05);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.2);
}

/* 响应式样式 */
@media (max-width: 768px) {
  .status-box {
    min-height: auto;
    padding: 20px;
  }
  
  /* 【优化】在移动设备上禁用悬浮放大的效果，提升触摸体验 */
  .status-box:hover,
  .status-box.clickable:hover {
    transform: none;
  }
  
  .status-title {
    font-size: 24px;
    margin-top: 20px;
  }

  .status-number {
    font-size: 40px;
  }

  .status-note {
    margin-top: 30px;
  }
}
</style>