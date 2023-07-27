<template>
  <!-- 中天退火收线 -->
  <div id="zl-line-page">
    <notice-bar />

    <div class="head-content">
      <div>
        <h2>扫描区</h2>
      </div>
      <!-- 操作员 -->
      <div class="pac-no">
        <van-row style="display: flex; align-items: center">
          <van-col span="7" style="display: flex; justify-content: left">扫描收线轴</van-col>
          <van-col span="17">
            <van-field v-model="userName" @keyup.enter="showDeatilMessage" />
          </van-col>
          <!-- <van-col span="8">
            <van-button :block="true" type="primary" icon="circle">叫收线架</van-button>
          </van-col> -->
        </van-row>
        <van-row style="display: flex; margin: 10px">
          <van-cell-group>
            <van-field label="姓名" v-model="userName" @keyup.enter="showdialog = true"></van-field>
          </van-cell-group>
        </van-row>
        <van-row style="display: flex; margin: 10px">
          <van-cell-group>
            <van-field label="姓名" v-model="userName" @keyup.enter="showDeatilMessage"></van-field>
          </van-cell-group>
        </van-row>
        <van-row style="display: flex; align-items: center; margin: 10px 0">
          <van-col span="7" style="display: flex; justify-content: left">扫描退火收线架</van-col>
          <van-col span="17">
            <van-field v-model="userName2" />
          </van-col>
        </van-row>
      </div>
    </div>

    <van-divider :style="{ color: '#1989fa', borderColor: '#ccc', margin: 0 }" v-show="showNode" />

    <div style="padding: 20px 8px 10px" v-show="showNode">
      <h2>大拉钢丝信息</h2>
    </div>
    <div style="
        width: 100%;
        overflow: hidden;
        box-sizing: border-box;
        padding: 0 8px;
        background: #fff;
      " v-show="showNode">
      <!-- <van-row class="text-style">
        <van-col span="24"><span>厂家:</span><span>中天钢铁集团（南通）有限公司</span></van-col>
      </van-row> -->

      <!-- <van-row class="text-style">
        <van-col span="6"><span>包号:</span><span>44</span></van-col>
        <van-col span="6"><span>包重:</span><span>2035kg</span></van-col>
        <van-col span="6"><span>碳钢量:</span><span>85</span></van-col>
        <van-col span="6"><span>锰钢量:</span><span>85</span></van-col>
      </van-row> -->

      <van-row class="text-style">
        <van-col span="12"><span>规格:</span><span>5.5</span></van-col>
        <van-col span="12"><span>炉号:</span><span>822033030674</span></van-col>
      </van-row>

      <van-row class="text-style">
        <!-- <van-col span="12"><span>批号:</span><span>F2203170015</span></van-col> -->
        <van-col span="12"><span>生产日期:</span><span>2022-07-27</span></van-col>
      </van-row>

      <van-row class="text-style">
        <van-col span="12"><span>钢丝质量等级:</span><span>A</span></van-col>
        <van-col span="12"><span>钢丝质量描述:</span><span>A</span></van-col>
      </van-row>

      <van-row class="text-style">
        <van-col span="12"><span>物料编码:</span><span>90001110</span></van-col>
        <van-col span="12"><span>物料描述:</span><span>3.25HT</span></van-col>
      </van-row>
    </div>

    <van-divider :style="{ color: '#1989fa', borderColor: '#ccc', margin: 0 }" v-show="showNode" />

    <div style="padding: 20px 8px 10px" v-show="showNode">
      <h2>订单信息</h2>
    </div>

    <div style="
        width: 100%;
        overflow: hidden;
        box-sizing: border-box;
        padding: 0 8px;
        background: #fff;
      " v-show="showNode">
      <van-row class="text-style">
        <van-col span="12"><span>工序订单:</span><span>DL0000001</span></van-col>
        <van-col span="12"><span>物料编码:</span><span>90001110</span></van-col>
      </van-row>
      <van-row class="text-style">
        <van-col span="24"><span>物料描述:</span><span>3.25HT</span></van-col>
      </van-row>
      <van-row class="text-style">
        <van-col span="12"><span>机台已产吨数:</span><span>10.55kg</span></van-col>
        <van-col span="12"><span>机台计划产量:</span><span>30kg</span></van-col>
      </van-row>
      <van-row class="text-style">
        <van-col span="12"><span>计划开始时间:</span><span>22-05-18</span></van-col>
        <van-col span="12"><span>计划结束时间:</span><span>22-05-23</span></van-col>
      </van-row>
    </div>

    <van-divider :style="{ color: '#1989fa', borderColor: '#ccc', margin: 0 }" v-show="showNode" />

    <div class="btn-content" v-show="showNode">
      <div class="btn">
        <van-button type="primary" @click="openAQualityModal" block>A质量</van-button>
        <!-- <van-button type="primary" @click="openBQualityModal">B质量</van-button> -->
        <van-button type="primary" @click="openCQualityModal" block>C质量</van-button>
      </div>
    </div>
    <!-- 显示输入的信息 -->
    <van-dialog v-model="showdialog" title="信息输入" show-cancel-button @confirm="showconfirm">
      <div style="
          padding: 10px 10px;
          position: relative;
          background: rgba(247, 248, 250, 1);
        ">
        <van-row style="display: flex; align-items: center; margin: 10px">
          <van-cell-group>
            <van-field label="姓名" v-model="userName" input-align="right" />
          </van-cell-group>
        </van-row>
        <van-row style="display: flex; align-items: center; margin: 10px">
          <van-cell-group>
            <van-field label="年龄" v-model="age" input-align="right" />
          </van-cell-group>
        </van-row>
        <van-row style="align-items: center; margin: 10px">
          <van-cell title="时间" v-model="date" clickable @click="showCalendar = true" />
        </van-row>
        <van-row style="align-items: center; margin: 10px">
          <van-cell title="地址" :value="value_1" clickable @click="showPicker = true" />
        </van-row>
        <van-row style="align-items: center; margin: 10px">
          <van-cell title="爱好" :value="value_2" clickable @click="showPicker2 = true"/>
        </van-row>
      </div>
    </van-dialog>

    <van-calendar v-model="showCalendar" type="range" @confirm="onConfirm" />
    <van-popup v-model="showPicker" position="bottom">
      <van-picker show-toolbar :columns="columns" @cancel="showPicker = false" @confirm="onConfirm1" />
    </van-popup>

    <van-popup v-model="showPicker2" position="bottom">
      <van-picker show-toolbar :columns="columns2"  @cancel="showPicker2 = false" @confirm="onConfirm2" />
    </van-popup>

    <!-- B质量注册 -->
    <van-dialog v-model="show" title="A质量注册" show-cancel-button @confirm="modalConfirm">
      <div class="dialog-page">
        <van-row style="display: flex; align-items: center">
          <van-col span="8" style="display: flex; justify-content: left">收线长度</van-col>
          <van-col span="16">
            <van-field v-model="collectionLength" />
          </van-col>
        </van-row>
      </div>
    </van-dialog>

    <!-- C质量 -->
    <van-dialog v-model="show2" title="C质量" show-cancel-button @confirm="modalConfirm">
      <div class="dialog-page">
        <van-row style="display: flex; align-items: center">
          <van-col span="8" style="display: flex; justify-content: left">质量描述</van-col>
          <van-col span="16">
            <!-- <van-dropdown-menu>
                <van-dropdown-item v-model="value1" :options="list" />
              </van-dropdown-menu> -->
            <select name="city" id="city" class="select-content">
              <option value="1">113-直径负差</option>
              <option value="2">115-直径超差</option>
              <option value="3">117-椭圆度超差</option>
            </select>
          </van-col>
        </van-row>

        <div>
          <van-row>
            <van-col :span="8">检测项目</van-col>
            <van-col :span="8">标准值</van-col>
            <van-col :span="8">输入实际值</van-col>
          </van-row>
          <van-row style="background: #fff">
            <van-col :span="8">强度</van-col>
            <van-col :span="8">2.3</van-col>
            <van-col :span="8">4.4</van-col>
          </van-row>
        </div>
      </div>
    </van-dialog>
  </div>
