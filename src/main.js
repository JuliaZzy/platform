import Vue from 'vue'
import App from './App.vue'
import router from './router'

// ✅ 引入 Element UI
import ElementUI from 'element-ui'
import 'element-ui/lib/theme-chalk/index.css'

// ✅ 引入字体图标（你已有）
import 'font-awesome/css/font-awesome.min.css';
import axios from 'axios';
import * as echarts from 'echarts';
import { BarChart, LineChart } from 'echarts/charts';
import {
  TooltipComponent,
  LegendComponent,
  GridComponent
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
// --- Font Awesome ---
import { library } from '@fortawesome/fontawesome-svg-core'
import { fas } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
library.add(fas) // 将所有实体图标添加到库中

Vue.component('font-awesome-icon', FontAwesomeIcon) // 全局注册组件

echarts.use([
  BarChart,
  LineChart,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  CanvasRenderer
]);

Vue.prototype.$echarts = echarts;

if (process.env.VUE_APP_API_URL !== undefined) { // 检查是否已定义 (空字符串也是已定义)
  axios.defaults.baseURL = process.env.VUE_APP_API_URL;
  console.log('API baseURL set to:', `'${process.env.VUE_APP_API_URL}'`); 
} else {
  // 这个 else 分支理论上不应该进入了，因为我们会在 .env 文件中定义 VUE_APP_API_URL
  console.warn('VUE_APP_API_URL is not set. API calls might use relative paths or need full URLs.');
}

axios.defaults.timeout = 20000; // ⏰ 设置超时时间 60秒

Vue.config.productionTip = false

// ✅ 注册 Element UI
Vue.use(ElementUI)

new Vue({
  router,
  render: h => h(App)
}).$mount('#app')
