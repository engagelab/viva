import { ref, computed, ComputedRef, Ref } from 'vue'
import { apiRequest } from '../api/apiRequest'
import { Project, APIRequestPayload, XHR_REQUEST_TYPE } from '../types/main'
import { useAppStore } from './useAppStore'

const { actions: appActions } = useAppStore()

// ------------  State (internal) --------------

interface State {
  projects: Project[]
  selectedProject: Project | undefined
  overrideCMS: boolean
}

const state: Ref<State> = ref({
  projects: [], // All projects in the system, for admins
  selectedProject: undefined,
  overrideCMS: false, // Set to true to get data again from the CMS regardless (one time only)
})
// ------------  Internal functions ------------

async function fetchProjects(): Promise<Project[]> {
  const payload: APIRequestPayload = {
    method: XHR_REQUEST_TYPE.GET,
    credentials: true,
    route: '/api/projects',
  }
  return apiRequest(payload)
}

async function sendUpdateProject(project: Project): Promise<void> {
  const payload: APIRequestPayload = {
    method: XHR_REQUEST_TYPE.PUT,
    credentials: true,
    route: '/api/project',
    body: project,
  }
  return apiRequest(payload)
}

async function sendDeleteProject(project: Project): Promise<void> {
  const payload: APIRequestPayload = {
    method: XHR_REQUEST_TYPE.DELETE,
    credentials: true,
    route: '/api/project',
    body: project,
  }
  return apiRequest(payload)
}

async function sendAddProject(): Promise<Project> {
  const payload: APIRequestPayload = {
    method: XHR_REQUEST_TYPE.POST,
    credentials: true,
    route: '/api/project',
  }
  return apiRequest(payload)
}

// ------------  Getters --------------
interface Getters {
  projects: ComputedRef<Project[]>
  selectedProject: ComputedRef<Project>
  overrideCMS: boolean
}
const getters = {
  get projects(): ComputedRef<Project[]> {
    return computed(() => state.value.projects)
  },
  get selectedProject(): ComputedRef<Project> {
    return computed(() => state.value.selectedProject || new Project())
  },
  get overrideCMS(): boolean {
    if (state.value.overrideCMS) {
      state.value.overrideCMS = false
      return true
    } else return false
  },
}

// ------------  Actions --------------
interface Actions {
  getProjects: () => Promise<void>
  updateProject: (project: Project) => Promise<void>
  deleteProject: (project: Project) => Promise<void>
  removeProject: (project: Project) => Promise<void>
  createProject: () => Promise<void>
  addProject: (p: Project) => void
  clearProjects: () => void
  selectProject: (p: Project) => void
  projectById(id: string): Project | undefined
  overrideCMS(): void
}
const actions = {
  overrideCMS: function (): void {
    state.value.overrideCMS = true
  },
  projectById: function (id: string): Project | undefined {
    return state.value.projects.find((p) => p._id === id)
  },
  selectProject: function (p: Project): void {
    state.value.selectedProject = state.value.projects.find(
      (pr) => pr._id === p._id
    )
  },
  // Get a listing of all users
  getProjects: async function (): Promise<void> {
    appActions.setLoading(true)
    const response = await fetchProjects()
    state.value.projects = response.map((p) => new Project(p))
    appActions.setLoading(false)
  },

  deleteProject: async function (project: Project): Promise<void> {
    await sendDeleteProject(project)
    const deletedProjectIndex = state.value.projects.findIndex(
      (p: Project) => p._id === project._id
    )
    if (deletedProjectIndex > -1)
      state.value.projects.splice(deletedProjectIndex, 1)
  },

  removeProject: async function (project: Project): Promise<void> {
    await sendDeleteProject(project)
    const deletedProjectIndex = state.value.projects.findIndex(
      (p) => p._id === project._id
    )
    if (deletedProjectIndex > -1)
      state.value.projects.splice(deletedProjectIndex, 1)
  },

  updateProject: async function (project: Project): Promise<void> {
    await sendUpdateProject(project)
    const modifiedProject = state.value.projects.find(
      (p) => p._id === project._id
    )
    if (modifiedProject) modifiedProject.update(project)
  },

  // Create a new Project
  createProject: async function (): Promise<void> {
    const response = await sendAddProject()
    const newProject = new Project(response)
    state.value.projects.push(newProject)
  },

  // Add a Project to our list
  addProject: function (p: Project): void {
    const newProject = new Project(p)
    state.value.projects.push(newProject)
  },

  clearProjects: function (): void {
    state.value.projects = []
  },
}
interface ServiceInterface {
  actions: Actions
  getters: Getters
}
// This defines the interface used externally
export function useProjectStore(): ServiceInterface {
  return {
    getters,
    actions,
  }
}

export type ProjectStoreType = ReturnType<typeof useProjectStore>
// export const UserKey: InjectionKey<UseUser> = Symbol('UseUser')
