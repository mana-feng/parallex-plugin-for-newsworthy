import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import './styles/newsworthy-theme.css'

const app = createApp(App)

// Error handler
app.config.errorHandler = (err, instance, info) => {
  console.error('Vue Error:', err)
  console.error('Component:', instance)
  console.error('Info:', info)
}

app.use(createPinia())

try {
  app.mount('#app')
} catch (err) {
  console.error('Failed to mount app:', err)
}
