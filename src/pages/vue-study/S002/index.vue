<template>
    <div>
        <h2>测试</h2>
        <ElInput v-model="inputV"/>
    </div>
</template>

<script>
import ElInput from './components/ElInput.vue'
    export default {
        components:{
            ElInput
        },
        data(){
            return{
                inputV:''
            }
        }
    }
</script>

<style lang="css" scoped>

</style>