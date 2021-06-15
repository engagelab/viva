/* eslint-disable @typescript-eslint/no-explicit-any */
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
import Monitor from '@/views/Monitor.vue'
import MonitorRecordingLog from '@/views/MonitorRecordingLog.vue'
import MonitorYourDatasets from '@/views/MonitorYourDatasets.vue'
import MonitorRecordingsInProcess from '@/views/MonitorRecordingsInProcess.vue'

import { useAppStore } from '../store/useAppStore'
import { useDatasetStore } from '../store/useDatasetStore'
import { useVideoStore } from '../store/useVideoStore'
const { actions: datasetActions } = useDatasetStore()
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
    component: MyRecordings,
    redirect: '/monitor',
    beforeEnter: () => {
      appActions
        .redirectedLogin()
        .then(() => {
          if (appGetters.isLoggedIn.value) {
            return datasetActions
              .fetchDatasets()
              .then(() => {
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
  // --------------------------------------------------------
  {
    path: '/monitor',
    redirect: '/monitor/recordingLog',
    name: 'Monitor',
    component: Monitor,
    props: (route) => ({ page: route.query.page }),
    children: [
      {
        // Ward Table will be rendered inside User's <router-view>
        // when /monitor/wards is matched
        path: 'recordingLog',
        name: 'MonitorRecordingLog',
        component: MonitorRecordingLog,
      },
      {
        // User Table will be rendered inside User's <router-view>
        // when /monitor/users is matched
        path: 'yourDatasets',
        name: 'MonitorYourDatasets',
        component: MonitorYourDatasets,
      },
      {
        // Participant Table will be rendered inside User's <router-view>
        // when /monitor/participants is matched
        path: 'recordingsInProcess',
        name: 'MonitorRecordingInProcess',
        component: MonitorRecordingsInProcess,
      },
    ],
    beforeEnter: () => {
      appActions
        .redirectedLogin()
        .then(() => {
          if (appGetters.isLoggedIn.value) {
            return datasetActions
              .fetchDatasets()
              .then(() => {
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
    new Date().getTime() - appGetters.lastActive.value / 1000
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
