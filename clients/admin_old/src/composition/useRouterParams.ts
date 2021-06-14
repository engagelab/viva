/* import Vue from 'vue'
import { computed } from 'vue'
import { router } from '../router'

const routeData = Vue.reactive({ params: {}, query: {} })

router.afterEach(route => {
  routeData.params = route.params
  routedata.query = route.query
})

export default function useRouterParams() {
  return computed(() => routeData.params)
}
 */
