<template>
    <el-breadcrumb-item v-bind="$attrs" v-on="$listeners">
        <slot v-for="(_, name) in $slots" :name="name" :slot="name" />
    </el-breadcrumb-item>
</template>

<script>
export default {
    name: 'UnBreadcrumbItem',
    inheritAttrs: false,
};
</script>
