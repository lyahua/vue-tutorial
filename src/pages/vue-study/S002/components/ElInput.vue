<template>
    <div>
        <el-input v-bind="this.$attrs" v-on="$listeners" ref="inp">
            <!-- 使用组件插槽方式1： 一个一个写-->
            <!-- <template #prepend>
                <slot name="prepend"></slot>
            </template>

            <template v-slot:append>
                <slot name="append"></slot>
            </template> -->

            <!-- 使用组件插槽方式2：$slots循环 -->
            <template v-for="(value,name) in $slots" v-slot:[name]>
                <slot :name="name" ></slot>
            </template>
        </el-input>
        <!-- <sapn v-for="(item,index) in obj" :key="index">{{ item }}</sapn> -->
    </div>
</template>

<script>
    export default {
        data(){
            return{
                obj:{
                    a:[1],
                    b:2
                }
            }
        },
        created(){
            console.log('this.$attrs',this.$attrs,this.$slots)
            
        },
        mounted(){
            // ref提升
            const entries = Object.entries(this.$refs.inp);
            for(const [key,value] of entries){
                if(!this[key]){
                    this[key] = value;
                }
            }
            console.log(this)
        }
    }
</script>

<style lang="scss" scoped>

</style>