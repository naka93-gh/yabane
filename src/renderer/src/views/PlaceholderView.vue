<script setup lang="ts">
defineProps<{
  sectionName: string
}>()
</script>

<template>
  <div class="placeholder">
    <i class="pi pi-wrench placeholder-icon" />
    <p class="placeholder-text">「{{ sectionName }}」セクションは未実装です</p>
  </div>
</template>

<style scoped>
.placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--p-text-muted-color);
}

.placeholder-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.placeholder-text {
  font-size: 16px;
}
</style>
