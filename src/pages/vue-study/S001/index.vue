<template>
    <div>
        <table border width="200">
            <tr>
                <td>1</td>
                <td>2</td>
                <td>3</td>
            </tr>
        </table>
        <ul @dragstart="dragstart" @dragenter="dragenter($event)" @dragover="dragover">
            <li v-for="(item) in data" :key="item.id" v-text="item.title" :draggable="true">
            </li>
        </ul>
        <h2>标题</h2>

        <table border>
            <tr>
                <td>1</td>
                <td>2</td>
                <td>3</td>
            </tr>
        </table>

        <hr/>

        <form @submit="submit">
            <label>name</label><input v-model="inputV" />
            <label>age</label><input v-model="inputV2" />
            <button type="submit">提交</button>
        </form>
        <hr/>
        <div class="bbbtest">1111</div>
        <hr/>
        <div class="page"></div>
    </div>
</template>

<script>
export default {
    data() {
        return {
            data: [
                {
                    id: 1,
                    title: '1',
                },
                {
                    id: 2,
                    title: '2',
                },
                {
                    id: 3,
                    title: '3',
                },
                {
                    id: 4,
                    title: '4',
                },
                {
                    id: 5,
                    title: '5',
                },
                {
                    id: 6,
                    title: '6',
                }
            ],
            drag: '',
            inputV:'',
            inputV2:''
        }
    },
    methods: {
        dragstart(e) {
            // console.log(e.target)
            this.drag = e.target;
        },
        dragenter() {
            // console.log(e.target,'---')
            // e.preventDefault();
            // if (this.dragindex !== index) {
            //     // const source = this.filteredTodos[this.dragindex];
            //     // this.filteredTodos.splice(this.dragindex, 1);
            //     // this.filteredTodos.splice(index, 0, source);
            //     // this.dragindex = index;

            //     const source=this.data[this.dragindex];
            //     this.data.splice(this.dragindex, 1);
            //     this.data.splice(index, 0, source);
            //     this.dragindex = index;
            // }
            // console.log(event,index)
        },
        dragover(e) {
            // console.log(e.target,'+++') 
            e.preventDefault();
            let target = e.target;
            if (target.nodeName === 'LI' && target !== this.drag) {
                // 获取初始位置
                let targetRect = target.getBoundingClientRect();
                // let dragingRect=this.drag.getBoundingClientRect();

                if (target) {
                    // 判断是否动画元素
                    if (target.animated) {
                        return;
                    }
                }
                // console.log(this.getIndex(target),'00')
                // 目标比元素小，插到目标元素前面
                if (this.getIndex(this.drag) > this.getIndex(target)) {
                    target.parentNode.insertBefore(this.drag, target);
                } else {
                    // 比目标元素大，插到其后面
                    target.parentNode.insertBefore(this.drag, target.nextSibling);
                }

                var targetAfter = target.getBoundingClientRect();

                target.style.transition = 'none';
                target.style.transform = 'translate3d(' +
                    (targetRect.left - targetAfter.left) + 'px,' +
                    (targetRect.top - targetAfter.top) + 'px,0)'

                target.offsetWidth; //触发重绘
                target.style.transition = 'all 300ms';
                target.style.transform = 'translate3d(0,0,0)';

                clearTimeout(target.animated);
                target.animated = setTimeout(function () {
                    target.style.transition = '';
                    target.style.transform = '';
                    target.animated = false;
                    //draging同理
                }, 200);
            }
        },
        getIndex(el) {
            let index = 0;
            if (!el || !el.parentNode) {
                return -1
            }
            while (el && (el = el.previousElementSibling)) {
                index++;
            }
            return index;
        },
        submit(e){
            e.preventDefault()
            console.log('e',e)
        }

    },
    created() {

    },
    computed: {
        filteredTodos() {
            return this.data;
        }
    }
}
</script>

<style  src="./index.css"></style>
<style lang="css" scoped>
* {
    padding: 0;
    margin: 0;
}


ul {
    display: flex;
    width: 180px;
    flex-wrap: wrap;
    flex-direction: column;
    margin: 200px;
}

ul li {
    line-height: 30px;
    /* margin-bottom: 5px; */
    margin: 3px;
    background: orange;
    width: 50px;
    list-style-type: none;
}
</style>