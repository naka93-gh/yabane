import './assets/main.css'
import 'primeicons/primeicons.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'
import ConfirmationService from 'primevue/confirmationservice'
import ToastService from 'primevue/toastservice'
import { definePreset } from '@primeuix/themes'
import Aura from '@primeuix/themes/aura'
import App from './App.vue'
import { useThemeStore } from './stores/theme'

const HanadaPreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: '#f0f7fa',
      100: '#d6ecf3',
      200: '#b0d9e8',
      300: '#7abfd6',
      400: '#46a1bf',
      500: '#2a7b9b',
      600: '#236484',
      700: '#1e516d',
      800: '#1b445b',
      900: '#173a4d',
      950: '#0d2534'
    }
  }
})

const app = createApp(App)

app.use(createPinia())
app.use(PrimeVue, {
  theme: {
    preset: HanadaPreset,
    options: {
      darkModeSelector: '.dark-mode'
    }
  }
})
app.use(ConfirmationService)
app.use(ToastService)

useThemeStore()

app.mount('#app')
