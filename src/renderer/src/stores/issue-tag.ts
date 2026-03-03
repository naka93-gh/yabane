import type { IssueTag } from '@shared/types/models'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import * as repository from '../repositories/issue-tag'

export const useIssueTagStore = defineStore('issueTag', () => {
  const tags = ref<IssueTag[]>([])
  const tagMap = ref<Map<number, number[]>>(new Map())

  /** フィルタ用の選択肢 */
  const tagOptions = computed(() =>
    tags.value.map((t) => ({ label: t.name, value: t.id, color: t.color }))
  )

  /** 課題 ID からタグ一覧を返す */
  function getTagsByIssueId(issueId: number): IssueTag[] {
    const ids = tagMap.value.get(issueId) ?? []
    return ids.map((id) => tags.value.find((t) => t.id === id)).filter(Boolean) as IssueTag[]
  }

  /** タグ + マッピングを一括取得する */
  async function fetchAll(projectId: number): Promise<void> {
    const [tagList, mapList] = await Promise.all([
      repository.listIssueTags({ projectId }),
      repository.listIssueTagMap({ projectId })
    ])
    tags.value = tagList

    const m = new Map<number, number[]>()
    for (const row of mapList) {
      const arr = m.get(row.issue_id)
      if (arr) {
        arr.push(row.tag_id)
      } else {
        m.set(row.issue_id, [row.tag_id])
      }
    }
    tagMap.value = m
  }

  /** タグを追加する */
  async function addTag(args: {
    projectId: number
    name: string
    color?: string
  }): Promise<IssueTag> {
    const created = await repository.createIssueTag(args)
    tags.value.push(created)
    return created
  }

  /** タグを更新する */
  async function editTag(args: { id: number; name?: string; color?: string }): Promise<void> {
    const updated = await repository.updateIssueTag(args)
    const idx = tags.value.findIndex((t) => t.id === args.id)
    if (idx !== -1) tags.value[idx] = updated
  }

  /** タグを削除する */
  async function removeTag(id: number): Promise<void> {
    await repository.deleteIssueTag({ id })
    tags.value = tags.value.filter((t) => t.id !== id)
    // マッピングからも除去
    const m = new Map<number, number[]>()
    for (const [issueId, tagIds] of tagMap.value) {
      const filtered = tagIds.filter((tid) => tid !== id)
      if (filtered.length > 0) m.set(issueId, filtered)
    }
    tagMap.value = m
  }

  /** 課題のタグマッピングを同期する */
  async function syncIssueTags(issueId: number, tagIds: number[]): Promise<void> {
    await repository.syncIssueTagMap({ issueId, tagIds })
    if (tagIds.length > 0) {
      tagMap.value.set(issueId, [...tagIds])
    } else {
      tagMap.value.delete(issueId)
    }
    // リアクティビティのため新しい Map を代入
    tagMap.value = new Map(tagMap.value)
  }

  return {
    tags,
    tagMap,
    tagOptions,
    getTagsByIssueId,
    fetchAll,
    addTag,
    editTag,
    removeTag,
    syncIssueTags
  }
})
