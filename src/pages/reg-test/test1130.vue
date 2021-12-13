<template>
  <div>
    <div class="fixed">
      <ul>
        <li>
          <a href="#"><i>1221</i><span>二维码</span></a>
        </li>
      </ul>
    </div>

    <div class="box">
      <ul>
        <li>
          <a><span>0000</span><span>三维</span></a>
        </li>
        <li></li>
      </ul>
    </div>
  </div>
</template>

<script>
export default {};
</script>

<style lang="css" scoped>
.fixed {
  position: fixed;
  right: 300px;
  bottom: 100px;
  width: 48px;
  height: 300px;
  background: black;
}

.fixed ul li {
  text-align: center;
  line-height: 48px;
  margin-bottom: 2px;
  float: right;
  list-style-type: none;
}

.fixed ul li a {
  width: 48px;
  height: 48px;
  display: block;
  position: relative;
  background: blue;
  /* overflow: hidden; */
}

.fixed ul li a span {
  display: block;
  width: 48px;
  height: 48px;
  position: absolute;
  top: 0;
  left: 0;
  background: blueviolet;
  transition: all 0.2s linear;
  transform-origin: left bottom;
  transform: rotate(180deg);
  z-index: 2;
}

.fixed li a:hover span {
  transform: rotate(0deg);
}

.box{
  width:50px;
  height:300px;
  background: orange;
  margin:100px 100px;
}

.box ul li{
  width:50px;
  height: 50px;
  float: right;
  overflow: hidden;
}

.box ul li a{
  display: block;
  width:50px;
  height:50px;
  position: relative;
  background: blue;
}

.box ul li a span:nth-child(2){
  display: block;
  width:50px;
  height:50px;
  text-align: center;
  line-height: 50px;
  background: greenyellow;
  position:absolute;
  left:0;
  top:0;
  transform: rotate(360deg);
  transform-origin: left bottom;
  transition: all .4s linear;
}

.box ul li a:hover span:nth-child(2){
  transform: rotate(0);
}



</style>