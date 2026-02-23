<script setup lang="ts">
import { ref, watch } from 'vue'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import type { Member } from '@shared/types/models'
import { useMemberStore } from '../../stores/member'
import { useAppToast } from '../../composables/useAppToast'

const visible = defineModel<boolean>('visible', { default: false })

const props = defineProps<{ member: Member | null }>()

const store = useMemberStore()
const toast = useAppToast()

const form = ref({ name: '', role: '', organization: '', email: '', note: '' })

watch(
  () => props.member,
  (m) => {
    if (m) {
      form.value = {
        name: m.name,
        role: m.role ?? '',
        organization: m.organization ?? '',
        email: m.email ?? '',
        note: m.note ?? ''
      }
    }
  }
)

/** フォームの内容でメンバーを更新しダイアログを閉じる */
async function handleSave(): Promise<void> {
  if (!props.member || !form.value.name.trim()) return
  try {
    await store.editMember({
      id: props.member.id,
      name: form.value.name.trim(),
      role: form.value.role || undefined,
      organization: form.value.organization || undefined,
      email: form.value.email || undefined,
      note: form.value.note || undefined
    })
    visible.value = false
    toast.success('メンバーを更新しました')
  } catch {
    toast.error('メンバーの更新に失敗しました')
  }
}
</script>

<template>
  <Dialog
    v-model:visible="visible"
    header="メンバーを編集"
    :modal="true"
    :style="{ width: '440px' }"
  >
    <div class="edit-form">
      <div class="field">
        <label>名前</label>
        <InputText v-model="form.name" class="w-full" />
      </div>
      <div class="field">
        <label>役割</label>
        <InputText v-model="form.role" placeholder="役割（任意）" class="w-full" />
      </div>
      <div class="field">
        <label>組織</label>
        <InputText v-model="form.organization" placeholder="組織（任意）" class="w-full" />
      </div>
      <div class="field">
        <label>メール</label>
        <InputText v-model="form.email" placeholder="メール（任意）" class="w-full" />
      </div>
      <div class="field">
        <label>備考</label>
        <Textarea v-model="form.note" placeholder="備考（任意）" rows="2" class="w-full" />
      </div>
    </div>
    <template #footer>
      <Button label="キャンセル" text @click="visible = false" />
      <Button label="保存" icon="pi pi-check" :disabled="!form.name.trim()" @click="handleSave" />
    </template>
  </Dialog>
</template>

<style scoped>
.edit-form .field {
  margin-bottom: 14px;
}

.edit-form .field label {
  display: block;
  font-weight: 600;
  margin-bottom: 6px;
  font-size: 0.85rem;
}

.w-full {
  width: 100%;
}
</style>
