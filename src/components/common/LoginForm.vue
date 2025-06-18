<template>
  <div class="login-form">
    <h2 class="title">管理员登录</h2>
    
    <div class="input-group">
      <label for="username">用户名</label>
      <input v-model="username" type="text" id="username" placeholder="请输入用户名" />
    </div>

    <div class="input-group">
      <label for="password">密码</label>
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
          this.$emit('login-success');
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
  width: 90%;
  max-width: 400px;
  margin: 0 auto;
  padding: 10px;
  box-sizing: border-box;
}

.title {
  font-size: 24px;
  color: #172787;
  text-align: center;
  margin-bottom: 20px;
}

.input-group {
  margin-bottom: 20px;
}

label {
  font-size: 16px;
  color: #172787;
  display: block;
  margin-bottom: 5px;
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
  background-color: #172787;
  color: white;
  border: none;
  font-size: 18px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

button:hover {
  background-color: #BDA36C;
}
</style>
