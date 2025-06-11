<template>
  <div class="new-footer">
    
    <div class="content content_960">
      <img class="footer-bg-icon" src="@/assets/SAIF_images/footer-icon.png" alt="">
      <div class="top">
        <div class="top-top">
          <div class="top-left">
            <a href="https://www.saif.sjtu.edu.cn/">
              <img src="@/assets/SAIF_images/SAIF_LOGO_White_H_60.png" height="30" alt="">
            </a>
          </div>
          <ul class="clearfix footer_inner">
            <li>
              <a href="https://www.saif.sjtu.edu.cn/cdc/introduction">
                <img class="footer_inner_default" src="@/assets/SAIF_images/zyfz.png">
                <img class="footer_inner_hover" src="@/assets/SAIF_images/zyfz1.png" alt="">
                就业中心
              </a>
            </li>
            <li>
              <a href="https://www.saif.sjtu.edu.cn/iao/program-introduction">
                <img class="footer_inner_default" src="@/assets/SAIF_images/gjjl.png">
                <img class="footer_inner_hover" src="@/assets/SAIF_images/gjjl1.png" alt="">
                国际交流
              </a>
            </li>
            <li>
              <a href="https://www.saif.sjtu.edu.cn/academic-affairs">
                <img class="footer_inner_default" src="@/assets/SAIF_images/jwgl.png">
                <img class="footer_inner_hover" src="@/assets/SAIF_images/jwgl1.png" alt="">
                教务管理
              </a>
            </li>
            <li>
              <a href="https://www.saif.sjtu.edu.cn/downloads">
                <img class="footer_inner_default" src="@/assets/SAIF_images/zlxz.png">
                <img class="footer_inner_hover" src="@/assets/SAIF_images/zlxz1.png" alt="">
                资料下载
              </a>
            </li>
            <li>
              <a href="https://www.saif.sjtu.edu.cn/contact-us">
                <img class="footer_inner_default" src="@/assets/SAIF_images/lxwm.png">
                <img class="footer_inner_hover" src="@/assets/SAIF_images/lxwm1.png" alt="">
                联系我们
              </a>
            </li>
            <li>
              <a href="https://www.saif.sjtu.edu.cn/contact-us/maps">
                <img class="footer_inner_default" src="@/assets/SAIF_images/wzdt.png">
                <img class="footer_inner_hover" src="@/assets/SAIF_images/wzdt1.png" alt="">
                网站地图
              </a>
            </li>
          </ul>
        </div>
        <div class="top-bottom">
          <ul class="footer-tab">
            <li v-for="(tab, index) in tabs"
              :key="tab"
              :class="{ active: activeTabIndex === index }"
              @mouseover="activeTabIndex = index">
              {{ tab }}
            </li>
          </ul>
          <ul class="footer-tab-change">
            <li v-if="activeTabIndex === 0" class="active">
              <p>徐汇校区</p>
              <p>地址：上海市徐汇区淮海西路211号 / 邮编：200030</p>
              <div style="width:100%;height:10px;"></div>
              <p>大虹桥中心</p>
              <p>地址：上海市闵行区申长路990弄虹桥汇T6号楼9层 / 邮编：201106</p>
              <div style="width:100%;height:10px;"></div>
              <p>普陀中心</p>
              <p>地址：上海市普陀区同普路800弄臣风大厦D栋3楼 / 邮编 200062</p>
            </li>
            <li v-if="activeTabIndex === 1" class="active">
              <p>地址：北京市朝阳区东三环中路1号环球金融中心西楼5层</p>
              <p>邮编：100020</p>
            </li>
            <li v-if="activeTabIndex === 2" class="active">
              <p>地址：深圳市南山区中心路3088号深圳湾1号T7栋1203单元</p>
              <p>邮编：518000</p>
            </li>
          </ul>
        </div>
      </div>
      <div class="bottom">
        <!-- 2. 将建筑素描图从这里移除 -->
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
      tabs: ['上海', '北京', '深圳']
    };
  }
};
</script>

<!-- 这是您原有的、可以正常工作的样式，保持不变 -->
<style>
@import '@/assets/SAIF_css/global.css';
@import '@/assets/SAIF_css/index.css';
</style>


<style scoped>
.new-footer {
  position: relative;
  overflow: hidden;
}

.content {overflow: hidden}

.footer-bg-icon {
  position: absolute;
  bottom: 62px;
  height: 75%;
  opacity: 0.25;
  pointer-events: none;
  z-index: 0;
}

.content {
  position: relative;
  z-index: 1;
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
</style>