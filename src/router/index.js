import Vue from 'vue';
import Router from 'vue-router';
import HomePage from '@/views/HomePage.vue';
import NLSDashboardPage from '@/views/NLSDashboardPage.vue';
import LSDashboardPage from '@/views/LSDashboardPage.vue';
import FinanceDashboardPage from '../views/FinanceDashboardPage.vue'; // 确保路径正确
import AdminPage from '@/views/AdminPage.vue';

Vue.use(Router);

const routes = [
  {
    path: '/',
    name: 'HomePage',
    component: HomePage
  },
  {
    path: '/dashboard',
    name: 'NLSDashboardPage',
    component: NLSDashboardPage
  },
  {
    path: '/lsdashboard',
    name: 'LSDashboardPage',
    component: LSDashboardPage
  },
  {
    path: '/financedashboard',
    name: 'FinanceDashboardPage',
    component: FinanceDashboardPage
  },
  {
    path: '/admin-page',
    name: 'AdminPage',
    component: AdminPage,
    beforeEnter: (to, from, next) => {
      if (localStorage.getItem('adminLoggedIn') === 'true') {
        next();
      } else {
        next('/');  // 未登录，跳转到首页
      }
    }
  }
];

export default new Router({
  routes
});
