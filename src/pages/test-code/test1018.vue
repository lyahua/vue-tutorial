<script>
import { testCnode } from '@/utils/api';
import { message } from 'ant-design-vue';
import moment from 'moment'

export default {
  data() {
    return {
      status: undefined,
      columns: [
        {
          title: 'author_id',
          dataIndex: 'author_id',
          key: 'author_id',
          scopedSlots: { customRender: 'author_id' },
          customCell: this.onCustomCell,
        },
        {
          title: 'create_at',
          dataIndex: 'create_at',
          key: 'create_at',
          width: 80,
        },
        {
          title: 'good',
          dataIndex: 'good',
          key: 'good',
        },
        {
          title: 'id',
          dataIndex: 'id',
          key: 'id',
        },
        {
          title: 'last_reply_at',
          dataIndex: 'last_reply_at',
          key: 'last_reply_at',
        },
        {
          title: 'reply_count',
          dataIndex: 'reply_count',
          key: 'reply_count',
          ellipsis: true,
        },
        {
          title: 'top',
          dataIndex: 'top',
          key: 'top',
          scopedSlots: { customRender: 'top' },
        },
        {
          title: 'tab',
          dataIndex: 'tab',
          key: 'tab',
          scopedSlots: { customRender: 'tab' },
        },
      ],
      data: [],
      selectedRowKeys: [],
      selectedRows: [],
      codeItems: [
        { id: 1, code: 'share', content: '分享' },
        { id: 2, code: 'ask', content: '询问' },
      ], // 数据字典
      loading: false, // 按钮loading
      tableLoading: false, // 表格loading
      form:{}
    };
  },

  methods: {
    onChange(selectedKeys, selectedRows) {
      // console.log('selectedKeys changed: ', selectedKeys);
      // console.log('selectedRows changed: ', selectedRows);
      this.selectedRowKeys = selectedKeys;
      this.selectedRows = selectedRows;

      this.selectedRows = this.selectedRows.filter(row => selectedKeys.includes(row.key));
      console.log('this.selectRows', this.selectedRows);
    },

    onSelect(record, selected, selectedRows) {
      console.log('record', record);
      console.log('selected', selected);
      console.log('selectedRows', selectedRows);
    },

    // 接口请求数据
    getData() {
      return new Promise((resovle, reject) => {
        console.log('reject', reject);
        this.loading = true;
        this.tableLoading = true;
        testCnode().then(res => {
          // console.log('res1',res)
          if (res.data.success) {
            resovle(res);
          }
        });
      });
    },

    onSearch() {
      this.getData().then(res => {
        if (res.data.success) {
          let tableData = res.data.data;
          tableData.forEach((ele, index) => {
            ele.key = tableData[index].id;
          });
          this.data = tableData;
          this.loading = false;
          this.tableLoading = false;
          message.success('请求成功');
        }
      });
    },

    // 单元格属性
    onCustomCell(record, rowIndex) {
      console.log('record', record, 'rowIndex', rowIndex);
      if (record.tab === 'share') {
        return {
          style: {
            'background-color': 'rgb(255,150,150)',
          },
        };
      }
    },

    // 插槽
    scopedSlots() {
      return {
        top: val => {
          return [<span>{val ? 'true' : 'false'}</span>];
        },

        tab: val => {
          return this.codeItems.find(x => x.code === val) ? (
            <span>{this.codeItems.find(x => x.code === val)?.content}</span>
          ) : (
            <span>{val}</span>
          );
        },
      };
    },
  },

  created() {
    this.form = this.$form.createForm(this, { name: 'form' });
    console.log('this.form.get',this.form.getFieldValue('time'))
  },

  mounted() {},

  render() {
    return (
      <div class='page'>
        <div>test1018</div>
        <div>{this.status}</div>
        <a-form form={this.form}>
          <a-form-item label='时间'>
            {this.form.getFieldDecorator('time', { initialValue: [moment().add({ day: -1 }), moment()], rules: [{ required: false }] })(
              <a-range-picker format='YYYY-MM-DD HH:mm:ss' />
            )}
          </a-form-item>
        </a-form>
        <a-button type='primary' icon='search' on-click={this.onSearch} loading={this.loading}>
          搜索
        </a-button>
        <div style='height:500px'>
          <a-table
            bordered
            scroll={{ y: 400 }}
            columns={this.columns}
            loading={this.tableLoading}
            data-source={this.data}
            row-selection={{ selectedRowKeys: this.selectedRowKeys, onChange: this.onChange }}
            scopedSlots={this.scopedSlots()}
          ></a-table>
        </div>
      </div>
    );
  },
};
</script>

<style lang="css" scoped>
/* .page{
  background: #fff;
} */
</style>