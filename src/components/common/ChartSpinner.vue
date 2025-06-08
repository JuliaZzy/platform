<template>
  <div class="chart-spinner-wrapper" v-if="visible || showWatermark"> 
    <div class="spinner" v-if="visible"></div>

    <template v-if="showWatermark">
      <div
        v-for="(position, index) in watermarkPositions"
        :key="'watermark-' + index"
        class="chart-watermark"
        :style="{ top: position.top, left: position.left }"
      >
        {{ watermarkText }}
      </div>
    </template>
  </div>
</template>

<script>
export default {
  name: 'ChartSpinner',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    showWatermark: {
      type: Boolean,
      default: true // 保持默认值为 true 很好
    }
  },
  data() {
    return {
      watermarkText: '高金智库数据资产研究课题组',
      watermarkPositions: [
        { top: '20%', left: '15%' },
        { top: '50%', left: '50%' },
        { top: '70%', left: '75%' },
      ]
    };
  }
};
</script>

<style scoped>
.chart-spinner-wrapper { /* 之前是 .chart-spinner-container */
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10; 
  /* background-color: rgba(255, 255, 255, 0.5); */ /* 可选：半透明背景遮罩 */
  pointer-events: none; /* 通常允许点击穿透，除非加载时需要阻止下方操作 */
  overflow: hidden;
}

.chart-watermark {
  position: absolute; 
  transform: rotate(-30deg);
  transform-origin: center center;
  font-size: 20px; /* 水印字号调整 */
  color: rgba(0, 0, 0, 0.06); /* 水印颜色调得更淡 */
  font-weight: bold;
  white-space: nowrap; 
  z-index: 1; /* 在 Spinner 之下 */
  pointer-events: none;
  padding: 5px;
}

/* ✅ 更新 Spinner 动画样式为一个常见的边框旋转动画 */
.spinner {
  width: 40px; /* Spinner 大小 */
  height: 40px;
  border: 4px solid #f3f3f3; /* 浅灰色轨道 */
  border-top: 4px solid #2e3968; /* 主题色旋转部分 */
  border-radius: 50%;
  animation: spin 1s linear infinite;
  z-index: 2; /* 确保 spinner 在水印之上 */
}

/* 移除旧的 .spinner-dot 样式，因为新的 spinner 不需要它 */

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>