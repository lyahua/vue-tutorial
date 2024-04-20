<template>
    <div>
        <div></div>
        <h2>
            子组件：{{ value2 }}
        </h2>
    </div>
</template>

<script>
    export default {
        props:{
            value2:{
                type:Object,
                default:()=>{}
            }
        },
        created(){
            console.log(this.value2,'0-0-')
        }
    }
</script>

<style lang="css" scoped>

</style>