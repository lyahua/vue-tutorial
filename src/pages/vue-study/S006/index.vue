<template>
    <div>
        <h2>Test </h2>
        <YForm :fields="fields"/>
    </div>
</template>

<script>
    import YForm from '@/components/y-ui-v2/y-form/index.vue'
    export default {
        components:{
            YForm
        },
        data(){
            return {
                fields:[
                    {
                        type:'input',
                        label: '姓名',
                        value:'name',
                        event: {
                            click:()=>{
                                console.log('click')
                            },
                            input: (e)=>{
                                console.log('0000',e,this.$event)
                            },
                            blur: ()=>{
                                console.log('blur')
                            },
                            change: ()=>{
                                console.log('change')
                            }

                        }
                    },
                    {
                        type:'inputNumber',
                        label: '年龄',
                        value: 'age'
                    },
                    {
                        type: 'switch',
                        label: '是否配送',
                        value: 'isDeiver',
                        
                    },
                    {
                        type: 'select',
                        label: '爱好',
                        value: 'hobby',
                        options: [
                            {
                                label:'吃饭',
                                value: 'eat'
                            },{
                                label: '睡觉',
                                value: 'seelp'
                            }
                        ],
                        isShow: (form)=>{
                            return form.isDeiver
                        }
                    }
                ]
            }
        }
    }
</script>

<style lang="css" scoped>

</style>