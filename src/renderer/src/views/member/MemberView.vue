<script setup lang="ts">
import MemberPanel from '../../components/MemberPanel.vue'
</script>

<template>
  <div class="member-view">
    <h2>関係者</h2>
    <MemberPanel />
  </div>
</template>

<style scoped>
.member-view {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.member-view h2 {
  margin: 0 0 12px;
}
</style>
