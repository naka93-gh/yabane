import type { Member } from '@shared/types/models'
import type { MemberCreateArgs } from '@shared/types/ipc'

const HEADERS = ['組織', '名前', '役割', 'メール', '備考']

/** RFC 4180 準拠でフィールドをエスケープする */
function escapeField(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

/** Member 配列から CSV 文字列を生成する（BOM 付き UTF-8） */
export function buildMemberCsv(members: Member[]): string {
  const header = HEADERS.join(',')
  const rows = members.map((m) =>
    [m.organization ?? '', m.name, m.role ?? '', m.email ?? '', m.note ?? '']
      .map(escapeField)
      .join(',')
  )
  return '\uFEFF' + [header, ...rows].join('\r\n') + '\r\n'
}

/** RFC 4180 準拠で CSV 行をフィールドに分割する */
function parseRow(line: string): string[] {
  const fields: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        current += ch
      }
    } else {
      if (ch === '"') {
        inQuotes = true
      } else if (ch === ',') {
        fields.push(current)
        current = ''
      } else {
        current += ch
      }
    }
  }
  fields.push(current)
  return fields
}

/** CSV 文字列をパースして MemberCreateArgs 配列を返す */
export function parseMemberCsv(csv: string, projectId: number): MemberCreateArgs[] {
  // BOM 除去
  const text = csv.replace(/^\uFEFF/, '')
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== '')

  // ヘッダ行をスキップ
  if (lines.length <= 1) return []

  return lines.slice(1).map((line) => {
    const [organization, name, role, email, note] = parseRow(line)
    return {
      projectId,
      name: name || '',
      ...(organization ? { organization } : {}),
      ...(role ? { role } : {}),
      ...(email ? { email } : {}),
      ...(note ? { note } : {})
    }
  })
}
