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

import Landing from '@/views/landing/Landing.vue'

import Privacy from '@/views/Privacy.vue'
import Monitor from '@/views/admin/Monitor.vue'
import MonitorRecordingLog from '@/views/admin/MonitorRecordingLog.vue'
import MonitorYourDatasets from '@/views/admin/MonitorYourDatasets.vue'
import MonitorRecordingsInProcess from '@/views/admin/MonitorRecordingsInProcess.vue'

import { useAppStore } from '../store/useAppStore'
import { useVideoStore } from '../store/useVideoStore'
const { getters: appGetters, actions: appActions } = useAppStore()
const { getters: videoGetters } = useVideoStore()
import { idleTimeout } from '../constants'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/login',
    name: 'profile',
    component: Landing,
    props: (route) => ({ page: route.query.page }),
  },
  {
    path: '/logout',
    name: 'logout',
    redirect: () => {
      return { path: '/login?page=0' }
    },
  },
  // ---------- These routes manage server redirects ------------
  // -------- after login or after file transfer to 3rd party API -------
  {
    path: '/postlogin',
    name: 'afterlogin',
    component: Landing,
    beforeEnter: () => {
      appActions
        .redirectedLogin()
        .then(() => {
          router.push('/monitor')
        })
        .catch((error) => {
          console.log(error)
        })
    },
  },
  // --------------------------------------------------------
  {
    path: '/monitor',
    redirect: '/monitor/recordingLog',
    name: 'Monitor',
    component: Monitor,
    props: (route) => ({ page: route.query.page }),
    children: [
      {
        path: 'recordingLog',
        name: 'MonitorRecordingLog',
        component: MonitorRecordingLog,
      },
      {
        path: 'yourDatasets',
        name: 'MonitorYourDatasets',
        component: MonitorYourDatasets,
      },
      {
        path: 'recordingsInProcess',
        name: 'MonitorRecordingInProcess',
        component: MonitorRecordingsInProcess,
      },
    ],
  },
  {
    path: '/privacy',
    name: 'privacy',
    component: Privacy,
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
  const idleTime = Math.floor(
    (new Date().getTime() - appGetters.lastActive.value) / 1000
  )
  const isLoggedIn = appGetters.isLoggedIn.value
  const uploadingData = videoGetters.uploadingData.value
  const recordingNow = videoGetters.recordingNow.value
  appActions.activeNow()

  window.scroll({
    top: 0,
    left: 0,
    behavior: 'smooth',
  })

  const idleTooLong =
    isLoggedIn && !uploadingData && idleTime > idleTimeout && !recordingNow

  const forceToLoginScreen =
    !isLoggedIn &&
    to.path != '/' &&
    to.path != '/login' &&
    to.path != '/privacy' &&
    to.path != '/postlogin' &&
    to.path != '/logout' &&
    to.path != '/transferred' &&
    to.path != '/monitor' &&
    to.path != '/monitor/recordingLog' &&
    to.path != '/monitor/yourDatasets' &&
    to.path != '/monitor/recordingsInProcess'

  // Log out if the user has been idle for too long before making this request
  // Force to login screen if not logged in and not already there and not redirecting from oAuth
  if (idleTooLong) {
    appActions.logout()
  } else if (to.path == '/' || forceToLoginScreen) {
    next('/login?page=0')
  } else {
    // If we are requesting '/setting' or '/transferred' allow it to proceed. It may be an oAuth redirect.
    // An API call will be made immediately for user's settings (see beforeEnter in '/settings').
    // If that call fails, user will be redireced back to '/login'
    // If it succeeds, user will be marked as logged in
    next()
  }
})

export default router
