import { type Ref, ref } from 'vue'
import { useMemberStore } from '../stores/member'

/** 担当者 AutoComplete の候補検索ロジック */
export function useOwnerSuggestions(): {
  suggestions: Ref<string[]>
  search: (event: { query: string }) => void
} {
  const memberStore = useMemberStore()
  const suggestions = ref<string[]>([])

  function search(event: { query: string }): void {
    const query = event.query.toLowerCase()
    if (!query) {
      suggestions.value = [...memberStore.memberNames]
    } else {
      suggestions.value = memberStore.memberNames.filter((name) =>
        name.toLowerCase().includes(query)
      )
    }
  }

  return { suggestions, search }
}
