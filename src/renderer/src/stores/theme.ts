import { ref, computed, watch } from 'vue'
import { defineStore } from 'pinia'

export type ThemeMode = 'system' | 'light' | 'dark'

const STORAGE_KEY = 'yabane-theme-mode'

function loadMode(): ThemeMode {
  const v = localStorage.getItem(STORAGE_KEY)
  if (v === 'light' || v === 'dark') return v
  return 'system'
}

export const useThemeStore = defineStore('theme', () => {
  const mode = ref<ThemeMode>(loadMode())

  const mq = window.matchMedia('(prefers-color-scheme: dark)')
  const systemIsDark = ref(mq.matches)
  mq.addEventListener('change', (e) => {
    systemIsDark.value = e.matches
  })

  const isDark = computed(
    () => mode.value === 'dark' || (mode.value === 'system' && systemIsDark.value)
  )

  watch(
    isDark,
    (dark) => {
      document.documentElement.classList.toggle('dark-mode', dark)
    },
    { immediate: true }
  )

  function setMode(m: ThemeMode): void {
    mode.value = m
    localStorage.setItem(STORAGE_KEY, m)
  }

  return { mode, isDark, setMode }
})
