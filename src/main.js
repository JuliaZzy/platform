import Vue from 'vue'
import App from './App.vue'
import router from './router'
import ElementUI from 'element-ui'
import 'element-ui/lib/theme-chalk/index.css'
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
import { library } from '@fortawesome/fontawesome-svg-core'
import { fas } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
library.add(fas)

Vue.component('font-awesome-icon', FontAwesomeIcon)

echarts.use([
  BarChart,
  LineChart,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  CanvasRenderer
]);

Vue.prototype.$echarts = echarts;

if (process.env.VUE_APP_API_URL !== undefined) {
  axios.defaults.baseURL = process.env.VUE_APP_API_URL;
  console.log('API baseURL set to:', `'${process.env.VUE_APP_API_URL}'`); 
} else {
  console.warn('VUE_APP_API_URL is not set. API calls might use relative paths or need full URLs.');
}

axios.defaults.timeout = 20000;

Vue.config.productionTip = false
Vue.use(ElementUI)

new Vue({
  router,
  render: h => h(App)
}).$mount('#app')
