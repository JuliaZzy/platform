<template>
    <div class="spinner-container" v-if="visible">
      <div class="spinner">
        <div v-for="n in 8" :key="n" class="spinner-dot" :style="getStyle(n)"></div>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    name: 'LoadingSpinner',
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
  .spinner-container {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(255, 255, 255, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
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
    background-color: #172787;
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
  