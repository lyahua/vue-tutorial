<template>
  <div class="iframe-host">
    <div class="panel control">
      <h3>父页面（宿主）</h3>

      <!-- 每个弹框一个 <iframe-embed> 实例，状态互不干扰 -->
      <div class="row">
        <el-button
          type="primary"
          size="small"
          :loading="st('A').opening"
          :disabled="st('A').open"
          @click="openOne('A')"
        >
          打开弹框A
        </el-button>
        <el-button size="small" :disabled="!st('A').open" @click="closeOne('A')">关闭A</el-button>

        <el-divider direction="vertical"></el-divider>

        <el-button
          type="primary"
          size="small"
          :loading="st('B').opening"
          :disabled="st('B').open"
          @click="openOne('B')"
        >
          打开弹框B
        </el-button>
        <el-button size="small" :disabled="!st('B').open" @click="closeOne('B')">关闭B</el-button>
      </div>

      <div class="row">
        <el-input
          v-model="titleInput"
          size="mini"
          placeholder="要给子页面设置的标题"
          style="width: 200px"
        ></el-input>
        <el-select v-model="target" size="mini" style="width: 110px">
          <el-option label="发给弹框A" value="A"></el-option>
          <el-option label="发给弹框B" value="B"></el-option>
        </el-select>
        <el-button size="mini" @click="setTitle">发送标题</el-button>
        <el-button size="mini" @click="ping">ping</el-button>
      </div>

      <div class="row status">
        <span v-for="item in embedList" :key="item">
          {{ item }}：就绪<b :class="st(item).ready ? 'ok' : 'no'">{{ st(item).ready ? '是' : '未就绪' }}</b>
          、弹框<b :class="st(item).open ? 'ok' : 'no'">{{ st(item).open ? '打开' : '关闭' }}</b>
          ；
        </span>
        往返延迟：<b>{{ rtt === null ? '-' : rtt + ' ms' }}</b>
      </div>
    </div>

    <div class="panel log">
      <h3>
        父页面收到的消息
        <el-button size="mini" style="float:right" @click="logs = []">清空</el-button>
      </h3>
      <ul class="log-list">
        <li v-for="(item, i) in logs" :key="i">
          <span class="time">{{ item.time }}</span>
          <el-tag size="mini" :type="item.tagType">{{ item.type }}</el-tag>
          <span class="msg">{{ item.text }}</span>
        </li>
        <li v-if="!logs.length" class="empty">暂无消息，等 iframe 加载后会收到 CHILD_READY 握手</li>
      </ul>
    </div>

    <div class="panel frame">
      <h3>说明</h3>
      <div class="frame-placeholder">
        每个 iframe-embed 都是常驻全屏层：弹框打开时它铺满整个视口（弹框因此能像原生弹框一样居中、遮罩覆盖全页）；
        关闭时它完全透明且 pointer-events: none，父页面照常可交互。
        两个实例各自持有 childReady / dialogOpen，且只认自己 iframe 的 message source，所以不会串台。
      </div>
    </div>

    <iframe-embed
      id="A"
      ref="A"
      label="弹框A"
      :src="childSrc"
      :origin="childOrigin"
      @state="onState"
      @message="onMessage"
      @timeout="onTimeout"
      @error="onError"
    />
    <!-- 两个弹框同时打开时，后开的要靠更高 z-index 才不被压住 -->
    <iframe-embed
      id="B"
      ref="B"
      label="弹框B"
      :src="childSrc"
      :origin="childOrigin"
      :z-index="3001"
      @state="onState"
      @message="onMessage"
      @timeout="onTimeout"
      @error="onError"
    />
  </div>
</template>

<script>
import { MSG } from './messages';
import IframeEmbed from './components/iframe-embed';

