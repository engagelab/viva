/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  createRouter,
  createWebHistory,
  createWebHashHistory,
  RouteRecordRaw,
} from 'vue-router'

import Dashboard from '../views/Dashboard.vue'

import Monitor from '../views/admin/Monitor.vue'
import Dataset from '../views/admin/Dataset.vue'
import VideoLogs from '../views/admin/Videologs.vue'

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

  {
    path: '/monitor',
    redirect: '/monitor/dataset',
    name: 'Monitor',
    component: Monitor,
    children: [
      {
        // UserProfile will be rendered inside User's <router-view>
        // when /user/profile is matched
        path: 'dataset',
        name: 'Dataset',
        component: Dataset,
      },
      {
        // UserPosts will be rendered inside User's <router-view>
        // when /user/projects is matched
        path: 'videologs',
        name: 'VideoLogs',
        component: VideoLogs,
      },
    ],
  },
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
