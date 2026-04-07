<script setup lang="ts">
const searchTerm = defineModel<string>('searchTerm', { default: '' })

withDefaults(
  defineProps<{
    title: string
    total: number
    searchAriaLabel: string
    searchPlaceholder: string
    layout?: 'compact' | 'wide'
  }>(),
  {
    layout: 'compact',
  },
)
</script>

<template>
  <main class="crud-list-page">
    <section class="crud-list-shell">
      <header :class="['crud-list-header', `crud-list-header--${layout}`]">
        <div class="crud-list-header-copy">
          <h1 class="crud-list-title">{{ title }}</h1>
          <p class="crud-list-total">(Total: {{ total }})</p>
        </div>

        <label class="crud-list-search" :aria-label="searchAriaLabel">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M10.5 4a6.5 6.5 0 1 1 0 13 6.5 6.5 0 0 1 0-13Zm0 2a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9Zm8.9 11.5 1.4 1.4-2 2-1.4-1.4-2.8-2.8 2-2 2.8 2.8Z"
            />
          </svg>
          <input v-model="searchTerm" type="text" :placeholder="searchPlaceholder" />
        </label>

        <div class="crud-list-header-actions">
          <slot name="actions" />
        </div>
      </header>

      <section :class="['crud-list-panel', `crud-list-panel--${layout}`]">
        <slot name="status" />
        <slot />
      </section>
    </section>
  </main>
</template>

<style scoped>
.crud-list-page {
  min-height: 100vh;
  background:
    radial-gradient(circle at top left, rgba(0, 138, 124, 0.12), transparent 34%),
    linear-gradient(180deg, #f3f7f7 0%, #edf3f4 100%);
  padding: clamp(16px, 3vw, 28px);
  box-sizing: border-box;
}

.crud-list-shell {
  width: min(100%, 1180px);
  margin: 0 auto;
  display: grid;
  gap: 18px;
  container-type: inline-size;
}

.crud-list-header,
.crud-list-panel {
  background: rgba(255, 255, 255, 0.94);
  border: 1px solid rgba(219, 228, 232, 0.95);
  border-radius: 24px;
  box-shadow: 0 14px 30px rgba(15, 35, 33, 0.07);
}

.crud-list-header {
  box-sizing: border-box;
  padding: clamp(18px, 2.8vw, 28px);
  display: grid;
  grid-template-columns: 1fr;
  gap: 14px;
  align-items: stretch;
}

.crud-list-header--compact,
.crud-list-panel--compact {
  width: min(100%, 560px);
  justify-self: center;
}

.crud-list-header--wide,
.crud-list-panel--wide {
  width: min(100%, 1040px);
  justify-self: center;
}

.crud-list-header-copy {
  display: flex;
  align-items: baseline;
  gap: 12px;
  flex-wrap: wrap;
  min-width: 0;
}

.crud-list-title {
  margin: 0;
  color: #172033;
  font-size: clamp(1.35rem, 1rem + 0.9vw, 1.85rem);
  font-weight: 800;
  line-height: 1.2;
}

.crud-list-total {
  margin: 0;
  color: #536579;
  line-height: 1.6;
}

.crud-list-search {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 48px;
  padding: 0 16px;
  border-radius: 999px;
  border: 1px solid #c8d5d9;
  background: #fff;
}

.crud-list-search svg {
  width: 18px;
  height: 18px;
  fill: #536579;
  flex: 0 0 auto;
}

.crud-list-search input {
  width: 100%;
  min-width: 0;
  border: 0;
  outline: 0;
  background: transparent;
  color: #172033;
  font: inherit;
}

.crud-list-header-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.crud-list-panel {
  box-sizing: border-box;
  padding: 20px;
  display: grid;
  gap: 14px;
}

:deep(.feedback.error) {
  margin: 0;
  padding: 12px 14px;
  border-radius: 14px;
  font-weight: 700;
  background: #fef2f2;
  color: #b91c1c;
  border: 1px solid #fecaca;
}

:deep(.header-action-primary) {
  min-height: 44px;
  border-radius: 999px;
  padding: 0 18px;
  background: linear-gradient(135deg, #008a7c 0%, #0f766e 100%);
  color: #fff;
  font-weight: 700;
  box-shadow: 0 10px 22px rgba(15, 35, 33, 0.08);
}

:deep(.module-exit-icon) {
  width: 44px;
  min-width: 44px;
  min-height: 44px;
  padding: 0;
  color: #0f766e;
  border-radius: 999px;
  border-color: rgba(15, 118, 110, 0.18);
  box-shadow: 0 6px 18px rgba(15, 35, 33, 0.06);
}

:deep(.crud-list-table) {
  border-radius: 20px;
  overflow: hidden;
}

:deep(.crud-list-table .q-table__top),
:deep(.crud-list-table .q-table__bottom) {
  display: none;
}

:deep(.crud-list-table .q-table thead tr) {
  background: #f5fbfb;
}

:deep(.crud-list-table .q-table th) {
  font-size: 0.62rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #0f766e;
}

:deep(.crud-list-table .q-table th),
:deep(.crud-list-table .q-table td) {
  padding: 10px 12px;
  font-size: 0.8rem;
}

:deep(.crud-list-table .q-table tbody tr:nth-child(even)) {
  background: #fcfefe;
}

:deep(.row-actions),
:deep(.mobile-actions) {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

:deep(.action-icon) {
  width: 40px;
  height: 40px;
  min-width: 40px;
  border-radius: 12px;
}

:deep(.action-icon .q-icon) {
  font-size: 1.1rem;
}

:deep(.crud-list-no-data) {
  margin: 0;
  padding: 18px 10px;
  color: #536579;
  line-height: 1.6;
}

@container (max-width: 920px) {
  .crud-list-header-actions {
    width: 100%;
  }
}

@container (max-width: 720px) {
  .crud-list-panel {
    padding: 16px;
  }

  .crud-list-header-actions {
    justify-content: flex-start;
  }

  :deep(.header-action-primary) {
    flex: 1 1 auto;
  }

  :deep(.module-exit-icon) {
    width: 44px;
  }
}
</style>
