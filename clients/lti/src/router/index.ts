/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  createRouter,
  createWebHistory,
  createWebHashHistory,
  RouteRecordRaw,
} from 'vue-router'

import { useAppStore } from '../store/useAppStore'
const { actions: appActions } = useAppStore()

import Dashboard from '../views/Dashboard.vue'
import Share from '../views/Share.vue'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: '/dashboard',
  },
  {
    path: '/login',
    redirect: '/dashboard',
  },
  {
    path: '/postLogin',
    redirect: '/dashboard',
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: Dashboard,
    beforeEnter: () => {
      appActions.redirectedLogin().catch((error) => {
        console.log(error)
      })
    },
  },
  {
    path: '/share',
    name: 'Share',
    component: Share,
  },
  { path: '/index.html', redirect: '/' },
]

const router = createRouter({
  history:
    process.env.NODE_ENV === 'testing' // As engagelab server uses proxying for multiple apps, this is the easiest way..
      ? createWebHashHistory()
      : createWebHistory(process.env.BASE_URL),
  routes,
})
// router.beforeEach((to, from, next) => {
//   if (
//     !(from.name || to.redirectedFrom?.name) &&
//     to.name !== 'Login' &&
//     to.name !== 'Landing'
//   ) {
//     next('login')
//   } else next()
// })

export default router
