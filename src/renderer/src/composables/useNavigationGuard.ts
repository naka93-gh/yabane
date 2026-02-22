import { ref, readonly } from 'vue'

/** モジュールレベルの状態（全コンポーネントで共有） */
const dirty = ref(false)

/** セクション切り替え時の未保存チェックを提供する */
export function useNavigationGuard() {
  function setDirty(value: boolean): void {
    dirty.value = value
  }

  /** 移動してよいかを確認。dirty でなければ即 true */
  function confirmLeave(): boolean {
    if (!dirty.value) return true
    return window.confirm('未保存の変更があります。このまま移動しますか？')
  }

  function reset(): void {
    dirty.value = false
  }

  return { isDirty: readonly(dirty), setDirty, confirmLeave, reset }
}
