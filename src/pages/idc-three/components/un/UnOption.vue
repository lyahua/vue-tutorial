<template>
    <el-option v-bind="$attrs" v-on="$listeners">
        <slot v-for="(_, name) in $slots" :name="name" :slot="name" />
    </el-option>
</template>

<script>
export default {
    name: 'UnOption',
    inheritAttrs: false,
};
</script>
