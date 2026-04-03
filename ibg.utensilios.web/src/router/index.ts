import { createRouter, createWebHistory } from 'vue-router'

import { hasStoredSession } from '@/utils/auth-session'
import DashboardView from '@/views/DashboardView.vue'
import EmprestimosListView from '@/views/EmprestimosListView.vue'
import EmprestimosView from '@/views/EmprestimosView.vue'
import HistoricoListView from '@/views/HistoricoListView.vue'
import HistoricoView from '@/views/HistoricoView.vue'
import ItemImagensView from '@/views/ItemImagensView.vue'
import ItensView from '@/views/ItensView.vue'
import ItensListView from '@/views/ItensListView.vue'
import LoginView from '@/views/LoginView.vue'
import MembrosView from '@/views/MembrosView.vue'
import MembrosListView from '@/views/MembrosListView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/login',
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
    },
    {
      path: '/painel',
      name: 'dashboard',
      component: DashboardView,
      meta: { requiresAuth: true },
    },
    {
      path: '/itens',
      name: 'items-create',
      component: ItensView,
      meta: { requiresAuth: true },
    },
    {
      path: '/itens/lista',
      name: 'items-list',
      component: ItensListView,
      meta: { requiresAuth: true },
    },
    {
      path: '/itens/:id/editar',
      name: 'items-edit',
      component: ItensView,
      meta: { requiresAuth: true },
    },
    {
      path: '/itens/:id/imagens',
      name: 'item-images',
      component: ItemImagensView,
      meta: { requiresAuth: true },
    },
    {
      path: '/membros',
      name: 'members',
      component: MembrosView,
      meta: { requiresAuth: true },
    },
    {
      path: '/membros/lista',
      name: 'members-list',
      component: MembrosListView,
      meta: { requiresAuth: true },
    },
    {
      path: '/membros/:id/editar',
      name: 'members-edit',
      component: MembrosView,
      meta: { requiresAuth: true },
    },
    {
      path: '/emprestimos',
      name: 'loans',
      component: EmprestimosView,
      meta: { requiresAuth: true },
    },
    {
      path: '/emprestimos/lista',
      name: 'loans-list',
      component: EmprestimosListView,
      meta: { requiresAuth: true },
    },
    {
      path: '/emprestimos/:id/editar',
      name: 'loans-edit',
      component: EmprestimosView,
      meta: { requiresAuth: true },
    },
    {
      path: '/historico',
      name: 'history',
      component: HistoricoView,
      meta: { requiresAuth: true },
    },
    {
      path: '/historico/lista',
      name: 'history-list',
      component: HistoricoListView,
      meta: { requiresAuth: true },
    },
    {
      path: '/historico/:id/editar',
      name: 'history-edit',
      component: HistoricoView,
      meta: { requiresAuth: true },
    },
  ],
})

router.beforeEach((to) => {
  const authenticated = hasStoredSession()

  if (to.meta.requiresAuth && !authenticated) {
    return { name: 'login' }
  }

  if (to.name === 'login' && authenticated) {
    return { name: 'dashboard' }
  }

  return true
})

export default router
