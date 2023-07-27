var _this;
class Tab {
  constructor(id) {
    _this = this;
    this.main = document.querySelector(id);
    
    this.add=this.main.querySelector('.firstNav div:nth-child(2)');
    this.ul=this.main.querySelector('.firstNav ul:first-child');
    this.sectionParent=this.main.querySelector('.tabscon');
    this.init();
  }
  init() {
    this.updateNode();
    // 给增加图标绑定事件
    this.add.onclick=this.addTab;

    // 给标签栏绑定事件
    Array.from(this.lis).forEach((ele, index) => {
      ele.index = index;

      ele.onclick = this.toggle;
      //   function() {
      //     Array.from(_this.lis).forEach((ele) => {
      //       ele.className = "";
      //     });
      //     Array.from(_this.sections).forEach((ele) => {
      //       ele.className = "";
      //     });
      //     _this.lis[index].className = "liactive";
      //     _this.sections[index].className = "tabactive";
      //   };
    });
  }
  /**
   * 增加的时候事件要重新绑定，重新获取节点
   */
  updateNode(){
    this.lis = this.main.querySelectorAll("li");
    this.sections = this.main.querySelectorAll("section");
  }
  /**
   * tab切换
   */
  toggle() {
    _this.clear();
    _this.lis[this.index].className = "liactive";
    _this.sections[this.index].className = "tabactive";
  }
  /**
   * 先清楚所有样式
   */
  clear(){
    Array.from(_this.lis).forEach((ele) => {
      ele.className = "";
    });
    Array.from(_this.sections).forEach((ele) => {
      ele.className = "";
    });
  }
  /**
   * 增加
   */
  addTab(){
    // console.log('add')
    _this.clear();
    let li='<li class="liactive"><span>新标签</span></li>';
    _this.ul.insertAdjacentHTML('beforeend',li);
    let section='<section class="tabactive">'+Math.random()+'</section>';
    _this.sectionParent.insertAdjacentHTML('beforeend',section);
    _this.init();
  }
}

new Tab("#tab");
