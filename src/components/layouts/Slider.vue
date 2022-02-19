<template>
  <div class="slider">
    <el-menu default-active="1001"   background-color="#545c64" active-text-color='#303133'>
      <el-submenu :index="item.id+''" v-for='item in routes' :key='item.id' >
        <template slot="title">
          <i :class='item.icon'></i>
          <span>{{item.text}}</span>
        </template>
        <el-menu-item v-for='item2 in item.arr' :key='item2.id'  :index='item2.id+""'>
          <router-link :to="item2.path"  v-text='item2.meta.title' tag='div' exact-active-class="lightHeight"></router-link>
        </el-menu-item>
      </el-submenu>
    </el-menu>
  </div>
</template>

<script>
import arr from '@/pages/index'
import {mapMutations} from 'vuex'
export default {
  data() {
    return {
      routes: [], // 将路由赋值在这里进行遍历菜单
    };
  },
  methods:{
    ...mapMutations('routeGenertate',['addRoutesToTab'])
  },

  watch: {
    // 写在slider组件里面，当点击slider的菜单进行路由切换时，将路由添加到vuex里面进行缓存起来
    $route(key) {
      let data = {
        path: key.fullPath,
        title: key.meta.title,
      };
      // this.$store.commit('addRoutesToTab', data);
      this.addRoutesToTab(data)
    },
  },

  mounted() {
    this.routes=arr
  },
};
</script>

<style lang="css" scoped>
.slider {
  position: absolute;
  left: 0;
  width: 150px;
  top: 0;
  bottom: 0;
  background: #fff;
  overflow: auto;
}
.el-menu{
  height: 100%;
}
.el-submenu .el-menu-item{
  min-width:0px;
}
.lightHeight{
  color:orange;
}
</style>