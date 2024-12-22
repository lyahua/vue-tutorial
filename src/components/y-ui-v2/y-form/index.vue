<template>
  <div>
    <el-form :model="form" label-width="120px">
      <el-row v-for="(item, index) in formItems" :key="index">
        <el-col v-if="item._isShow" :span="6">
          <el-form-item :label="item.label" :prop="item.value" :rules="{required: true}">
            <component
              :is="item.type"
              :options="item.options"
              v-model="form[item.value]"
              v-bind="item.props"
              v-on="item.event"

            >
            </component>
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
  </div>
</template>

<script>
import { elementMap } from "./form-map.js";
import { isFunction } from "xe-utils";
export default {
  props: {
    fields: {
      type: Array,
      default: () => [],
    },
  },
  data() {
    return {
      form: this.init(),
    };
  },
  computed: {
    formItems() {
      return this.fields.map((item) => {
        const config = { ...item };
        const res = elementMap[config.type || "input"];
        config.type = res.component;
        config.props = Object.assign({}, res.props, item.props);

        // 处理联动
        if (isFunction(config.getProps)) {
          Object.assign(config.props, config.getProps(this.form));
        }
        config._isShow = isFunction(config.isShow)
          ? !!config.isShow(this.form)
          : typeof config.isShow === "boolean"
          ? config.isShow
          : true;

        // 处理事件
        if (config.event){
            for(let event in config.event){
                console.log('event' ,event)
                // config.event[event].bind(this, this.form)
            }
        }
        
        return config;
      });
    },
  },
  created() {
    // this.init();
  },
  methods: {
    init() {
      const obj = {};
      this.fields.forEach((item) => {
        if (item.type === "input") {
          obj[item.value] = "";
        } else if (item.type === "switch") {
          obj[item.value] = false;
        } else if (item.type === "inputNumber") {
          obj[item.type] = 0;
        } else {
          obj[item.value] = "";
        }
      });
      return obj;
    },
  },
};
</script>

<style lang="css" scoped></style>
