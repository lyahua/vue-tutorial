<template>
    <div>
        <button id="button">button</button><br>
        <ul id="container"></ul>
    </div>
</template>

<script>
export default {
    created() {
        this.$nextTick(() => {
            let now=''
            document.getElementById('button').addEventListener('click', function () {
                 now = Date.now();
                // 记录任务开始时间
                // debugger
                // 插入一万条数据
                const total = 100000;
                // 获取容器
                let ul = document.getElementById('container');
                // 将数据插入容器中
                for (let i = 0; i < total; i++) {
                    let li = document.createElement('li');
                    li.innerText = ~~(Math.random() * total)
                    ul.appendChild(li);
                }
                console.log('JS运行时间：', Date.now() - now);
                setTimeout(() => {
                    console.log('总运行时间：', Date.now() - now);
                }, 0)

                // print JS运行时间： 38
                // print 总运行时间： 957 
            })
            // console.log('总运行时间：', Date.now() - now);
        })


    }
}
</script>

<style lang="css" scoped></style>