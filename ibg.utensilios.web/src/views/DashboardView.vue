<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'

import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const router = useRouter()

const userFirstName = computed(() => {
  const nomeCompleto = authStore.user?.nome?.trim()

  if (nomeCompleto) {
    return nomeCompleto.split(/\s+/)[0]
  }

  const email = authStore.user?.email?.trim()

  if (email) {
    return email.split('@')[0]
  }

  return 'Usuário'
})

const quickAreas = [
  { id: '01', title: 'Itens', routeName: 'items-create' },
  { id: '02', title: 'Membros', routeName: 'members' },
  { id: '03', title: 'Empréstimos', routeName: 'loans' },
  { id: '04', title: 'Histórico', routeName: 'history' },
]

function handleLogout() {
  authStore.logout()
  void router.push({ name: 'login' })
}

function openArea(routeName: string) {
  void router.push({ name: routeName })
}
</script>

<template>
  <main class="dashboard-page">
    <section class="dashboard-shell">
      <header class="hero-card">
        <div class="hero-grid">
          <div class="project-block">
            <p class="eyebrow">IBG - UTENSÍLIOS</p>
          </div>

          <div class="session-block">
            <div class="session-copy">
              <div class="session-row">
                <p class="session-label">Usuário:</p>
                <p class="logged-user">{{ userFirstName }}</p>
              </div>

              <button
                type="button"
                class="logout-button"
                @click="handleLogout"
                aria-label="Sair do sistema"
                title="Sair do sistema"
              >
                <span class="material-icons" aria-hidden="true">logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <section class="quick-grid" aria-label="Áreas principais do sistema">
        <button
          v-for="area in quickAreas"
          :key="area.title"
          type="button"
          class="quick-card"
          @click="openArea(area.routeName)"
        >
          <span class="quick-card-index">{{ area.id }}</span>
          <p class="quick-card-label">{{ area.title }}</p>
        </button>
      </section>
    </section>
  </main>
</template>

<style scoped>
.dashboard-page {
  min-height: 100vh;
  background:
    radial-gradient(circle at top left, rgba(0, 138, 124, 0.12), transparent 35%),
    linear-gradient(180deg, #f3f7f7 0%, #edf3f4 100%);
  padding: clamp(16px, 3vw, 28px);
  box-sizing: border-box;
}

.dashboard-shell {
  width: min(100%, 1120px);
  margin: 0 auto;
  display: grid;
  gap: clamp(18px, 2.4vw, 24px);
  container-type: inline-size;
}

.hero-card {
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(219, 228, 232, 0.95);
  border-radius: 24px;
  padding: clamp(18px, 2.8vw, 30px);
  box-shadow: 0 16px 32px rgba(15, 35, 33, 0.08);
}

.hero-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(220px, 320px);
  gap: 20px;
  align-items: start;
}

.project-block {
  display: grid;
  gap: 10px;
  align-content: start;
}

.eyebrow {
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  font-size: 0.76rem;
  font-weight: 800;
  color: #0f766e;
}

.session-block {
  display: grid;
  justify-items: end;
  align-content: start;
}

.session-copy {
  width: min(100%, 320px);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 18px;
  background: linear-gradient(180deg, rgba(0, 138, 124, 0.08), rgba(0, 138, 124, 0.02));
  border: 1px solid rgba(0, 138, 124, 0.12);
}

.session-row {
  display: flex;
  align-items: baseline;
  gap: 6px;
  min-width: 0;
}

.session-label {
  margin: 0;
  color: #0f766e;
  font-size: 0.92rem;
  font-weight: 800;
}

.logged-user {
  margin: 0;
  color: #172033;
  font-size: clamp(0.98rem, 1.2vw, 1.06rem);
  font-weight: 700;
  text-align: left;
  overflow-wrap: anywhere;
}

.logout-button {
  width: 42px;
  height: 42px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  border: 1px solid rgba(15, 118, 110, 0.18);
  background: rgba(255, 255, 255, 0.88);
  color: #0f766e;
  box-shadow: 0 6px 18px rgba(15, 35, 33, 0.06);
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    border-color 0.18s ease;
}

.logout-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 22px rgba(15, 35, 33, 0.1);
  border-color: rgba(15, 118, 110, 0.28);
}

.logout-button:focus-visible {
  outline: 2px solid rgba(0, 138, 124, 0.34);
  outline-offset: 3px;
}

.quick-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: clamp(14px, 1.8vw, 18px);
}

.quick-card {
  min-block-size: 116px;
  border-radius: 22px;
  border: 1px solid rgba(219, 228, 232, 0.94);
  background: rgba(255, 255, 255, 0.94);
  padding: 18px 18px 20px;
  box-shadow: 0 10px 24px rgba(15, 35, 33, 0.06);
  display: grid;
  gap: 18px;
  align-content: space-between;
  text-align: left;
  cursor: pointer;
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    border-color 0.18s ease;
}

.quick-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 16px 30px rgba(15, 35, 33, 0.1);
  border-color: rgba(0, 138, 124, 0.24);
}

.quick-card:focus-visible {
  outline: 2px solid rgba(0, 138, 124, 0.34);
  outline-offset: 4px;
}

.quick-card-index {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: fit-content;
  min-width: 42px;
  min-height: 28px;
  padding: 0 10px;
  border-radius: 999px;
  background: rgba(0, 138, 124, 0.1);
  color: #0f766e;
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.08em;
}

.quick-card-label {
  margin: 0;
  color: #172033;
  font-size: clamp(1.05rem, 1.7vw, 1.2rem);
  font-weight: 800;
  line-height: 1.25;
}

@container (max-width: 860px) {
  .hero-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .session-block {
    justify-items: start;
  }

  .quick-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@container (max-width: 520px) {
  .hero-card {
    border-radius: 20px;
  }

  .session-copy {
    width: 100%;
  }

  .session-row {
    flex-wrap: wrap;
  }

  .quick-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .quick-card {
    min-block-size: 96px;
    border-radius: 18px;
  }
}
</style>
