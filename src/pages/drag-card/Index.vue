<template>
    <div>
        <!-- 拖拽卡片实现 -->
        <div :style="{
            position: 'relative',
            height: computeTop(listData.length) + cardOutsideHeight + 'px',
            width: cardOutsideWidth * colNum + 'px'
        }">
            <!-- computeTop()方法是上面计算卡片top的方法 -->

            <!-- 卡片代码 -->
            <div class="cardBorderBox" v-for="item in listData" :key="item.id" :id="item.id"
                :style="{ width: cardOutsideWidth + 'px', height: cardOutsideHeight + 'px' }">
                <!-- 里面的div用于显示卡片本身的内容 -->
                <div class="cardInsideBox">
                    <div @mousedown="touchStart($event, item.id)" class="topWrapBox">
                        <!-- 标题栏 -->
                        {{ item.name }}
                    </div>

                    <div class="emptyContent">
                        <!--内容部分 -->
                        卡片暂无内容
                    </div>

                </div>
            </div>
        </div>



    </div>
</template>

<script>
export default {
    data() {
        return {
            listData: [
                {
                    positionNum: 1, // 位置号码，卡片的位置根据这个计算生成
                    name: '演示卡片1', // 卡片标题
                    id: 'card1', // 用于辨识卡片id
                },
                {
                    positionNum: 2, // 位置号码，卡片的位置根据这个计算生成
                    name: '演示卡片2', // 卡片标题
                    id: 'card2', // 用于辨识卡片id
                }
            ],
            colNum: 2, // 一行有多少列
            cardOutsideWidth: 200,// 单个卡片的外范围宽度
            cardOutsideHeight: 150, // 单个卡片的外范围高度
            cardInsideWidth: 560, // 单个卡片的内容宽度
            cardInsideHeight: 320, // 单个卡片的内容高度

            mousedownTimer: null, // 用于记录卡片当前是否在过渡状态中的定时器
        }
    },
    computed: {



    },
    methods: {
        //整体就是按列数的限定，从左往右一行一行地排列数据
        computeLeft(num) {
            //left为（位置号码-1)%列数*卡片外围宽度
            return (num - 1) % this.colNum * this.cardOutsideWidth;
        },
        computeTop(num) {
            //top为（位置号码/列数）向上取整，减去1，再乘以卡片外围高度
            return (Math.ceil(num / this.colNum) - 1) * this.cardOutsideHeight;
        },
        addCardStyle() {
            this.$nextTick(() => {
                this.listData.forEach(item => {
                    document.querySelector('#' + item.id).style.top = this.computeTop(item.positionNum) + 'px'
                    document.querySelector('#' + item.id).style.left = this.computeLeft(item.positionNum) + 'px'
                })
            })
        },
        touchStart(e, id) {
            // 选中的卡片DOM和数据
            let selectDom = document.querySelector(`#${id}`);
            console.log('selectDom',selectDom.style.left)
            // let selectMenuData = this.listData.find(x => x.id == id)

            // 获取屏幕滚动条位置
            let originTop = document.body.scrollTop === 0 ? document.documentElement.scrollTop : document.body.scrollTop;
            let scorllTop = originTop;

            //记录卡片的top和left
            let moveTop;
            let moveLeft;

            //记录起始选中位置
            let OriginObjPosition = {
                left: 0,
                top: 0,
                originNum: -1
            };

            //起始鼠标信息
            let OriginMousePosition = {
                x: 0,
                y: 0
            };

            //记录交换位置的号码
            // let OldPositon = null;
            // let NewPositon = null;

            //1.保存点击的起始鼠标位置
            OriginMousePosition.x = e.screenX;
            OriginMousePosition.y = e.screenY;

            //2.给选中卡片一个transition：none的class，去除默认过渡
            selectDom.classList.add('moveBox');

            //3.保存现在卡片的top和left
            moveLeft = OriginObjPosition.left = parseInt(
                //这里获取到的left是带单位的字符串，要转换成纯数字
                selectDom.style.left.slice(0, selectDom.style.left.length - 2)
            );
            moveTop = OriginObjPosition.top = parseInt(
                selectDom.style.top.slice(0, selectDom.style.top.length - 2)
            );

            //4.添加其他鼠标事件
            document.addEventListener("mousemove", mouseMoveListener);

            function mouseMoveListener(e) {
                //在原来的top和left基础上，加上鼠标的偏移量
                moveTop = OriginObjPosition.top + (e.screenY - OriginMousePosition.y);
                moveLeft = OriginObjPosition.left + (e.screenX - OriginMousePosition.x);

                document.querySelector(".moveBox").style.left = moveLeft + "px";
                document.querySelector(".moveBox").style.top = moveTop + (scorllTop - originTop) + "px";  //这里要加上滚动的高度
            }

        }
    },
    watch: {
        listData: {
            handler: function () {
                this.addCardStyle()
            },
            immediate: true
        }
    }


}
</script>

<style lang="css" scoped>
.cardBorderBox {
    user-select: none;
    position: absolute;
    transition: all 0.3s;
    display: flex;
    justify-content: center;
    align-items: center;
}

.cardInsideBox {
    width: 100%;
    border-radius: 5px;
    box-shadow: 0 0 5px #cacaca;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.topWrapBox {
    cursor: move;
    border-bottom: 1px solid #e0e0e0;
}

/* 移动动画 */
.moveBox {
    top: 20px;
    left: 20px;
    z-index: 300;
    transition: none;
}
</style>