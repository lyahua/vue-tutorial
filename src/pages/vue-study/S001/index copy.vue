<template>
    <div>
        <ul>
            <li v-for="(item, index) in data" :key="item.id" v-text="item.title" :draggable="true"
                @dragstart="dragstart(index)" @dragenter="dragenter($event, index)" @dragover="dragover($event, index)"></li>
        </ul>
        <h2>标题</h2>
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
            dragindex: ''
        }
    },
    methods: {
        dragstart(index) {
            // console.log(index)
            this.dragindex = index;
        },
        dragenter(e, index) {
            e.preventDefault();
            if (this.dragindex !== index) {
                // const source = this.filteredTodos[this.dragindex];
                // this.filteredTodos.splice(this.dragindex, 1);
                // this.filteredTodos.splice(index, 0, source);
                // this.dragindex = index;

                const source=this.data[this.dragindex];
                this.data.splice(this.dragindex, 1);
                this.data.splice(index, 0, source);
                this.dragindex = index;
            }
            // console.log(event,index)
        },
        dragover(e) {
            // console.log(index) 
            e.preventDefault();
        },

    },
    created(){
       
    },
    computed: {
        filteredTodos() {
            return this.data;
        }
    }
}
</script>

<style lang="css" scoped>
*{
    padding:0;
    margin:0;
}
ul{
   display: flex; 
   width:180px;
   flex-wrap: wrap;
   flex-direction: column;

}
ul li {
    line-height: 30px;
    /* margin-bottom: 5px; */
    margin:3px;
    background: orange;
    width:50px;
    list-style-type: none;
}
</style>