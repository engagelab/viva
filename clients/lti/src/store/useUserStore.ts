// import { computed, ref, Ref, ComputedRef } from 'vue'
// import { USER_ROLE } from '../constants'
// import { apiRequest } from '../api/apiRequest'
// import { hasMinimumRole } from '../utilities'
// import {
//   User,

//   LocalUser,
//   APIRequestPayload,
//   XHR_REQUEST_TYPE,
// } from '../types/main'
// import { useAppStore } from './useAppStore'

// const { actions: appActions } = useAppStore()

// // ------------  State (internal) --------------

// interface State {
//   myUser: User
//   selectedUser: User
//   allUsers: User[]
//   cordovaPath: string[]
// }

// const state: Ref<State> = ref({
//   myUser: new User(), // The actual logged in User. Initialised after successful login
//   selectedUser: new User(), // This user is the model for making changes to a User
//   allUsers: [], // All users in the system, for admins
//   cordovaPath: [],
// })
// // ------------  Internal functions ------------

// async function fetchMyUser(): Promise<UserData> {
//   const payload: APIRequestPayload = {
//     method: XHR_REQUEST_TYPE.GET,
//     credentials: true,
//     route: '/api/user',
//   }
//   return apiRequest<UserData>(payload)
// }

// async function fetchAllUsers(): Promise<UserData[]> {
//   const payload: APIRequestPayload = {
//     method: XHR_REQUEST_TYPE.GET,
//     credentials: true,
//     route: '/api/users',
//   }
//   return apiRequest<UserData[]>(payload)
// }

// async function sendUpdateUser(user: User): Promise<void> {
//   const payload: APIRequestPayload = {
//     method: XHR_REQUEST_TYPE.PUT,
//     credentials: true,
//     route: '/api/user',
//     body: user,
//   }
//   return apiRequest(payload)
// }

// // ------------  Getters --------------

// // Once a reactive getter has been gotten by a component
// // we cannot overwrite its instance here in the store - but we can write to its children reactively
// // Complex objects provided by a getter here should be represented by a Class and also have an update() function
// interface Getters {
//   myUser: ComputedRef<User>
//   selectedUser: ComputedRef<User>
//   allUsers: ComputedRef<User[]>

// }
// const getters = {
//   get myUser(): ComputedRef<User> {
//     return computed(() => state.value.myUser) // This is the current logged in user and should not change during app usage
//   },
//   get selectedUser(): ComputedRef<User> {
//     return computed(() => state.value.selectedUser) // This is the 'currently selected' user and can change, must change by calling User.update()
//   },
//   get allUsers(): ComputedRef<User[]> {
//     return computed(() => state.value.allUsers) // Unlikely to change during app usage, but ok as long as the array itself is not overwitten
//   },

// // ------------  Actions --------------
// // interface Actions {
// //   hasMinimumRole: (user: User, role: USER_ROLE) => boolean
// //   selectUser: (user: User) => void

// //   // Server
// //   getMyUser: () => Promise<void>
// //   getAllUsers: () => Promise<void>
// //   updateUser: (user: User) => Promise<void>
// // }
// // const actions = {
// //   // Retrieve from server the user details (called after login when online & not mobile)
// //   getMyUser: async function (): Promise<void> {
// //     appActions.setLoading(true)
// //     const response: UserData = await fetchMyUser()
// //     state.value.myUser.update(response)
// //     state.value.selectedUser.update(state.value.myUser)
// //     const newLocalUser: LocalUser = {
// //       _id: state.value.myUser._id,
// //       name: state.value.myUser.fullName,
// //       lastLogin: new Date(),
// //       jwt: localStorage.getItem('jwt') || '',
// //       pin: '',
// //       selected: true,
// //     }
// //     appActions.setCurrentLocalUser(newLocalUser)
// //     appActions.setLoading(false)
// //     return Promise.resolve()
// //   },

// //   // Retrieve from server a listing of all users
// //   getAllUsers: async function (): Promise<void> {
// //     appActions.setLoading(true)
// //     const response: UserData[] = await fetchAllUsers()
// //     const users = response.map((u: UserData) => new User(u))
// //     state.value.allUsers = users
// //     appActions.setLoading(false)
// //   },

// //   // Update a given user at server, and locally if it exists in allUsers
// //   updateUser: async function (user: User): Promise<void> {
// //     return sendUpdateUser(user).then(() => {
// //       // Also update the user in local list
// //       const modifiedUser = state.value.allUsers.find((u) => u._id === user._id)
// //       if (modifiedUser) modifiedUser.update(user)
// //     })
// //   },

// //   // Check that the selected user has at least the role requested
// //   // Direct reference to (utility function)
// //   hasMinimumRole,

// //   selectUser: function (user: User) {
// //     const u = state.value.allUsers.find((us) => us._id === user._id)
// //     if (u) {
// //       state.value.selectedUser = u
// //     }
// //   },
// // }

// // interface ServiceInterface {
// //   actions: Actions
// //   getters: Getters
// // }
// // This defines the interface used externally
// // export function useUserStore(): ServiceInterface {
// //   return {
// //     getters,
// //     actions,
// //   }
// // }

// // export type UserStoreType = ReturnType<typeof useUserStore>
// // export const UserKey: InjectionKey<UseUser> = Symbol('UseUser')
