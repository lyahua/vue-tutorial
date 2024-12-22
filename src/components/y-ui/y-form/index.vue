<script>
// const formMap = {
//     'input': 'el-input',
//     'select': 'el-select'

// }
export default {
    name: 'Y-Form',
    props: {
        fields: {
            type: Array,
            default: () => [
                {
                    type: 'input',
                    label: '姓名',
                    value: 'name'
                }
            ]
        }
    },
    data() {
        return {

        }
    },
    render(h) {
        console.log('this', this)
        return h(
            'el-form',
            {
                attrs: {
                    ...this.$attrs,
                },
            },
            [
                this.fields.map(item => {
                    return h('el-form-item',
                        {
                            props: {
                                label: item.label
                            }
                        },
                        [
                            h('el-input')
                        ]
                    )
                })

            ]
        )
    }
}
</script>

<style lang="css" scoped></style>