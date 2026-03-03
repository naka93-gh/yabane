<script setup lang="ts">
import type { Issue, IssueComment } from '@shared/types/models'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Textarea from 'primevue/textarea'
import { ref } from 'vue'
import { useAppToast } from '../../composables/useAppToast'
import {
  createIssueComment,
  deleteIssueComment,
  listIssueComments
} from '../../repositories/issue-comment'

const toast = useAppToast()

const dialogVisible = ref(false)
const currentIssue = ref<Issue | null>(null)
const comments = ref<IssueComment[]>([])
const newBody = ref('')
const loading = ref(false)

async function open(issue: Issue): Promise<void> {
  currentIssue.value = issue
  newBody.value = ''
  dialogVisible.value = true
  await fetchComments()
}

async function fetchComments(): Promise<void> {
  if (!currentIssue.value) return
  loading.value = true
  try {
    comments.value = await listIssueComments({ issueId: currentIssue.value.id })
  } finally {
    loading.value = false
  }
}

async function submit(): Promise<void> {
  if (!currentIssue.value || !newBody.value.trim()) return
  try {
    await createIssueComment({ issueId: currentIssue.value.id, body: newBody.value.trim() })
    newBody.value = ''
    await fetchComments()
  } catch {
    toast.error('コメントの追加に失敗しました')
  }
}

async function remove(id: number): Promise<void> {
  try {
    await deleteIssueComment({ id })
    await fetchComments()
  } catch {
    toast.error('コメントの削除に失敗しました')
  }
}

function onKeydown(e: KeyboardEvent): void {
  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
    e.preventDefault()
    submit()
  }
}

function formatDateTime(dt: string): string {
  const d = new Date(`${dt}Z`)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const h = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${y}/${m}/${day} ${h}:${min}`
}

defineExpose({ open })
</script>

<template>
  <Dialog
    v-model:visible="dialogVisible"
    :header="`コメント - #${currentIssue?.issue_number} ${currentIssue?.title ?? ''}`"
    :modal="true"
    :style="{ width: '560px' }"
  >
    <!-- 入力エリア -->
    <div class="comment-input">
      <Textarea
        v-model="newBody"
        placeholder="コメントを入力（Ctrl+Enter で送信）"
        rows="3"
        class="w-full"
        @keydown="onKeydown"
      />
      <div class="comment-input-actions">
        <Button
          label="送信"
          icon="pi pi-send"
          size="small"
          :disabled="!newBody.trim()"
          @click="submit"
        />
      </div>
    </div>

    <!-- タイムライン -->
    <div class="timeline">
      <div v-if="comments.length === 0 && !loading" class="timeline-empty">
        コメントはありません
      </div>
      <div v-for="(comment, idx) in comments" :key="comment.id" class="timeline-item">
        <div class="timeline-rail">
          <span class="timeline-dot" />
          <span v-if="idx < comments.length - 1" class="timeline-line" />
        </div>
        <div class="timeline-content">
          <div class="timeline-header">
            <span class="timeline-date">{{ formatDateTime(comment.created_at) }}</span>
            <Button
              icon="pi pi-trash"
              text
              rounded
              size="small"
              severity="danger"
              @click="remove(comment.id)"
            />
          </div>
          <div class="timeline-body">{{ comment.body }}</div>
        </div>
      </div>
    </div>
  </Dialog>
</template>

<style scoped>
.comment-input {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.comment-input-actions {
  display: flex;
  justify-content: flex-end;
}

.w-full {
  width: 100%;
}

/* === タイムライン === */
.timeline {
  max-height: 400px;
  overflow-y: auto;
}

.timeline-empty {
  color: var(--p-text-muted-color);
  text-align: center;
  padding: 24px 0;
  font-size: 0.85rem;
}

.timeline-item {
  display: flex;
  gap: 12px;
}

/* 左側レール（ドット＋破線） */
.timeline-rail {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 16px;
  flex-shrink: 0;
  padding-top: 6px;
}

.timeline-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--p-primary-color);
  flex-shrink: 0;
}

.timeline-line {
  flex: 1;
  width: 0;
  border-left: 2px dashed var(--p-content-border-color);
  margin-top: 4px;
}

/* 右側コンテンツ */
.timeline-content {
  flex: 1;
  min-width: 0;
  padding-bottom: 16px;
}

.timeline-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}

.timeline-date {
  font-size: 0.75rem;
  color: var(--p-text-muted-color);
  font-variant-numeric: tabular-nums;
}

.timeline-header :deep(.p-button) {
  width: 24px;
  height: 24px;
}

.timeline-body {
  font-size: 0.85rem;
  white-space: pre-wrap;
  line-height: 1.6;
  padding: 8px 12px;
  background: var(--p-content-hover-background);
  border: 1px solid var(--p-content-border-color);
  border-radius: 8px;
}
</style>
