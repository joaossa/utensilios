<script setup lang="ts">
defineProps<{
  title: string
}>()
</script>

<template>
  <article class="mobile-card">
    <div class="mobile-copy">
      <h2>{{ title }}</h2>
      <div class="mobile-copy-body">
        <slot />
      </div>
    </div>

    <div class="mobile-actions">
      <slot name="actions" />
    </div>
  </article>
</template>

<style scoped>
.mobile-card {
  border: 1px solid #dbe4e8;
  border-radius: 18px;
  background: #fcfefe;
  padding: 16px;
  display: grid;
  gap: 14px;
  container-type: inline-size;
}

.mobile-copy {
  display: grid;
  gap: 10px;
  min-width: 0;
}

.mobile-copy h2 {
  margin: 0;
  font-size: 1rem;
  font-weight: 800;
  line-height: 1.35;
  color: #172033;
  overflow-wrap: anywhere;
}

.mobile-copy-body {
  display: grid;
  gap: 8px;
}

.mobile-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-start;
}

:deep(.mobile-copy-line) {
  margin: 0;
  color: #536579;
  line-height: 1.55;
}

:deep(.mobile-copy-label) {
  color: #172033;
  font-weight: 700;
}

:deep(.mobile-chip-row) {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

:deep(.mobile-pill) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 28px;
  padding: 0 10px;
  border-radius: 999px;
  background: rgba(0, 138, 124, 0.08);
  color: #0f766e;
  font-size: 0.76rem;
  font-weight: 800;
  letter-spacing: 0.04em;
}

@container (max-width: 380px) {
  .mobile-card {
    padding: 14px;
  }
}
</style>
