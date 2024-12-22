<!-- <template>
    <div>
        <h1>12312312</h1>

        <YButton icon="el-icon-plus" type="primary" confirmTitle="111">2222 </YButton>

        <el-button icon="el-icon-plus" type="primary">1111</el-button>
    </div>
</template> -->

<script>
import YButton from '@/components/y-ui/y-button/index'
import YForm from '@/components/y-ui/y-form/index'
import YInput from '@/components/y-ui/y-input/index'
import Child1 from './Child1.vue'
import Dialog from './Dialog.vue'
    export default {
        components: {
            YButton,
            Child1,
            Dialog,
            YForm,
            YInput
        },
        data(){
            return {
                obj:{
                    a:1,
                    b:2,
                    c: {
                        d: 3
                    }
                },
                dialogVisible: false,
                fields:[
                    {
                        type:'input',
                        text: '姓名'
                    },
                ],
                myInput:''
            }
        },
        render() {
            return (
                <div>
                    {JSON.stringify(this.obj)}
                    <Child1 vModel={this.obj}/>
                    <el-button on-click={this.onClick}>给obj设置值</el-button>
                    123123

                    <hr/>

                    <el-button type="text" on-click={this.openDialog}>点击打开 Dialog</el-button>

                    <el-dialog
                        title="提示"
                        visible={this.dialogVisible}
                        width="30%"
                        before-close={this.handleClose}>
                        <span>这是一段信息</span>
                        <span slot="footer" class="dialog-footer">
                            <el-button on-click={this.cancle}>取 消</el-button>
                            <el-button type="primary" on-click={this.confirm}>确 定</el-button>
                        </span>
                    </el-dialog>


                    <hr/>
                     <Dialog ref='dialog'/>

                     <hr/>
                     <h2>表单</h2>
                     <YForm/>

                     <hr/>
                     <h2>输入框</h2>
                     <YInput vModel={this.myInput} size='mini' placeholder='请输入' on-blur={this.obBlur}>
                        <template slot="prepend">Http://</template>
                     </YInput>
                     <el-input placeholder='123' label='1111' size='medium'/>
                </div>
            )
        },
        methods:{
            onClick() {
                this.obj = {
                    a:22,
                    b:33
                }
            },
            obBlur(){
                console.log('blur', 'blur')
            },
            openDialog() {
                // return new Promise((resolve) => {
                //     this.resolve = resolve
                //     this.dialogVisible = true
                // })

                this.$refs.dialog.open().then(res=>{
                    console.log('res', res)
                })
            },
            cancle() {
                this.dialogVisible = false
            },
            confirm() {
                this.dialogVisible = false
            }, 
            handleClose() {

            }
        }
    }
</script>

<style lang="css" scoped>
h1{
    /* color:$color; */
}
</style>