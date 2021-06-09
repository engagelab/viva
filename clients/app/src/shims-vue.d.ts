declare module '*.vue' {
  import { Vue } from 'vue'
  const component: DefineComponent<
    Record<string, unknown>,
    Record<string, unknown>,
    unknown
  >
  // const component: ReturnType<typeof defineComponent>
  export default { Vue, component }
}

declare module '*.svg' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent
  export default component
}

declare module 'hooper'
declare module 'vue/types/vue' {
  // This defines additional functions available for use on a Question Type component
  // This allows Question.vue to control the question type child
  // The child should implement appropriate code that runs when these functions are called
  interface Vue {
    forwardInternal: () => void // Called when the user clicks the white 'forward' arrow
    onIntroductionStart: () => void // Called when introduction begins
    onIntroductionEnd: () => void // Called when introduction ends
  }
}

declare module '*.txt'
declare module '*.gql'
declare module '*.json'
declare module 'raw-loader!*'
