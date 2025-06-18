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
      default: true
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
.chart-spinner-wrapper {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10; 
  /* background-color: rgba(255, 255, 255, 0.5); */
  pointer-events: none;
  overflow: hidden;
}

.chart-watermark {
  position: absolute; 
  transform: rotate(-30deg);
  transform-origin: center center;
  font-size: 20px;
  color: rgba(0, 0, 0, 0.06);
  font-weight: bold;
  white-space: nowrap; 
  z-index: 1;
  pointer-events: none;
  padding: 5px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #172787;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  z-index: 2;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>