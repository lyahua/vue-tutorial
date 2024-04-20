<template>
    <div>
        <h1 class="a">123123</h1>
        <input v-model="form.value"/>
        <Child v-model="form"/>
    </div>
</template>

<script>
// let arr = [
//     {
//         iocn:'noe',
//         name:'汇总'
//     },{
//         icon:'cir',
//         value:'12'
//     },{
//         icon:'cir',
//         value:'23'
//     }
// ]
// function delay(time){
//     let now = Date.now();
//     while(now - Date.now()>time){

//     }
// }
// delay(1000);
import Child from './components/Child.vue'
export default {
    components:{
        Child
    },
    data(){
        return{
            form:{
                value:'',
                name:'12313'
            }
        }
    }
}
</script>

<style lang="less" scoped>
// @color:blue;
// @import '~@/utils/styles/common.less';
.a {
    color: @color;
    padding: @base-size;
}
</style>