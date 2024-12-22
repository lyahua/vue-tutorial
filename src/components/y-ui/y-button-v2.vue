<template>
    <div>
        <el-button :loading="loading" v-bind="$attrs" v-on="$listeners"></el-button>
    </div>
</template>

<script>
    export default {
        data(){
            return {
                loading: false
            }
        },
    }
</script>

<style lang="css" scoped>

</style>