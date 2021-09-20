/*
 Copyright 2020, 2021 Richard Nesnass, Sharanya Manivasagam, and Ole Smørdal

 This file is part of VIVA.

 VIVA is free software: you can redistribute it and/or modify
 it under the terms of the GNU Affero General Public License as published by
 the Free Software Foundation, either version 3 of the License, or
 (at your option) any later version.

 GPL-3.0-only or GPL-3.0-or-later

 VIVA is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU Affero General Public License for more details.

 You should have received a copy of the GNU Affero General Public License
 along with VIVA.  If not, see <http://www.gnu.org/licenses/>.
*/
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
  history: baseUrl.includes('engagelab') // As engagelab server uses proxying for multiple apps, this is the easiest way..
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
