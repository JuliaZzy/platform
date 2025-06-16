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
  name: 'SAIFHeader',
  data() {
    return {
      isSearchVisible: false,
      searchKeyword: ''
    };
  },
  methods: {
    toggleSearch(state) {
      this.isSearchVisible = state;
      if (!state) {
        this.searchKeyword = '';
      }
    },
    performSearch() {
      if (this.searchKeyword.trim()) {
        const url = 'https://www.saif.sjtu.edu.cn/search/index/?keyword=' + encodeURIComponent(this.searchKeyword);
        window.open(url, '_blank');
        this.toggleSearch(false);
      }
    }
  }
};
</script>

<style>
@import '@/assets/SAIF_css/global.css';
@import '@/assets/SAIF_css/24-nav.css';
@import '@/assets/SAIF_css/index.css';
@import '@/assets/SAIF_css/mobile1.css';
@import '@/assets/SAIF_css/mobile2.css';

.n24-header-menu {
  position: unset;
  z-index: 1009;
  box-sizing: border-box !important;
}

.n24-header-menu .n24-header-menu-inner {
    max-width: 1600px;
    width: 100%;
    margin: 0 auto;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.n24-header-menu .n24-header-menu-inner-left,
.n24-header-menu .n24-header-menu-inner-right {
  float: none;
}

.n24-header-menu .n24-header-menu-list li:hover .n24-header-menu-dropdown-list {
  z-index: 1001;
}

.n24-page-search-input {
    position: absolute;
    top: 40px;
    right: 0;
    z-index: 1100;
    display: block !important;
    background-color: #fff;
    padding: 10px;
    border: 1px solid #ddd;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    width: 350px;
}

@media (max-width: 768px) {
  .n24-header-menu {
    position: relative;
  }
}
</style>