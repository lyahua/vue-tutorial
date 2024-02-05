<template>
    <div>
        子组件
        <slot name="test" :userInfo="user"></slot>
    </div>
</template>

<script>
    export default {
        data(){
            return{
                user:{
                    name:'zhangshan',
                    age:18
                }
            }
        }
    }
</script>

<style lang="css" scoped>

</style>