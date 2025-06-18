<template>
  <div class="new-footer">
    <div class="content content_960">
      <img class="footer-bg-icon" src="@/assets/SAIF_images/footer-icon.png" alt="">

      <div class="top">
        <div class="top-top">
          <div class="top-left">
            <a href="https://www.saif.sjtu.edu.cn/">
              <img src="@/assets/SAIF_images/SAIF_LOGO_White_H_60.png" height="30" alt="SAIF Logo">
            </a>
          </div>
          <ul class="clearfix footer_inner">
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
            <li v-for="(location, index) in locations"
                :key="location.name"
                :class="{ active: activeTabIndex === index }"
                @mouseover="activeTabIndex = index">
              {{ location.name }}
            </li>
          </ul>
          
          <ul class="footer-tab-change">
            <li v-for="(location, index) in locations"
                :key="location.name"
                :class="{ active: activeTabIndex === index }">
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

<style>
@import '@/assets/SAIF_css/global.css';
@import '@/assets/SAIF_css/index.css';
</style>

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
    .content_960 {
        width: 90%;
    }
}

@media (max-width: 768px) {
  .content :deep(.top) {
    padding-left: 0 !important;
  }

  .top-top {
    flex-direction: column;
    align-items: center;
    gap: 25px;
  }
  
  .footer_inner {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 10px 15px;
  }

  .footer_inner li {
    float: none;
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
  
  .footer-bg-icon {
    position: static;
    display: block;
    height: 100px;
    width: auto;
    margin: 30px auto;
    opacity: 0.5;
    order: -1;
  }
  .content {
    display: flex;
    flex-direction: column;
  }
}

</style>
