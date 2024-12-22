<script>

    export default {
        name:'Y-Button',
        props:{
            confirmTitle:{
                type: String,
            }
        },
        computed:{
            isExistConfirmTitle() {
                return this.confirmTitle
            }
        },
        render(h) {
            const { $attrs }= this
            console.log('$attrs', $attrs)

            if (this.isExistConfirmTitle) {
                return h(
                    'el-popconfirm',
                    {
                        
                    },
                    [
                        h(
                            'el-button',
                            {
                                props:{
                                    ...$attrs
                                }
                            },
                            [
                            this.$slots.default
                            ]
                        )
                    ]
                )
            }
            return h(
                'el-button',
                {
                    // ...$attrs
                    props: {
                        ...$attrs
                    }
                },
                [
                    this.$slots.default
                ]
            )
        }
    }
</script>

<style lang="css" scoped>

</style>