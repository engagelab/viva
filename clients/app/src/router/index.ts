/* eslint-disable @typescript-eslint/no-explicit-any */
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
import {
  createRouter,
  createWebHistory,
  createWebHashHistory,
  RouteRecordRaw,
} from 'vue-router'

import Landing from '@/views/landing/Landing.vue'
import Dataset from '@/components/Dataset.vue'
import MyRecordings from '@/views/video/MyRecordings.vue'
import Editor from '@/views/video/Editor.vue'
import Privacy from '@/views/Privacy.vue'
import ErrorDisplay from '@/views/video/ErrorDisplay.vue'

import { useAppStore } from '../store/useAppStore'
import { useDatasetStore } from '../store/useDatasetStore'
import { useVideoStore } from '../store/useVideoStore'
const { actions: datasetActions } = useDatasetStore()
const { getters: appGetters, actions: appActions } = useAppStore()
const { getters: videoGetters, actions: videoActions } = useVideoStore()
import { idleTimeout } from '../constants'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'Landing',
    component: Landing,
  },
  { path: '/index.html', redirect: '/' },
  {
    path: '/login',
    name: 'profile',
    component: Landing,
    props: (route) => ({ page: route.query.page }),
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
          if (appGetters.isLoggedIn.value) {
            return datasetActions
              .fetchDatasets()
              .then(() => videoActions.loadMetadata())
              .then(() => videoActions.fetchMetadata())
              .then(() => {
                router.push('/videos/list')
                return { path: '/videos/list' }
              })
              .catch((error) => {
                console.log(error)
              })
          } else {
            return { path: '/login?page=0' }
          }
        })
        .catch((error) => {
          console.log(error)
        })
    },
  },
  {
    path: '/logout',
    name: 'logout',
    component: Landing,
    beforeEnter: () => {
      appActions.logout()
    },
  },
  // --------------------------------------------------------
  {
    path: '/dataset',
    name: 'datasett',
    component: Dataset,
    props: (route) => ({ page: route.query.page }),
  },
  {
    path: '/videos/list',
    name: 'video',
    component: MyRecordings,
  },
  {
    path: '/videos/editor',
    name: 'editor',
    component: Editor,
    props: (route) => ({ page: route.query.page }),
  },
  {
    path: '/videos/error',
    name: 'videoError',
    component: ErrorDisplay,
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
    to.path != '/transferred'

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
