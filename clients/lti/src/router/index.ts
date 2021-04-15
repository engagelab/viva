/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  createRouter,
  createWebHistory,
  createWebHashHistory,
  RouteRecordRaw,
} from 'vue-router'

import Landing from '@/views/landing/Landing.vue'
import AfterLogin from '@/views/landing/AfterLogin.vue'
import Dashboard from '@/views/Dashboard.vue'

import Monitor from '../views/admin/Monitor.vue'
import MonitorProfile from '../views/admin/MonitorProfile.vue'
import MonitorProjects from '../views/admin/MonitorProjects.vue'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'Landing',
    component: Landing,
  },
  { path: '/index.html', redirect: '/' },
  {
    path: '/login',
    name: 'Login',
    component: AfterLogin,
  },
  {
    path: '/monitor',
    redirect: '/monitor/profile',
    name: 'Monitor',
    component: Monitor,
    children: [
      {
        // UserProfile will be rendered inside User's <router-view>
        // when /user/profile is matched
        path: 'profile',
        name: 'MonitorProfile',
        component: MonitorProfile,
      },
      {
        // UserPosts will be rendered inside User's <router-view>
        // when /user/projects is matched
        path: 'projects',
        name: 'MonitorProjects',
        component: MonitorProjects,
      },
    ],
  },
  {
    path: '/dashboard/:reloaded?',
    name: 'Dashboard',
    component: Dashboard,
  },
]

const router = createRouter({
  history:
    process.env.NODE_ENV === 'testing' // As engagelab server uses proxying for multiple apps, this is the easiest way..
      ? createWebHashHistory()
      : createWebHistory(process.env.BASE_URL),
  routes,
})
router.beforeEach((to, from, next) => {
  if (
    !(from.name || to.redirectedFrom?.name) &&
    to.name !== 'Login' &&
    to.name !== 'Landing'
  ) {
    next('login')
  } else next()
})

export default router
