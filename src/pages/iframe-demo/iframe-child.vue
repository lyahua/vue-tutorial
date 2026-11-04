<template>
  <!-- 子页面只保留一个 el-dialog，默认不展示，由父页面按钮触发 -->
  <el-dialog
    title="自动弹出的弹框"
    :visible.sync="dialogVisible"
    width="420px"
    append-to-body
    @closed="embedOnDialogClosed"
  >
    <el-form label-width="80px" size="small">
      <el-form-item label="标题">
        <el-input v-model="form.name" placeholder="随便填点东西"></el-input>
      </el-form-item>
      <el-form-item label="备注">
        <el-input v-model="form.remark" type="textarea" :rows="2"></el-input>
      </el-form-item>
    </el-form>
    <p class="dialog-tip">父页面传来的标题会回填到这里：{{ title }}</p>

    <span slot="footer">
      <el-button size="mini" @click="dialogVisible = false">取消</el-button>
      <el-button size="mini" type="primary" @click="submit">提交给父页面</el-button>
    </span>
  </el-dialog>
</template>

<script>
import { MSG } from './messages';
import embedChild from './mixins/embed-child';

export default {
  name: 'IframeChild',
  // 握手、脱框架、开关弹框协商全在 mixin 里，这里只剩业务
  mixins: [embedChild],

  data() {
    return {
      title: '默认标题（子页面自己的）',
      form: {
        name: '',
        remark: '',
      },
    };
  },

  computed: {
    // mixin 握手时把它带给父页面
    embedHandshakeTitle() {
      return this.title;
    },
  },

  // 业务只声明自己关心的消息；框架消息（ACK_OPEN / OPEN_DIALOG 等）mixin 已处理
  embedHandlers: {
    [MSG.SET_TITLE](payload) {
      this.title = payload.title;
    },
  },

  methods: {
    submit() {
      this.embedPost(MSG.SUBMIT, { ...this.form });
      this.embedPost(MSG.CHILD_LOG, { text: '弹框已关闭' });
      this.dialogVisible = false;
    },
  },
};
</script>

<style lang="less" scoped>
.dialog-tip {
  margin-top: 8px;
  color: #e6a23c;
  font-size: 12px;
}
</style>