</template>

<script>
import { Toast } from "vant";
import NoticeBar from "@/components/notice/NoticeBar.vue";
export default {
  components: {
    NoticeBar,
  },
  data() {
    return {
      imgsrc: require('@/assets/pic/th.png'),
      date: "",
      value_1: "",
      value_2: "",
      showPicker: false,
      showPicker2: false,
      columns: [
        {
          text: "浙江",
          children: [
            {
              text: "杭州",
              children: [{ text: "西湖区" }, { text: "余杭区" }],
            },
            {
              text: "温州",
              children: [{ text: "鹿城区" }, { text: "瓯海区" }],
            },
          ],
        },
        {
          text: "无锡",
          children: [
            {
              text: "江阴",
              children: [{ text: "新桥镇" }, { text: "华士镇" }],
            },
            {
              text: "市区",
              children: [{ text: "" }],
            },
          ],
        },
      ],
      columns2: [
        {
          text: `<img class="cloumns-img" src='${this.imgsrc}'>`+"球类运动",
          children: [
            {
              text: "足球",
              icon: "1",
            },
            {
              text: "篮球",
              icon: "2",
            },
            {
              text: "手球",
              icon: "3",
            },
          ],
        },
        {
          text: "电竞游戏",
          icon: "2",
          children: [{
            text: "英雄联盟",
            icon: "1"
          },
          {
            text: "反恐精英",
            icon: "2"
          },
          {
            text: "荒野大镖客",
            icon: "3"
          }]
        }
      ],

      showPicker: false,
      showCalendar: false,
      showdialog: false,
      age: "",
      userName: "TH01",
      userName2: "0000001",
      show: false,
      show2: false,
      collectionLength: "", // 收线长度
      value1: "",
      list: [
        { text: "默认排序", value: "a" },
        { text: "好评排序", value: "b" },
        { text: "销量排序", value: "c" },
      ],
      showNode: false,
    };
  },
  methods: {
    onConfirm(date) {
      const [start, end] = date;
      this.showCalendar = false;
      this.date = `${start.getMonth() + 1}/${start.getDate()} - ${end.getMonth() + 1
        }/${end.getDate()}`;
    },
    onConfirm1(value) {
      Toast(`当前值：${value}`);
      this.value_1 = value.join(",");
      this.showPicker = false;
    },
    onConfirm2(value) {
      this.value_2 = value.join(",");
      this.showPicker2 = false;
    },
    showconfirm() { },
    modalConfirm() { },
    openAQualityModal() {
      this.show = true;
    },
    openCQualityModal() {
      this.show2 = true;
    },
    /**
     * 暂存库弹框点击确定
     */
    stagModalConfirm() {
      Toast("指令发送成功");
    },
    showDeatilMessage() {
      this.showNode = true;
    },
  },
};
</script>

