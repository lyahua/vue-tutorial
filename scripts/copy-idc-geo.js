/* eslint-env node */
/**
 * 一次性脚本：把机房地图需要的 GeoJSON 拷进 public/geo
 *
 * 用法：node ./scripts/copy-idc-geo.js <源项目 public/geo 目录>
 * 例：node ./scripts/copy-idc-geo.js e:/javaFile/vue-project/public/geo
 */
const fs = require('fs');
const path = require('path');

const SRC = process.argv[2];
if (!SRC) {
    console.error('用法：node ./scripts/copy-idc-geo.js <源 geo 目录>');
    process.exit(1);
}

const DEST = path.resolve(__dirname, '../public/geo');
const NEEDED = ['100000', '110000', '120000', '310000', '330100', '440400', '510100', '610100'];

fs.mkdirSync(DEST, { recursive: true });
NEEDED.forEach(adcode => {
    const name = `${adcode}_full.json`;
    const from = path.join(SRC, name);
    if (!fs.existsSync(from)) {
        console.error(`跳过（源文件不存在）：${from}`);
        return;
    }
    fs.copyFileSync(from, path.join(DEST, name));
    console.log(`已拷贝 ${name} ${fs.statSync(path.join(DEST, name)).size} bytes`);
});
