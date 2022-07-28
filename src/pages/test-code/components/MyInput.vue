<template>
  <div>
    <span>
      <input
        ref="input"
        :value="value"
        @input="$emit('input', $event.target.value)"
      />
    </span>
  </div>
</template>

<script>
export default {
  props: {
    value: {
      type: String,
      default: "",
    },
  },
};
</script>

<style lang="css" scoped></style>
