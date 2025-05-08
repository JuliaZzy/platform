<template>
  <div class="chart-spinner-container" v-if="visible">
    <div class="spinner">
      <div v-for="n in 8" :key="n" class="spinner-dot" :style="getStyle(n)"></div>
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
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 10;
  pointer-events: none; /* 避免影响点击 */
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.spinner {
  position: relative;
  width: 48px;
  height: 48px;
  animation: spin 1s linear infinite;
}

.spinner-dot {
  width: 8px;
  height: 8px;
  background-color: #003049;
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
