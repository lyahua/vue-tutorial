<template>
    <el-tag v-bind="$attrs" v-on="$listeners">
        <slot v-for="(_, name) in $slots" :name="name" :slot="name" />
    </el-tag>
</template>

<script>
export default {
    name: 'UnTag',
    inheritAttrs: false,
};
</script>
