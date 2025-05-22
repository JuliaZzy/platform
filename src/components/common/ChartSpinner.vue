<template>
  <div class="chart-spinner-container">
    <div
      v-for="(position, index) in watermarkPositions"
      :key="'watermark-' + index"
      class="chart-watermark"
      :style="{ top: position.top, left: position.left }"
    >
      {{ watermarkText }}
    </div>
  </div>
</template>

<script>
export default {
  name: 'ChartSpinner',
  props: {
    visible: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      watermarkText: '上海高级金融学院', // 水印文字
      watermarkPositions: [ // 定义多个水印的位置 (top, left 的百分比或像素值)
        // 你可以根据需要调整这些位置和数量，以达到“铺满”的效果
        // 示例 5 个水印：
        { top: '20%', left: '15%' },
        { top: '70%', left: '75%' },
        // 如果需要更多，可以继续添加：
        // { top: '10%', left: '70%' },
        // { top: '45%', left: '70%' },
        // { top: '65%', left: '5%' },
      ]
    };
  },
  methods: {
    getStyle(index) {
      const angle = (index - 1) * 45;
      return {
        transform: `rotate(${angle}deg) translate(0, -12px)`
      };
    }
  }
};
</script>

<style scoped>
.chart-spinner-container {
  position: absolute;
  top: 0; /* 让容器覆盖整个父相对定位元素 */
  left: 0;
  width: 100%;
  height: 100%;
  display: flex; /* 用于居中spinner和水印 */
  justify-content: center;
  align-items: center;
  transform: none; /* 移除之前的 translate(-50%, -50%)，因为现在是覆盖整个图表区域 */
  z-index: 10;     /* 确保它在图表内容之上 */
  pointer-events: none; /* 关键：允许鼠标事件穿透到下面的图表 */
  overflow: hidden; /* 防止旋转的水印文字超出边界太多 */
}

/* 新增：水印样式 */
.chart-watermark {
  position: absolute; /* 相对于 .chart-spinner-container 定位 */
  transform: rotate(-30deg); /* 所有水印统一旋转角度，你可以调整 */
  transform-origin: center center; /* 让旋转围绕自身中心进行 */
  font-size: 24px; /* 考虑到多个水印，字号可能需要比单个水印时小一些 */
  color: rgba(0, 0, 0, 0.15); /* 更淡一些的颜色，因为有很多个，避免过于干扰 */
  font-weight: bold;
  white-space: nowrap; 
  z-index: 1; /* 确保在图表内容之上，但在spinner加载动画之下 */
  pointer-events: none;
  padding: 5px; /* 轻微内边距，防止旋转后文字边缘被裁剪 */
  /* top 和 left 将通过内联 :style 动态设置 */
}

/* Spinner 动画的样式 (基本保持不变，但现在它在 flex 容器中会被居中) */
.spinner {
  position: relative; /* 改为 relative 或 static，因为它会被 flex 居中 */
                      /* 如果希望它覆盖水印，可以给它更高的 z-index */
  width: 48px;
  height: 48px;
  animation: spin 1s linear infinite;
  z-index: 2; /* 确保 spinner 在水印之上（如果同时显示） */
}

/* spinner-dot 和 keyframes spin 的样式保持不变 */
.spinner-dot {
  width: 8px;
  height: 8px;
  background-color: #003049; /* 这是你之前的主题色 */
  border-radius: 50%;
  position: absolute;
  top: 50%;
  left: 50%;
  margin: -4px 0 0 -4px;
}

@keyframes spin {
  100% {
    transform: rotate(360deg);
  }
}
</style>
