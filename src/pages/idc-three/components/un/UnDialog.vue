<template>
    <!-- el-dialog 的 title/default/footer 都是普通插槽，$slots 透传即可。
         注意：若将来要封装 el-table-column 这类 scoped slot 组件，本透传模式不够用，
         需要额外转发 $scopedSlots（见 un/index.js 头部注释）。 -->
    <el-dialog v-bind="$attrs" v-on="$listeners">
        <slot v-for="(_, name) in $slots" :name="name" :slot="name" />
    </el-dialog>
</template>

<script>
export default {
    name: 'UnDialog',
    inheritAttrs: false,
};
</script>
