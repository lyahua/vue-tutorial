<script>
export default {
  name: 'Tabs',
  data() {
    return {
      activeKey: '',
    };
  },

  mounted() {
    // 刷新页面的时候，获取当前的tab，给标签进行默认选择
    let data = {
      path: this.$route.fullPath,
      title: this.$route.meta.title,
    };
    this.$store.commit('addRoutesToTab', data);

    // 刷新点击左侧菜单右侧tab高亮跟随
    this.activeKey = this.$route.fullPath;
  },

  watch: {
    // 点击左侧菜单右侧tab高亮跟随
    $route(key) {
      this.activeKey = key.fullPath;
    },
  },

  methods: {
    // 根据存储在vuex里面的tab来生成标签
    createdTag() {
      return this.$store.state.tagRoute.map(ele => {
        return [<el-tab-pane label={ele.title} key={ele.path} name={ele.path}></el-tab-pane>];
      });
    },

    // 点击标签时切换路由
    onTabClick(val) {
      if (val.name != this.$route.fullPath) {
        this.$router.history.push(val.name);
      }
    },

    // 点击关闭标签时关闭
    onTabRemove(tagName) {
      console.log('click cose', tagName);
      this.$store.commit('removeRoutesInTab', tagName);

      if (this.activeKey === tagName) {
        this.$router.history.push(this.$store.state.tagRoute[this.$store.state.tagRoute.length - 1].path);
        this.activeKey = this.$store.state.tagRoute[this.$store.state.tagRoute.length - 1].path;
      }
    },
  },

  render() {
    return (
      <div class='l_Tabs_wrap'>
        <el-tabs type='card' closable={this.$store.state.tagRoute.length>1} value={this.activeKey} on-tab-click={this.onTabClick.bind(this)} on-tab-remove={this.onTabRemove}>
          {this.createdTag()}
          {/* 
          <el-tab-pane label='用户管理' name='first'></el-tab-pane>
          */}
        </el-tabs>
      </div>
    );
  },
};
</script>
<style lang="css" scoped>
.l_Tabs_wrap {
  /* height: 40px;
  position: absolute;
  left: 64px;
  right: 10px;
  bottom: 0px; */
  width:100%;
}
</style>
