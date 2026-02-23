import { useToast } from 'primevue/usetoast'

/** アプリ共通の Toast 通知 */
export function useAppToast(): {
  success: (detail: string) => void
  error: (detail: string) => void
} {
  const toast = useToast()

  function success(detail: string): void {
    toast.add({ severity: 'success', summary: '成功', detail, life: 3000 })
  }

  function error(detail: string): void {
    toast.add({ severity: 'error', summary: 'エラー', detail, life: 5000 })
  }

  return { success, error }
}
