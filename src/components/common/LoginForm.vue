<template>
  <div class="login-form">
    <h2 class="title">管理员登录</h2>  <!-- 标题部分 -->
    
    <div class="input-group">
      <label for="username">用户名</label>  <!-- 用户名标签 -->
      <input v-model="username" type="text" id="username" placeholder="请输入用户名" />
    </div>

    <div class="input-group">
      <label for="password">密码</label>  <!-- 密码标签 -->
      <input v-model="password" type="password" id="password" placeholder="请输入密码" />
    </div>

    <button @click="handleLogin">登录</button>
    <p v-if="errorMessage" style="color: red">{{ errorMessage }}</p>
  </div>
</template>


<script>
import axios from 'axios';

export default {
  name: 'LoginForm',
  data() {
    return {
      username: '',
      password: '',
      errorMessage: ''
    };
  },
  methods: {
    handleLogin() {
      if (!this.username || !this.password) {
        this.errorMessage = '用户名和密码不能为空';
        return;
      }
    
      // const apiUrl = process.env.VUE_APP_API_URL || '/api';  // 确保 API 地址配置正确
    
      axios.post('/api/login', {
        username: this.username,
        password: this.password
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      .then((response) => {
        if (response.data.success) {
          localStorage.setItem('adminLoggedIn', 'true');
          this.$emit('login-success'); // 通知父组件登录成功
        } else {
          this.errorMessage = '用户名或密码错误';
        }
      })
      .catch((error) => {
        console.error('登录失败:', error);
        this.errorMessage = '登录失败，请稍后重试';
      });
    }
  }
};
</script>

<style scoped>
.login-form {
  width: 90%;  /* 表单宽度自适应弹窗 */
  max-width: 400px;  /* 最大宽度 400px */
  margin: 0 auto;
  padding: 10px;
  box-sizing: border-box;  /* 确保内边距和边框不会影响总宽度 */
}

.title {
  font-size: 24px;  /* 标题字体大小 */
  color: #2e3968;  /* 深蓝色字体 */
  text-align: center;  /* 居中 */
  margin-bottom: 20px;  /* 标题与表单之间的间距 */
}

.input-group {
  margin-bottom: 20px;  /* 每个输入框与下一个元素之间的间距 */
}

label {
  font-size: 16px;
  color: #2e3968;  /* 深蓝色字体 */
  display: block;
  margin-bottom: 5px;  /* 标签与输入框之间的间距 */
}

input {
  width: 100%;
  padding: 10px;
  margin-top: 10px;
  margin-bottom: 10px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 16px;
  box-sizing: border-box;
}

button {
  width: 100%;
  padding: 12px;
  margin-top: 20px;
  background-color: #2e3968;  /* 深蓝色背景 */
  color: white;
  border: none;
  font-size: 18px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

button:hover {
  background-color: #BDA36C;  /* 鼠标悬停时的过渡色 */
}
</style>
