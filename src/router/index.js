import Vue from 'vue';
import Router from 'vue-router';
import HomePage from '@/views/HomePage.vue';
import DashboardPage from '@/views/DashboardPage.vue';
import LSDashboardPage from '@/views/ListedCompanyDashboardPage.vue';
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
    name: 'DashboardPage',
    component: DashboardPage
  },
  {
    path: '/lsdashboard',
    name: 'ListedCompanyDashboardPage',
    component: LSDashboardPage
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
