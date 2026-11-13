<template>
    <el-breadcrumb v-bind="$attrs" v-on="$listeners">
        <slot v-for="(_, name) in $slots" :name="name" :slot="name" />
    </el-breadcrumb>
</template>

<script>
export default {
    name: 'UnBreadcrumb',
    inheritAttrs: false,
};
</script>
