<template>
  <a-table :data-source="data" :columns="columns">
    <div slot="filterDropdown" slot-scope="{ setSelectedKeys, selectedKeys, confirm, clearFilters, column }"
      style="padding: 8px">
      <a-input v-ant-ref="c => (searchInput = c)" :placeholder="`Search ${column.dataIndex}`" :value="selectedKeys[0]"
        style="width: 188px; margin-bottom: 8px; display: block;"
        @change="e => setSelectedKeys(e.target.value ? [e.target.value] : [])"
        @pressEnter="() => handleSearch(selectedKeys, confirm, column.dataIndex)" />
      <a-button type="primary" icon="search" size="small" style="width: 90px; margin-right: 8px"
        @click="() => handleSearch(selectedKeys, confirm, column.dataIndex)">
        Search
      </a-button>
      <a-button size="small" style="width: 90px" @click="() => handleReset(clearFilters)">
        Reset
      </a-button>
    </div>
    <a-icon slot="filterIcon" slot-scope="filtered" type="search" :style="{ color: filtered ? '#108ee9' : undefined }" />
    <template slot="customRender" slot-scope="text, record, index, column">
      <span v-if="searchText && searchedColumn === column.dataIndex">
        <template v-for="(fragment, i) in text
          .toString()
          .split(new RegExp(`(?<=${searchText})|(?=${searchText})`, 'i'))">
          <mark v-if="fragment.toLowerCase() === searchText.toLowerCase()" :key="i" class="highlight">{{ fragment
          }}</mark>
          <template v-else>{{ fragment }}</template>
        </template>
      </span>
      <template v-else>
        {{ text }}
      </template>
    </template>
  </a-table>
</template>

<script>
const data = [
  {
    key: '1',
    name: 'John Brown',
    age: 32,
    address: 'New York No. 1 Lake Park',
  },
  {
    key: '2',
    name: 'Joe Black',
    age: 42,
    address: 'London No. 1 Lake Park',
  },
  {
    key: '3',
    name: 'Jim Green',
    age: 32,
    address: 'Sidney No. 1 Lake Park',
  },
  {
    key: '4',
    name: 'Jim Red',
    age: 32,
    address: 'London No. 2 Lake Park',
  },
];

export default {
  data() {
    return {
      data,
      searchText: '',
      searchInput: null,
      searchedColumn: '',
      columns: [
        {
          title: 'Name',
          dataIndex: 'name',
          key: 'name',
          scopedSlots: {
            filterDropdown: 'filterDropdown',
            filterIcon: 'filterIcon',
            customRender: 'customRender',
          },
          onFilter: (value, record) =>
            record.name
              .toString()
              .toLowerCase()
              .includes(value.toLowerCase()),
          onFilterDropdownVisibleChange: visible => {
            if (visible) {
              setTimeout(() => {
                this.searchInput.focus();
              }, 0);
            }
          },
        },
        {
          title: 'Age',
          dataIndex: 'age',
          key: 'age',
          scopedSlots: {
            filterDropdown: 'filterDropdown',
            filterIcon: 'filterIcon',
            customRender: 'customRender',
          },
          onFilter: (value, record) =>
            record.age
              .toString()
              .toLowerCase()
              .includes(value.toLowerCase()),
          onFilterDropdownVisibleChange: visible => {
            if (visible) {
              setTimeout(() => {
                this.searchInput.focus();
              });
            }
          },
        },
        {
          title: 'Address',
          dataIndex: 'address',
          key: 'address',
          scopedSlots: {
            filterDropdown: 'filterDropdown',
            filterIcon: 'filterIcon',
            customRender: 'customRender',
          },
          onFilter: (value, record) =>
            record.address
              .toString()
              .toLowerCase()
              .includes(value.toLowerCase()),
          onFilterDropdownVisibleChange: visible => {
            if (visible) {
              setTimeout(() => {
                this.searchInput.focus();
              });
            }
          },
        },
      ],
      draging: ''
    };
  },
  mounted() {
    this.$nextTick(() => {
      let arrTrs = document.querySelectorAll('.ant-table-row.ant-table-row-level-0');
      // console.log(arrTrs)
      Array.from(arrTrs).forEach((e) => {
        e.setAttribute('draggable', true);

        e.addEventListener('dragstart', (e) => {
          // console.log('0000',index.target.getAttribute('data-row-key'),i)
          // this.key = index.target.getAttribute('data-row-key')
          this.draging = e.target
        })

        e.addEventListener('dragenter', (e) => {
          let target = e.target.parentNode
          // console.log(this._index(this.draging),this._index(target))
          // 获取初始位置
          // var targetRect = target.getBoundingClientRect();
          // var draging = this.draging.getBoundingClientRect();

          console.log(this.draging,target)
          // if (this._index(this.draging) < this._index(target)) {
          //   // 目标比元素大，插到其后面
          //   // extSibling下一个兄弟元素
          //   target.parentNode.insertBefore(this.draging, target.nextSibling)
          // } else {
          //   // 目标比元素小，插到其前面
          //   target.parentNode.insertBefore(this.draging, target)
          // }

          // var targetAfter = target.getBoundingClientRect();
          // var dragingAfter = this.draging.getBoundingClientRect();

          // target.style.transition = 'none';
          // target.style.transform = 'translate3d(' +
          //   (targetRect.left - targetAfter.left) + 'px,' +
          //   (targetRect.top - targetAfter.top) + 'px,0)'

          // this.draging.style.transition = 'none';
          // this.draging.style.transform = 'translate3d(' +
          // (draging.left - dragingAfter.left) + 'px,' +
          // (draging.top - dragingAfter.top) + 'px,0)'

        
            
        })
      })
    })
  },
  methods: {
    _index(el) {
      var index = 0
      if (!el || !el.parentNode) {
        return -1
      }
      // previousElementSibling：上一个兄弟元素
      while (el && (el = el.previousElementSibling)) {
        index++
      }
      return index
    },
    handleSearch(selectedKeys, confirm, dataIndex) {
      confirm();
      this.searchText = selectedKeys[0];
      this.searchedColumn = dataIndex;
    },

    handleReset(clearFilters) {
      clearFilters();
      this.searchText = '';
    },
  },
};
</script>
<style scoped>
.highlight {
  background-color: rgb(255, 192, 105);
  padding: 0px;
}
</style>