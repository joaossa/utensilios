<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    title: string
    confirmLabel?: string
    cancelLabel?: string
    confirmTone?: 'default' | 'danger'
    busy?: boolean
  }>(),
  {
    confirmLabel: 'Confirmar',
    cancelLabel: 'Cancelar',
    confirmTone: 'default',
    busy: false,
  },
)

const emit = defineEmits<{
  close: []
  confirm: []
}>()

const titleId = `crud-dialog-${Math.random().toString(36).slice(2, 10)}`

function handleClose() {
  emit('close')
}

function handleConfirm() {
  emit('confirm')
}
</script>

<template>
  <div class="modal-backdrop" @click.self="handleClose">
    <section class="modal-card" role="dialog" aria-modal="true" :aria-labelledby="titleId">
      <div class="modal-copy">
        <h2 :id="titleId">{{ props.title }}</h2>
        <slot />
      </div>

      <div class="modal-actions">
        <button
          type="button"
          :class="[
            'icon-button',
            'modal-icon',
            props.confirmTone === 'danger' ? 'icon-button-danger' : 'icon-button-default',
          ]"
          :title="props.confirmLabel"
          :aria-label="props.confirmLabel"
          :disabled="props.busy"
          @click="handleConfirm"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M9.55 18.2 4.8 13.45l1.4-1.4 3.35 3.35 8.25-8.25 1.4 1.4-9.65 9.65Z" />
          </svg>
        </button>
        <button
          type="button"
          class="icon-button modal-icon"
          :title="props.cancelLabel"
          :aria-label="props.cancelLabel"
          @click="handleClose"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="m12 10.6 4.95-4.95 1.4 1.4L13.4 12l4.95 4.95-1.4 1.4L12 13.4l-4.95 4.95-1.4-1.4L10.6 12 5.65 7.05l1.4-1.4L12 10.6Z" />
          </svg>
        </button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.34);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  z-index: 20;
}

.modal-card {
  width: min(100%, 420px);
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid rgba(219, 228, 232, 0.95);
  border-radius: 24px;
  padding: 22px;
  display: grid;
  gap: 18px;
  box-shadow: 0 14px 30px rgba(15, 35, 33, 0.12);
}

.modal-copy {
  display: grid;
  gap: 8px;
}

.modal-copy h2 {
  margin: 0;
  color: #172033;
  font-size: 1.12rem;
  font-weight: 800;
  line-height: 1.3;
}

.modal-copy :deep(p) {
  margin: 0;
  color: #536579;
  line-height: 1.6;
}

.modal-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.icon-button {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  border: 1px solid #c8d5d9;
  background: #fff;
  color: #172033;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}

.icon-button svg {
  width: 18px;
  height: 18px;
  fill: currentColor;
}

.icon-button-default {
  border-color: rgba(15, 118, 110, 0.18);
  background: rgba(0, 138, 124, 0.08);
  color: #0f766e;
}

.icon-button-danger {
  border-color: #fecaca;
  background: #fff1f2;
  color: #b91c1c;
}

.icon-button:disabled {
  opacity: 0.6;
}

@media (max-width: 720px) {
  .modal-actions {
    justify-content: flex-start;
  }

  .icon-button {
    width: 44px;
    height: 44px;
  }
}
</style>
