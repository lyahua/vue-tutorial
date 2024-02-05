<template>
    <div>
        <h2>测试</h2>
        <ElInput v-model="inputV" ref="test">
            <!-- <template slot="prepend">Http://</template> -->
            <template v-slot:prepend>
                Http://
            </template>

            <template v-slot:append>
                .com
            </template>
        </ElInput>
        <hr/>

        <t-slots>
            11111
        </t-slots>
        <hr/>

        <Son>
            <template v-slot:test="slotProps">
                测试+{{ slotProps.userInfo.age }}
            </template>
        </Son>
    </div>
</template>

<script>
import ElInput from './components/ElInput.vue';
import TSlots from './components/TSlots.vue';
import Son from './components/Son.vue'
    export default {
        components:{
            ElInput,
            TSlots,
            Son
        },
        data(){
            return{
                inputV:''
            }
        },
        created(){
            this.$nextTick(()=>{
                this.$refs.test.focus();
            })
        }
    }
</script>

<style lang="css" scoped>

</style>