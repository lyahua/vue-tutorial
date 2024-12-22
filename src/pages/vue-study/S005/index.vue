<template>
  <div>
    <h2>文件上传</h2>
    <input type="file" @change="handleFileChange" />
    <el-button @click="handleUpload">upload</el-button>

    <YInput>
      <template v-slot:prepend>
        <span>prepend</span>
      </template>
    </YInput>
  </div>
</template>

<script>
import YInput from '@/components/y-ui/y-input/index'
// 切片大小
// the chunk size
const SIZE = 10 * 1024 * 1024; 
export default {
  components: {

            YInput
        },
  data: () => ({
    container: {
      file: null,
    },
    data: []
  }),
  methods: {
    handleFileChange(e) {
      const [file] = e.target.files;
      if (!file) return;
      Object.assign(this.$data, this.$options.data());
      this.container.file = file;
    },


    // 生成文件切片
    createFileChunk(file, size = SIZE) {
      const fileChunkList = [];
      let cur = 0;
      while (cur < file.size) {
        fileChunkList.push({ file: file.slice(cur, cur + size) });
        cur += size;
      }
      return fileChunkList;
    },
    // 上传切片
    async uploadChunks() {
      const requestList = this.data
        .map(({ chunk, hash }) => {
          const formData = new FormData();
          formData.append("chunk", chunk);
          formData.append("hash", hash);
          formData.append("filename", this.container.file.name);
          return { formData };
        })
        .map(({ formData }) =>
          this.request({
            url: "http://localhost:3000",
            data: formData,
          })
        );
      // 并发请求
      await Promise.all(requestList);
    },

    async handleUpload() {
      if (!this.container.file) return;
      const fileChunkList = this.createFileChunk(this.container.file);
      this.data = fileChunkList.map(({ file }, index) => ({
        chunk: file,
        // 文件名 + 数组下标
        hash: this.container.file.name + "-" + index,
      }));
      await this.uploadChunks();
    },

    request({ url, method = "post", data, headers = {} }) {
      return new Promise((resolve) => {
        const xhr = new XMLHttpRequest();
        xhr.open(method, url);
        Object.keys(headers).forEach((key) =>
          xhr.setRequestHeader(key, headers[key])
        );
        xhr.send(data);
        xhr.onload = (e) => {
          resolve({
            data: e.target.response,
          });
        };
      });
    },
  },
};
</script>