<style lang="css" scoped>
#zl-line-page {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(247, 248, 250, 1);
  overflow: auto;
}

.head-content {
  display: flex;
  flex-direction: column;
  width: 100%;
  /* border: 2px solid #eee; */
  overflow: hidden;
  background: rgba(247, 248, 250, 1);
  box-sizing: border-box;
  padding: 8px;
}

#zl-line-page .pac-bof>>>.van-dropdown-item--down {
  display: flex;
  justify-content: center;
  align-content: center;
}

#zl-line-page .pac-bof>>>.van-dropdown-item__content {
  width: 94%;
  left: 3%;
}

#zl-line-page .pac-bof>>>.van-dropdown-menu__item {
  justify-content: flex-start;
}

/deep/.van-dropdown-menu__bar {
  box-shadow: unset !important;
}

.text-style {
  line-height: 34px;
}

.btn-content {
  width: 100%;
  box-sizing: border-box;
  padding: 0 8px;
  margin-top: 20px;
}

.btn {
  width: 100%;
  display: flex;
  justify-content: space-between;
  margin: 10px 0;
  gap: 10px;
}

.dialog-page {
  box-sizing: border-box;
  padding: 10px 10px;
  position: relative;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(247, 248, 250, 1);
}

.select-content {
  height: 44px;
  width: 100%;
  outline: none;
}
</style>
