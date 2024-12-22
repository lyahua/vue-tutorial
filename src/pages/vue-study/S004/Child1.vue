<template>
    <div>
        <el-form :mode="queryForm">
            <el-form-item label="测试1">
                <el-input v-model="queryForm.a"/>
            </el-form-item>

            <el-form-item label="测试2">
                <el-input v-model="queryForm.b"/>
            </el-form-item>

            <el-form-item label="测试3">
                <el-input v-model="queryForm.c.d"/>
            </el-form-item>
        </el-form>

        <table style="width:400px;height:200px" border>
            <thead>
                <tr>
                    <td style="width:100px">1列</td>
                    <td>2列</td>
                    <td>3列</td>
                    <td>4列</td>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>1111111111111111111111111111111231111111111111231</td>
                    <td>1</td>
                    <td>1</td>
                    <td>1</td>
                </tr>
                <tr>
                    <td colspan="1">1</td>
                    <td>1</td>
                    <td>1</td>
                    <td>1</td>
                </tr>
            </tbody>
        </table>
    </div>
</template>

<script>
    export default {
        props:{
            value:{
                type:Object,
                default:()=>{}
            }
        },
        methods:{
            deepProxy(value, _this){
                    return new Proxy(value,{
                    set(obj,key,value){
                        console.log('obj', obj, key, value)
                        if (typeof obj[key] === 'object' && obj[key] !==null){

                            return this.deepProxy(obj[key],_this)
                        }
                        _this.$emit('input',{
                            ...obj,
                            [key]:value
                        })
                        return true
                    }
                })
            }
        },
        computed:{
            queryForm:{
                // get(){
                //     let _this = this;
                //     return new Proxy(this.value,{
                //         set(obj,key,value){
                //             console.log('obj', obj, key, value)
                //             _this.$emit('input',{
                //                 ...obj,
                //                 [key]:value
                //             })
                //             return true
                //         }
                //     })
                // },
                get(){
                    let _this = this;
                    return this.deepProxy(this.value, _this)
                },
                set(value){
                    console.log('设置值', value)
                    this.$emit('input', value)
                }
            }
        }
        // data(){
        //     return {
        //         queryForm:{

        //         }
        //     }
        // }
    }
</script>

<style lang="css" scoped>

</style>