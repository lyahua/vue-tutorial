<template>
  <div>
    <!-- v-model语法糖的实现 -->
    <my-input v-model="price" />
    <!-- 不使用v-model -->
    <my-input :value="price" @input="inputChange" />
    <h2>{{ price }}</h2>
  </div>
</template>

<script>
import MyInput from "./components/MyInput.vue";
export default {
  name: "Test0726",
  components: {
    MyInput,
  },
  data() {
    return {
      price: "",
    };
  },
  methods: {
    inputChange(e) {
      this.price = e;
    },
  },
};
</script>

<style lang="css" scoped></style>
