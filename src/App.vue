<!-- src/App.vue -->
<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script>
export default {
  name: 'App'
};
</script>

<style>
html, body {
  height: 100%;
  margin: 0;
  padding: 0;
  font-family: 'Helvetica Neue', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  background-color: #ffffff;
  color: #333;
}

#app {
  height: 100%; /* ✅ 让 router-view 填满视口，支持 flex 子页面布局 */
}
</style>
