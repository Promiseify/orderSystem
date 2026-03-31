import { createApp } from 'vue'
import App from '@/App.vue'
import router from '@/router'
import { pinia } from '@/stores'
import { useAuthStore } from '@/stores/auth'
import '@/assets/main.css'

const app = createApp(App)

app.use(pinia)
app.use(router)

const authStore = useAuthStore(pinia)
void authStore.bootstrap()

app.mount('#app')
