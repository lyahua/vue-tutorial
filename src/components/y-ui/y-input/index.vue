<script>
export default {
    inheritAttrs: false,
    props: {
        value: {
            type: String,
            default: ''
        }
    },
    render(h) {
        console.log(this.$attrs)
        console.log('this.$listeners', this.$listeners)
        console.log('this.$slots', this.$slots)
        let prepend = this.$slots.prepend
        console.log('prepend', prepend)
        return h(
            'el-input',
            {
                attrs: {
                    ...this.$attrs,
                },
                props: {
                    value: this.value,
                },
                domProps: {
                    value: this.value,
                },
                on: {
                    ...this.$listeners,
                    input: e => {
                        this.$emit('input', e)
                    }
                },
                // 作用域插槽的格式为
                // { name: props => VNode | Array<VNode> },

                scopedSlots: {
                    prepend: function (props) {
                        // 这里可以访问到插槽传递的参数
                        console.log('props-----', props)
                        return h('span', props.text);
                    }
                }
            },

        )
    }
}
</script>

<style lang="scss" scoped></style>