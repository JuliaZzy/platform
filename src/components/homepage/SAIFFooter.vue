<template>
  <div class="new-footer">
    <div class="content content_960">
      <!-- 【已恢复】保留您左侧的装饰性图标 -->
      <img class="footer-bg-icon" src="@/assets/SAIF_images/footer-icon.png" alt="">

      <div class="top">
        <div class="top-top">
          <div class="top-left">
            <a href="https://www.saif.sjtu.edu.cn/">
              <img src="@/assets/SAIF_images/SAIF_LOGO_White_H_60.png" height="30" alt="SAIF Logo">
            </a>
          </div>
          <ul class="clearfix footer_inner">
            <!-- 链接列表部分保持不变 -->
            <li><a href="https://www.saif.sjtu.edu.cn/cdc/introduction"><img class="footer_inner_default" src="@/assets/SAIF_images/zyfz.png"><img class="footer_inner_hover" src="@/assets/SAIF_images/zyfz1.png" alt=""> 就业中心</a></li>
            <li><a href="https://www.saif.sjtu.edu.cn/iao/program-introduction"><img class="footer_inner_default" src="@/assets/SAIF_images/gjjl.png"><img class="footer_inner_hover" src="@/assets/SAIF_images/gjjl1.png" alt=""> 国际交流</a></li>
            <li><a href="https://www.saif.sjtu.edu.cn/academic-affairs"><img class="footer_inner_default" src="@/assets/SAIF_images/jwgl.png"><img class="footer_inner_hover" src="@/assets/SAIF_images/jwgl1.png" alt=""> 教务管理</a></li>
            <li><a href="https://www.saif.sjtu.edu.cn/downloads"><img class="footer_inner_default" src="@/assets/SAIF_images/zlxz.png"><img class="footer_inner_hover" src="@/assets/SAIF_images/zlxz1.png" alt=""> 资料下载</a></li>
            <li><a href="https://www.saif.sjtu.edu.cn/contact-us"><img class="footer_inner_default" src="@/assets/SAIF_images/lxwm.png"><img class="footer_inner_hover" src="@/assets/SAIF_images/lxwm1.png" alt=""> 联系我们</a></li>
            <li><a href="https://www.saif.sjtu.edu.cn/contact-us/maps"><img class="footer_inner_default" src="@/assets/SAIF_images/wzdt.png"><img class="footer_inner_hover" src="@/assets/SAIF_images/wzdt1.png" alt=""> 网站地图</a></li>
          </ul>
        </div>
        <div class="top-bottom">
          <ul class="footer-tab">
            <!-- 鼠标悬停的选项卡 -->
            <li v-for="(location, index) in locations"
                :key="location.name"
                :class="{ active: activeTabIndex === index }"
                @mouseover="activeTabIndex = index">
              {{ location.name }}
            </li>
          </ul>
          
          <!-- 地址和背景图的显示区域 -->
          <!-- 使用 v-for 渲染所有 li，用 :class 控制显示/隐藏 -->
          <ul class="footer-tab-change">
            <li v-for="(location, index) in locations"
                :key="location.name"
                :class="{ active: activeTabIndex === index }">
              <!-- 使用 v-html 渲染包含 HTML 标签的地址信息 -->
              <div v-html="location.address"></div>
            </li>
          </ul>
        </div>
      </div>
      <div class="bottom">
        <p class="l">©上海交通大学 上海高级金融学院 版权所有
          <a href="https://beian.miit.gov.cn/" target="_blank" style="text-decoration:underline;">沪ICP备05052060号-1</a>
        </p>
        <img src="@/assets/SAIF_images/footer5.png" alt="">
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'SAIFFooter',
  data() {
    return {
      activeTabIndex: 0,
      // 将数据整合到一个数组中，更易于管理和渲染
      locations: [
        {
          name: '上海',
          address: `
            <p>徐汇校区</p>
            <p>地址：上海市徐汇区淮海西路211号 / 邮编：200030</p>
            <div style="width:100%;height:10px;"></div>
            <p>大虹桥中心</p>
            <p>地址：上海市闵行区申长路990弄虹桥汇T6号楼9层 / 邮编：201106</p>
            <div style="width:100%;height:10px;"></div>
            <p>普陀中心</p>
            <p>地址：上海市普陀区同普路800弄臣风大厦D栋3楼 / 邮编 200062</p>
          `
        },
        {
          name: '北京',
          address: `
            <p>地址：北京市朝阳区东三环中路1号环球金融中心西楼5层</p>
            <p>邮编：100020</p>
          `
        },
        {
          name: '深圳',
          address: `
            <p>地址：深圳市南山区中心路3088号深圳湾1号T7栋1203单元</p>
            <p>邮编：518000</p>
          `
        }
      ]
    };
  }
};
</script>

<!-- 您的样式文件保持不变，无需修改 -->
<style>
@import '@/assets/SAIF_css/global.css';
@import '@/assets/SAIF_css/index.css';
</style>

<!-- scoped 样式也保持不变 -->
<style scoped>
.new-footer {
  position: relative;
  overflow: hidden;
}

.content {
  overflow: hidden;
  position: relative;
  z-index: 1;
}

/* 这是您原有的样式，确保图标能正确显示 */
.footer-bg-icon {
  position: absolute;
  bottom: 62px;
  height: 75%;
  opacity: 0.25;
  pointer-events: none;
  z-index: 0;
}


.footer_inner a {
  display: inline-flex;
  align-items: center;
  vertical-align: middle;
}

.footer_inner img {
  height: 16px;
  width: auto;
  margin-right: 5px;
}

.bottom {
  display: flex;
  align-items: center;
}

.bottom .l {
  margin: 0;
  font-size: 14px;
}

@media (max-width: 992px) {
    /* 在平板设备上调整宽度 */
    .content_960 {
        width: 90%;
    }
}

@media (max-width: 768px) {
  /* 重置桌面端的大左边距 */
  .content :deep(.top) {
    padding-left: 0 !important;
  }

  .top-top {
    flex-direction: column;
    align-items: center; /* 居中对齐 */
    gap: 25px;
  }
  
  .footer_inner {
    display: flex;
    flex-wrap: wrap;
    justify-content: center; /* 居中对齐 */
    gap: 10px 15px; /* 行间距和列间距 */
  }

  .footer_inner li {
    float: none; /* 移除浮动 */
    margin-right: 0;
  }

  .footer-tab-change li {
    background-image: none !important;
    text-align: center;
    padding: 15px;
    box-sizing: border-box;
    height: auto;
    min-height: 175px;
  }

  .bottom {
    flex-direction: column;
    gap: 15px;
    text-align: center;
  }
  
  /* 【修改】重新排版装饰性大图标 */
  .footer-bg-icon {
    position: static; /* 移除绝对定位，使其进入文档流 */
    display: block; /* 设为块级元素 */
    height: 100px; /* 给一个适合手机的高度 */
    width: auto;
    margin: 30px auto; /* 居中并添加上下边距 */
    opacity: 0.5; /* 调整透明度使其不那么突兀 */
    order: -1; /* 将其放在所有flex项目之前（虽然这里没用flex，但作为逻辑标记） */
  }

  /* 【修改】为了实现图标在最上面，将父容器改为flex布局 */
  .content {
    display: flex;
    flex-direction: column;
  }
}

</style>
