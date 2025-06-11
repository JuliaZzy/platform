<template>
  <div class="n24-header-menu n24-box-sizing">
    <div class="n24-header-menu-inner">
      <div class="n24-header-menu-inner-left">
        <a href="https://www.saif.sjtu.edu.cn/"><img src="@/assets/SAIF_images/SAIF_LOGO_White_W_500.png" alt=""></a>
      </div>
      <div class="n24-header-menu-inner-right clearfix">
        <ul class="n24-header-menu-link">
          <li><a href="https://www.sjtu.edu.cn/" target="_blank">上海交通大学</a></li>
          <li><a href="https://www.cafr.cn/" target="_blank">中国金融研究院</a></li>
          <li><a href="https://cafrpro.saif.sjtu.edu.cn/" target="_blank">高金金融研究院</a></li>
          <li><a href="https://en.saif.sjtu.edu.cn/" target="_blank">English</a></li>
          <li class="n24-page-search">
            <img src="@/assets/SAIF_images/search-icon-white.png" alt="" @click="toggleSearch(true)">
            <div v-if="isSearchVisible" class="n24-page-search-input">
              <input type="text" class="keyword" placeholder="请输入搜索内容" v-model="searchKeyword" @keyup.enter="performSearch">
              <button @click="performSearch">
                <img src="@/assets/SAIF_images/search-icon-white.png" alt="">
              </button>
              <span class="close" @click.stop="toggleSearch(false)"></span>
            </div>
          </li>
          <li class="m-nav-change-btn">
            <span></span><span></span><span></span>
          </li>
        </ul>
        <ul class="n24-header-menu-list clearfix">
          <li><a href="https://www.saif.sjtu.edu.cn/about">走进高金</a></li>
          <li class="n24-header-menu-dropdown-list-wrap">
            <a href="javascript:void(0)">课程项目</a>
            <div class="n24-header-menu-dropdown-list">
                <div class="n24-header-menu-dropdown-list-inner">
                    <a href="https://mf.saif.sjtu.edu.cn/" target="_blank"><span>金融硕士</span></a>
                    <a href="https://mba.saif.sjtu.edu.cn/" target="_blank"><span>金融MBA</span></a>
                    <a href="https://emba.saif.sjtu.edu.cn/" target="_blank"><span>金融EMBA</span></a>
                    <a href="https://www.saif.sjtu.edu.cn/ges" target="_blank"><span>全球商界领军学者项目</span></a>
                    <a href="https://phd.saif.sjtu.edu.cn/" target="_blank"><span>博士PhD</span></a>
                    <a href="https://ee.saif.sjtu.edu.cn/" target="_blank"><span>高层管理教育EE</span></a>
                </div>
            </div>
          </li>
          <li><a href="https://www.saif.sjtu.edu.cn/faculty">教授/研究</a></li>
          <li><a href="https://thinktank.saif.sjtu.edu.cn/">高金智库</a></li>
          <li><a href="https://www.saif.sjtu.edu.cn/alumni">校友关系</a></li>
          <li><a href="https://www.saif.sjtu.edu.cn/giving">支持高金</a></li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'NewHeader',
  data() {
    return {
      isSearchVisible: false,
      searchKeyword: '' // 使用 v-model 绑定输入框内容
    };
  },
  methods: {
    toggleSearch(state) {
      this.isSearchVisible = state;
      if (!state) {
        this.searchKeyword = ''; // 关闭时清空关键词
      }
    },
    performSearch() {
      if (this.searchKeyword) {
        // 在新标签页中打开搜索链接
        window.open('https://www.saif.sjtu.edu.cn/search/index/?keyword=' + this.searchKeyword, '_blank');
      }
    }
  }
};
</script>

<style>
/* 使用 @import 在 <style> 标签中导入外部CSS */
/* 确保您的 `高金智库_files` 文件夹在 `src/assets` 目录下 */

@import '@/assets/SAIF_css/global.css';
@import '@/assets/SAIF_css/24-nav.css';
@import '@/assets/SAIF_css/index.css';
@import '@/assets/SAIF_css/mobile1.css';
@import '@/assets/SAIF_css/mobile2.css';

/* 来自原HTML的内联样式 */
.n24-header-menu {
    position: unset;
    z-index: 1009;
}
.n24-header-menu .n24-header-menu-list li:hover .n24-header-menu-dropdown-list {
    z-index: 1001;
}
@media (max-width: 768px) {
    .n24-header-menu {
        position: relative;
    }
}

/* 确保搜索框能被Vue正确地显示和隐藏 */
.n24-page-search-input {
    display: block;
}


  /* 1. 修正宽度问题，确保 padding 不会撑开容器 */
  .n24-header-menu {
    box-sizing: border-box;
  }

  /* 2. 将 Header 内部容器设置为 Flex 布局 */
  .n24-header-menu .n24-header-menu-inner {
      max-width: 100%; /* 限制内容最大宽度，在大屏幕上更美观 */
      margin: 0 auto;    /* 让内容在页面中水平居中 */

      /* --- 以下是 Flexbox 核心指令 --- */
      display: flex;                 /* 启用 Flex 布局 */
      justify-content: space-between;/* 子元素两端对齐：logo在最左，右侧内容在最右 */
      align-items: center;           /* 子元素在垂直方向上居中对齐 */
  }

  /* 3. 清除可能存在的旧的浮动布局，因为 Flexbox 会接管 */
  .n24-header-menu .n24-header-menu-inner-left,
  .n24-header-menu .n24-header-menu-inner-right {
    float: none;
  }
</style>