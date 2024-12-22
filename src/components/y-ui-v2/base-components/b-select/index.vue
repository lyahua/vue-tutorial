<template>
    <div>
        <el-select v-model="currentValue">
            <el-option v-for="item in options" :key="item.value" :label="item.label" :value="item.value">
            </el-option>
        </el-select>
    </div>
</template>

<script>
export default {
    props: {
        value: {
            type: [String,Number],
            default: null
        },
        options: {
            type: Array,
            default: () => []
        }
    },
    computed:{
        currentValue:{
            get(){
                return this.value
            },
            set(value){
                this.$emit('input',value)
            }
        }
    }
}
</script>

<style lang="css" scoped></style>