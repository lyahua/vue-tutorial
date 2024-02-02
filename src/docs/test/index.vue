
    <template>
      <div></div>
    </template>

    <script setup>
    import { onMounted } from 'vue'

    const handleData = () => {
      console.log('handle data!')
    }

    onMounted(() => {
      handleData()
    })

    </script>

    <style scoped>
    </style>
    