export default {
  name: 'IframeHost',
  components: { IframeEmbed },

  data() {
    return {
      embedList: ['A', 'B'],
      // 组件内部状态不是通过 $refs 暴露的（$refs 非响应式），由 @state 同步过来
      states: {
        A: { ready: false, open: false, opening: false },
        B: { ready: false, open: false, opening: false },
      },
      // 子页面服务地址：同源留空（走 hash 片段）；跨源填完整地址，如 'http://localhost:8081'
      childBase: 'http://localhost:8081',
      titleInput: '来自父页面的标题 ' + new Date().toLocaleTimeString(),
      target: 'A',
      rtt: null,
      pingSentAt: 0,
      logs: [],
    };
  },

  computed: {
    // postMessage 的目标源：跨源时必须指向子服务，否则消息会被浏览器丢掉
    childOrigin() {
      return this.childBase || window.location.origin;
    },
    // parentOrigin 告诉子页面该往哪个源回发消息，它同时是子页面的来源白名单
    childSrc() {
      const query = 'embed=1&parentOrigin=' + encodeURIComponent(window.location.origin);
      return this.childBase
        ? this.childBase + '/#/iframe-child?' + query
        : '#/iframe-child?' + query;
    },
  },

  methods: {
    st(id) {
      return this.states[id];
    },

    onState(s) {
      this.states[s.id] = { ready: s.ready, open: s.open, opening: s.opening };
    },

    openOne(id) {
      this.$refs[id].open();
    },

    closeOne(id) {
      this.$refs[id].close();
    },

    setTitle() {
      this.$refs[this.target].send(MSG.SET_TITLE, { title: this.titleInput });
    },

    ping() {
      this.pingSentAt = Date.now();
      this.$refs[this.target].send(MSG.PING, {});
    },

    onMessage(evt) {
      const tag = '[' + (evt.label || evt.id) + '] ';

      if (evt.type === MSG.CHILD_READY) {
        // 就绪后再下发数据，避免子页面监听未注册导致丢消息
        this.$refs[evt.id].send(MSG.SET_TITLE, { title: this.titleInput });
        this.addLog(evt.type, tag + '已就绪，自动下发标题', 'success');
        return;
      }
      if (evt.type === MSG.PONG) {
        this.rtt = Date.now() - this.pingSentAt;
        this.addLog(evt.type, tag + 'pong 回应，延迟 ' + this.rtt + 'ms', 'success');
        return;
      }
      if (evt.type === MSG.SUBMIT) {
        this.addLog(evt.type, tag + '表单提交: ' + JSON.stringify(evt.payload), 'warning');
        this.$notify.success({
          title: (evt.label || evt.id) + ' 提交',
          message: JSON.stringify(evt.payload),
        });
        return;
      }
      if (evt.type === MSG.DIALOG_CLOSED) {
        this.addLog(evt.type, tag + '弹框已关闭，iframe 收起为透明穿透层', 'success');
        return;
      }
      if (evt.type === MSG.REQUEST_OPEN) {
        this.addLog(evt.type, tag + '已把 iframe 提升为全屏层并锁定父页面滚动', 'warning');
        return;
      }
      if (evt.type === MSG.CHILD_LOG) {
        this.addLog(evt.type, tag + evt.payload.text, 'info');
        return;
      }
      this.addLog(evt.type, tag + JSON.stringify(evt.payload), 'info');
    },

    onTimeout(evt) {
      this.$message.error((evt.label || evt.id) + ' 加载超时，打开失败');
    },

    onError(evt) {
      this.$message.warning(evt.reason);
    },

    // el-tag 的 type 只支持 success/info/warning/danger/空串，没有 'primary'
    addLog(type, text, tagType) {
      this.logs.unshift({
        time: new Date().toLocaleTimeString(),
        type,
        text,
        tagType: tagType || 'info',
      });
      if (this.logs.length > 50) this.logs.pop();
    },
  },
};
</script>

<style lang="less" scoped>
.iframe-host {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.panel {
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 12px 16px;
  h3 {
    margin: 0 0 10px;
    font-size: 14px;
  }
}
.row {
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  &:last-child {
    margin-bottom: 0;
  }
}
.status .ok {
  color: #67c23a;
}
.status .no {
  color: #f56c6c;
}
.log-list {
  margin: 0;
  padding: 0;
  list-style: none;
  max-height: 180px;
  overflow: auto;
  font-size: 12px;
  li {
    padding: 4px 0;
    border-bottom: 1px dashed #f0f0f0;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .time {
    color: #909399;
  }
  .msg {
    color: #303133;
    word-break: break-all;
  }
  .empty {
    color: #c0c4cc;
    justify-content: center;
  }
}
.frame-placeholder {
  border: 1px dashed #dcdfe6;
  border-radius: 4px;
  padding: 24px;
  color: #909399;
  font-size: 12px;
  line-height: 1.8;
  background: #fafafa;
}
</style>
