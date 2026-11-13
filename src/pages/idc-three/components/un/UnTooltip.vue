<template>
    <el-tooltip v-bind="$attrs" v-on="$listeners">
        <slot v-for="(_, name) in $slots" :name="name" :slot="name" />
    </el-tooltip>
</template>

<script>
export default {
    name: 'UnTooltip',
    inheritAttrs: false,
};
</script>
