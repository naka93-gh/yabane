/** 開始日が終了日以前かを検証する。どちらかが null なら常に OK */
export function validateDateRange(start: Date | null, end: Date | null): string {
  if (start && end && start > end) {
    return '開始日は終了日以前にしてください'
  }
  return ''
}

/** メールアドレスの形式を検証する。空文字は OK（任意項目向け） */
export function validateEmail(value: string): string {
  const v = value.trim()
  if (!v) return ''
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? '' : 'メールアドレスの形式が正しくありません'
}
