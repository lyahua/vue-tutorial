/**
 * 生成 idc-three 数据导入的 Excel 模板（node scripts/gen-import-templates.js）
 *
 * 表头与 room/io.js 的解析列名严格一致：
 * - 机柜布局：机柜ID / 类型 / 行 / 列 / 朝向 / U位数 / 状态
 * - 设备台账：所属机柜 / 设备ID / 名称 / 类型 / 型号 / SN / 起始U / 占用U数 / 状态
 * - 门配置：  墙 / 位置m / 宽度m / 标签
 * 解析规则：机柜布局多行 → 整房导入；单行 → 按机柜导入。
 */
const XLSX = require('xlsx');
const path = require('path');

const OUT_DIR = path.resolve(__dirname, '../src/pages/idc-three/example');

const LAYOUT_HEADER = ['机柜ID', '类型', '行', '列', '朝向', 'U位数', '状态'];
const DEVICE_HEADER = ['所属机柜', '设备ID', '名称', '类型', '型号', 'SN', '起始U', '占用U数', '状态'];
const DOOR_HEADER = ['墙', '位置m', '宽度m', '标签'];

function sheet(rows) {
    return XLSX.utils.json_to_sheet(rows);
}

// —— 整房导入模板（机柜布局 2 行 → 走整房通道；含设备与门配置） ——
const roomWb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(roomWb, sheet([
    { 机柜ID: 'T-01', 类型: 'compute', 行: 2, 列: 0, 朝向: 'S', U位数: 42, 状态: 'normal' },
    { 机柜ID: 'T-02', 类型: 'network', 行: 3, 列: 0, 朝向: 'N', U位数: 42, 状态: 'normal' },
]), '机柜布局');
XLSX.utils.book_append_sheet(roomWb, sheet([
    {
        所属机柜: 'T-01', 设备ID: 'T-01-U1', 名称: 'SERVER-DEMO', 类型: 'server',
        型号: 'R4900-G2', SN: 'SN-DEMO-001', 起始U: 1, 占用U数: 2, 状态: 'normal',
    },
]), '设备台账');
XLSX.utils.book_append_sheet(roomWb, sheet([
    { 墙: 'N', 位置m: 1.8, 宽度m: 1.2, 标签: '主入口' },
]), '门配置');
XLSX.writeFile(roomWb, path.join(OUT_DIR, '整房导入模板.xlsx'));

// —— 按机柜导入模板（机柜布局 1 行 → 走单柜通道；带一台设备） ——
const rackWb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(rackWb, sheet([
    { 机柜ID: 'IMP-01', 类型: 'compute', 行: 4, 列: 3, 朝向: 'S', U位数: 42, 状态: 'normal' },
]), '机柜布局');
XLSX.utils.book_append_sheet(rackWb, sheet([
    {
        所属机柜: 'IMP-01', 设备ID: 'IMP-01-U1', 名称: 'SERVER-IMPORT', 类型: 'server',
        型号: 'R4900-G2', SN: 'SN-IMP-001', 起始U: 1, 占用U数: 1, 状态: 'normal',
    },
]), '设备台账');
XLSX.writeFile(rackWb, path.join(OUT_DIR, '按机柜导入模板.xlsx'));

console.log('templates written to', OUT_DIR);
