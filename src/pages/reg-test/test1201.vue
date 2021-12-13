<template>
  <div>
    <div class='image1'>
      <img :src='$img.logo1'/>
      <h2>平移动画</h2>
      <p>最简单的平移动画</p>
    </div>

    <div class='box'></div>
  </div>
</template>

<script>
// import img from "@/utils/img.js"
  export default {
    mounted(){
      const data=[
        {id:1,name:'1'},
        {id:1,name:'1'},
        {id:1,name:'1'},
        {id:2,name:'2'},
        {id:2,name:'2'},
        {id:3,name:'3'},
        {id:3,name:'3'},
        {id:1,name:'1'},
      ]

      let newArr=[];
      data.forEach(ele=>{
       if(!newArr.find((x)=>x.id==ele.id)){
         newArr.push(ele)
       }
      })
      console.log('newArr',newArr)



    }
  }
</script>

<style lang="css" scoped>
.image1{
  border:2px solid orange;
  border-radius: 5px;
  /* overflow: hidden; */
  width:413px;
  height:551px;
}
.image1 img{
  transition: all .5s linear;
}

.image1:hover img{
  opacity: .5;
}

h2,div{
	position: absolute;
	transition: all 0.5s;
	color: #000;
}
.image1 h2{
	
	left:10%;
	bottom:30%;
	
}
.image1 p{
	left:10%;
	/* top:8%; */
	color: #000;
}

.box{
  position: absolute;
  /* top:100%; */
  width:20px;
  height:20px;
  background: red;
  left:80%;
}
</style>