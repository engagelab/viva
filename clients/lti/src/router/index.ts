/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  createRouter,
  createWebHistory,
  createWebHashHistory,
  RouteRecordRaw,
} from 'vue-router'

import Dashboard from '../views/Dashboard.vue'

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
    path: '/dashboard',
    name: 'Dashboard',
    component: Dashboard,
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
