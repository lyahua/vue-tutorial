<template>
    <!-- 透传薄封装：$attrs 走 props，$listeners 走事件，插槽原样转发。
         将来真实项目把 el-button 换成自家组件时，只改这一层，业务模板零改动。 -->
    <el-button v-bind="$attrs" v-on="$listeners">
        <slot v-for="(_, name) in $slots" :name="name" :slot="name" />
    </el-button>
</template>

<script>
export default {
    name: 'UnButton',
    inheritAttrs: false,
};
</script>
