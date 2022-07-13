<template>
  <div>
    <Tree
      style="height:600px;overflow-y:auto;"
      :data="data3"
      show-checkbox
      check-strictly
    ></Tree>
  </div>
</template>

<script>
// import {
//   getWorkshopAll, // 第一层
//   findProcedure, // 第二层
//   findMachine, // 第三层
// } from "@/api/index";
export default {
  data() {
    return {
      data3: [],
      lineData: [
        { id: "01", title: "低压车间", procedureId: "" },
        { id: "02", title: "拉丝工序", procedureId: "01" },
        { id: "03", title: "绞线工序", procedureId: "01" },
        { id: "05", title: "拉丝1", procedureId: "02" },
        { id: "06", title: "拉丝2", procedureId: "02" },
        { id: "07", title: "拉丝3", procedureId: "02" },
        { id: "08", title: "拉丝4", procedureId: "02" },
        { id: "09", title: "拉丝5", procedureId: "02" },
        { id: "10", title: "绞线1", procedureId: "03" },
        { id: "11", title: "绞线2", procedureId: "03" },
        { id: "12", title: "绞线3", procedureId: "03" },
        { id: "13", title: "绞线4", procedureId: "03" },
        { id: "14", title: "绞线5", procedureId: "03" },
      ],
      token: "",
    };
  },
  created() {
    this.token = JSON.parse(localStorage.getItem("accessToken"));
    console.log('this.toke',this.token)
    // this.init();
    console.log(this.lineToTree(this.lineData));
    this.lineData = this.lineToTree(this.lineData);
  },
  methods: {
    // lineToTree(list) {
    //   const treeData = [];
    //   list.forEach((ele) => {
    //     // 1 先找第一层父节点,proceuId为空
    //     if (!ele.procedureId) {
    //       treeData.push(ele);
    //     }
    //     // 找子级，子级的procedureId==父级的id
    //     const children = list.filter((val) => val.procedureId === ele.id);
    //     // 没找到不做任何处理
    //     if (children.length === 0) return;
    //     // 找到往父级里面塞
    //     ele.children = children;
    //   });
    //   return treeData;
    // },
    // async init() {
    //   await getWorkshopAll().then((res) => {
    //     if (res.success) {
    //       res.result.forEach((ele) => this.data3.push(ele));
    //     }
    //   });
    //   const params2 = { accessToken: this.token };
    //   await findProcedure(params2).then((res) => {
    //     if (res.success) {
    //       res.result.forEach((ele) => this.data3.push(ele));
    //     }
    //   });
    //   const param3 = { token: this.token };
    //   await findMachine(param3).then((res) => {
    //     if (res.success) {
    //       res.result.forEach((ele) => this.data3.push(ele));
    //     }
    //   });
    //   console.log("this.data3", this.data3);
    //   this.data3 = this.lineToTree(this.data3);
    // },
  },
};
</script>

<style lang="css" scoped></style>
