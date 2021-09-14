<template>
  <div>
    <h1>自定义指令</h1>
    <div class="box" v-drag></div>
    <input v-focus/>
    <div>
      clientX:相对于浏览器有效区域的x轴坐标

      offsetX:相对于事件源x轴的坐标
    </div>
  </div>
</template>

<script>
export default {
  directives: {
    // 指令1
    focus: {
      // 指令的定义
      inserted: function (el) {
        console.log("el",el)
        el.focus();
      },
    },

    //指令2
    drag: {
      // 指令的定义
      inserted: function (el) {
        console.log("el2",el)
        el.style.position='absolute'
        el.onmousedown=function(ev){
          console.log('ev',ev)
          var sX=ev.clientX-el.offsetLeft;
          var sY=ev.clientY-el.offsetTop;
          document.onmousemove=function(ev){
            var eX=ev.clientX-sX;
            var eY=ev.clientY-sY;
            // 不断的更新元素的left、top值
            el.style.left=eX+'px'
            el.style.top=eY+'px'
          }

          document.onmouseup=function(){
            // 清除mousemove事件
            document.onmousemove=null;
          }
        }
      },
    },
  },
};
</script>

<style lang="css" scoped>
.box {
  width: 100px;
  height: 100px;
  background: orange;
}
</style>