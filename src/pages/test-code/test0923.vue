<template>
  <div>
    <el-table :data="tableData" style="width: 100%" :cell-style="cellStyle">
      <el-table-column prop="date" label="日期" width="180">
        <template slot-scope="scope">
          <span>{{ scope.row.date }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="name" label="姓名" width="180"> </el-table-column>
      <el-table-column prop="address" label="地址"> </el-table-column>
      <el-table-column label="操作">
        <template slot-scope="scope">
          <el-button size="mini" @click="handleEdit(scope.$index, scope.row)"
            >编辑</el-button
          >
          <el-button
            size="mini"
            type="danger"
            @click="handleDelete(scope.$index, scope.row)"
            >删除</el-button
          >
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script>
export default {
  data() {
    return {
      tableData: [
        {
          date: "02",
          name: "王小虎",
          address: "上海市普陀区金沙江路 1518 弄",
        },
        {
          date: "04",
          name: "王小虎",
          address: "上海市普陀区金沙江路 1517 弄",
        },
        {
          date: "01",
          name: "王小虎",
          address: "上海市普陀区金沙江路 1519 弄",
        },
        {
          date: "03",
          name: "王小虎",
          address: "上海市普陀区金沙江路 1516 弄",
        },
      ],
    };
  },

  methods: {
    handleEdit(index, row) {
      console.log(index, row);
    },
    handleDelete(index, row) {
      console.log(index, row);
    },
    cellStyle({ row, column, rowIndex, columnIndex }) {
        console.log(row,column)
      //四个参数中要确定两个才能给指定单元格添加样式
      if (columnIndex == 0) {
        let newObject = [];
        for (let i = 0; i < this.tableData.length; i++) {
          //terminalCustomers是我的表格中列索引为3的属性名,将后台返回的数组对象中属性名为terminalCustomers的利用for循环拿出来,并和纵坐标（rIdx）以对象的形式放到newObject中
          // newObject中放的是当前属性下元素值和元素对应纵坐标
          newObject.push({
            attr: this.tableData[i].date,
            rIdx: i,
          });
        }
        // 将一列中的数据放到arr中
        let arr = [];
        for (var j = 0; j < newObject.length; j++) {
          arr.push(Number(newObject[j].attr));
        }
        //得到最大值和最小值
        let max = Math.max.apply(null, arr); //直接Math.max(arr)会报错
        let min = Math.min.apply(null, arr);

        let arr1 = [];
        let arr2 = [];

        //因为一列中可能有两个值是一样大的，他们的单元格样式都需要改变，所以遍历newObject这个数组对象，将相同属性值对应的总表表取出来放到一个空数组中
        for (let c = 0; c < newObject.length; c++) {
          //得到所有最大值所在行的所有索引
          if (Number(newObject[c].attr) == max) {
            arr1.push(newObject[c].rIdx);
            //得到所有最小值所在行的所有索引
          } else if (Number(newObject[c].attr) == min) {
            arr2.push(newObject[c].rIdx);
          }
        }
        //已知横坐标，对纵坐标进行遍历渲染，将最大值全部变色
        for (let m = 0; m < arr1.length; m++) {
          if (columnIndex == 0 && rowIndex == arr1[m]) {
            return `color:rgb(196,215,155)`;
          }
        }
        //将最小值全部变色
        for (let s = 0; s < arr2.length; s++) {
          if (columnIndex == 0 && rowIndex == arr2[s]) {
            return `background:rgb(230,184,183);border-radius:20px`;
          }
        }
      }
    },
  },
};
</script>

<style>
</style>

