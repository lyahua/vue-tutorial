<template>
    <div>
        <el-input v-bind="this.$attrs" v-on="$listeners"></el-input>
    </div>
</template>

<script>
    export default {
        created(){
            console.log('this.$attrs',this.$attrs)
        }
    }
</script>

<style lang="scss" scoped>

</style>