import Vue from 'vue'
import App from './App.vue'
import router from './router'

// ✅ 引入 Element UI
import ElementUI from 'element-ui'
import 'element-ui/lib/theme-chalk/index.css'

// ✅ 引入字体图标（你已有）
import 'font-awesome/css/font-awesome.min.css';
import axios from 'axios';

axios.defaults.timeout = 20000; // ⏰ 设置超时时间 60秒

Vue.config.productionTip = false

// ✅ 注册 Element UI
Vue.use(ElementUI)

new Vue({
  router,
  render: h => h(App)
}).$mount('#app')
