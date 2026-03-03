<script setup lang="ts">
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import { ref } from 'vue'
import { useAppToast } from '../../composables/useAppToast'
import { useIssueTagStore } from '../../stores/issue-tag'
import { useProjectStore } from '../../stores/project'
import { PRESET_COLORS } from '../../utils/constants'

const projectStore = useProjectStore()
const tagStore = useIssueTagStore()
const toast = useAppToast()

const dialogVisible = ref(false)
const expandedColorId = ref<number | null>(null)
const editingNameId = ref<number | null>(null)
const editingNameValue = ref('')

function open(): void {
  dialogVisible.value = true
  expandedColorId.value = null
  editingNameId.value = null
}

function toggleColorPicker(tagId: number): void {
  expandedColorId.value = expandedColorId.value === tagId ? null : tagId
}

async function selectColor(tagId: number, color: string): Promise<void> {
  try {
    await tagStore.editTag({ id: tagId, color })
    expandedColorId.value = null
  } catch {
    toast.error('色の変更に失敗しました')
  }
}

function startEditName(tagId: number, currentName: string): void {
  editingNameId.value = tagId
  editingNameValue.value = currentName
}

async function saveName(tagId: number): Promise<void> {
  const name = editingNameValue.value.trim()
  if (!name) {
    editingNameId.value = null
    return
  }
  try {
    await tagStore.editTag({ id: tagId, name })
  } catch {
    toast.error('名前の変更に失敗しました')
  }
  editingNameId.value = null
}

async function addTag(): Promise<void> {
  const projectId = projectStore.currentProject?.id
  if (!projectId) return
  try {
    const tag = await tagStore.addTag({ projectId, name: '新しいタグ' })
    startEditName(tag.id, tag.name)
  } catch {
    toast.error('タグの追加に失敗しました')
  }
}

async function removeTag(id: number): Promise<void> {
  try {
    await tagStore.removeTag(id)
    toast.success('削除しました')
  } catch {
    toast.error('削除に失敗しました')
  }
}

defineExpose({ open })
</script>

<template>
  <Dialog
    v-model:visible="dialogVisible"
    header="タグ管理"
    :modal="true"
    :style="{ width: '480px' }"
  >
    <div class="tag-manage-list">
      <div v-if="tagStore.tags.length === 0" class="empty-state">
        タグはまだありません
      </div>
      <div v-for="tag in tagStore.tags" :key="tag.id" class="tag-row">
        <button
          class="color-swatch"
          :style="{ backgroundColor: tag.color }"
          @click="toggleColorPicker(tag.id)"
        />
        <div class="tag-name">
          <InputText
            v-if="editingNameId === tag.id"
            v-model="editingNameValue"
            class="name-input"
            size="small"
            autofocus
            @blur="saveName(tag.id)"
            @keydown.enter="($event.target as HTMLInputElement)?.blur()"
          />
          <span
            v-else
            class="name-text"
            @dblclick="startEditName(tag.id, tag.name)"
          >
            {{ tag.name }}
          </span>
        </div>
        <Button
          icon="pi pi-trash"
          text
          rounded
          size="small"
          severity="danger"
          @click="removeTag(tag.id)"
        />
        <!-- カラーピッカー展開 -->
        <div v-if="expandedColorId === tag.id" class="color-picker">
          <button
            v-for="c in PRESET_COLORS"
            :key="c.name"
            class="color-picker-swatch"
            :class="{ selected: tag.color === c.value }"
            :style="{ backgroundColor: c.value }"
            :title="c.name"
            @click="selectColor(tag.id, c.value)"
          />
        </div>
      </div>
    </div>
    <template #footer>
      <Button label="タグを追加" icon="pi pi-plus" text @click="addTag" />
    </template>
  </Dialog>
</template>

<style scoped>
.tag-manage-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.empty-state {
  color: var(--p-text-muted-color);
  text-align: center;
  padding: 24px 0;
  font-size: 0.85rem;
}

.tag-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
  flex-wrap: wrap;
}

.color-swatch {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
  flex-shrink: 0;
  transition: opacity 0.15s;
}

.color-swatch:hover {
  opacity: 0.8;
}

.tag-name {
  flex: 1;
  min-width: 0;
}

.name-text {
  font-size: 0.85rem;
  cursor: default;
  user-select: none;
}

.name-input {
  width: 100%;
}

.color-picker {
  width: 100%;
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  padding: 6px 0 2px 32px;
}

.color-picker-swatch {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
  transition: border-color 0.15s;
}

.color-picker-swatch:hover {
  opacity: 0.8;
}

.color-picker-swatch.selected {
  border-color: var(--p-text-color);
  box-shadow:
    0 0 0 2px var(--p-content-background),
    0 0 0 4px var(--p-text-muted-color);
}
</style>
