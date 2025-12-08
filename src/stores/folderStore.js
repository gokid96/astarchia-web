import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { folderApi } from '@/api/folderApi'
import { buildFolderTree } from '@/utils/helpers'
import { usePostStore } from './postStore'

export const useFolderStore = defineStore('folder', () => {
  // 상태
  const folders = ref([])
  const selectedFolderId = ref(null)
  const rootFolders = ref([])
  const folderTree = ref([])  // computed 대신 일반 ref 사용
  const sortOption = ref('name_asc')  // 정렬 옵션: name_asc, name_desc, updated_desc, updated_asc, created_desc, created_asc

  // 선택된 폴더
  const selectedFolder = computed(() => {
    return folders.value.find((f) => f.id === selectedFolderId.value) || null
  })

  // 폴더 트리 업데이트 함수
  function updateFolderTree() {
    const postStore = usePostStore()
    folderTree.value = buildFolderTree(folders.value, null, postStore.posts, sortOption.value)
  }

  // 정렬 옵션 설정 함수
  function setSortOption(option) {
    sortOption.value = option
    updateFolderTree()
  }

  // 루트 폴더 목록 조회 (JWT 인증 사용)
  async function fetchRootFolders() {
    try {
      const response = await folderApi.getRootFolders()
      rootFolders.value = response.data
      // 루트 폴더들을 전체 폴더 목록에 추가
      folders.value = response.data
      return response.data
    } catch (error) {
      console.error('Failed to fetch root folders:', error)
      throw error
    }
  }

  // 하위 폴더 목록 조회 (JWT 인증 사용)
  async function fetchChildFolders(folderId) {
    try {
      const response = await folderApi.getChildFolders(folderId)
      const childFolders = response.data

      // 중복 제거하며 전체 폴더 목록에 추가
      childFolders.forEach((child) => {
        const existingIndex = folders.value.findIndex((f) => f.id === child.id)
        if (existingIndex === -1) {
          folders.value.push(child)
        } else {
          folders.value[existingIndex] = child
        }
      })

      return childFolders
    } catch (error) {
      console.error('Failed to fetch child folders:', error)
      throw error
    }
  }

  // 모든 폴더 재귀적으로 로드 (JWT 인증 사용)
  async function loadAllFolders() {
    try {
      await fetchRootFolders()

      // 재귀적으로 모든 하위 폴더 로드
      const loadChildren = async (folderId) => {
        const children = await fetchChildFolders(folderId)
        for (const child of children) {
          if (child.hasChildren) {
            await loadChildren(child.id)
          }
        }
      }

      for (const folder of rootFolders.value) {
        if (folder.hasChildren) {
          await loadChildren(folder.id)
        }
      }

      // 폴더 로드 완료 후 트리 업데이트
      updateFolderTree()
    } catch (error) {
      console.error('Failed to load all folders:', error)
      throw error
    }
  }

  // 폴더 생성 (JWT 인증 사용)
  async function createFolder(data) {
    try {
      console.log('[FolderStore] Creating folder with data:', data)
      console.log('[FolderStore] Current folders count before create:', folders.value.length)

      const response = await folderApi.createFolder(data)
      const newFolder = response.data

      console.log('[FolderStore] Created folder:', newFolder)

      // 중복 체크
      const exists = folders.value.find(f => f.id === newFolder.id)
      if (exists) {
        console.warn('[FolderStore] Folder already exists in folders array:', newFolder.id)
      } else {
        folders.value.push(newFolder)
        console.log('[FolderStore] Added folder to folders array')
      }

      // 루트 폴더인 경우 루트 폴더 목록에도 추가
      if (!newFolder.parentId) {
        const rootExists = rootFolders.value.find(f => f.id === newFolder.id)
        if (!rootExists) {
          rootFolders.value.push(newFolder)
          console.log('[FolderStore] Added to rootFolders')
        }
      }

      console.log('[FolderStore] Current folders count after create:', folders.value.length)

      // 트리 업데이트
      updateFolderTree()
      console.log('[FolderStore] Tree updated, folderTree length:', folderTree.value.length)

      return newFolder
    } catch (error) {
      console.error('Failed to create folder:', error)
      throw error
    }
  }

  // 폴더 수정 (JWT 인증 사용)
  async function updateFolder(folderId, data) {
    try {
      const response = await folderApi.updateFolder(folderId, data)
      const updatedFolder = response.data

      // 폴더 목록에서 업데이트
      const index = folders.value.findIndex((f) => f.id === folderId)
      if (index !== -1) {
        folders.value[index] = updatedFolder
      }

      // 루트 폴더 목록에서도 업데이트
      const rootIndex = rootFolders.value.findIndex((f) => f.id === folderId)
      if (rootIndex !== -1) {
        rootFolders.value[rootIndex] = updatedFolder
      }

      // 트리 업데이트
      updateFolderTree()

      return updatedFolder
    } catch (error) {
      console.error('Failed to update folder:', error)
      throw error
    }
  }

  // 폴더 삭제 (JWT 인증 사용)
  async function deleteFolder(folderId) {
    try {
      await folderApi.deleteFolder(folderId)

      // 폴더 목록에서 제거 (하위 폴더도 함께 제거)
      const removeFolder = (id) => {
        const children = folders.value.filter((f) => f.parentId === id)
        children.forEach((child) => removeFolder(child.id))
        folders.value = folders.value.filter((f) => f.id !== id)
      }

      removeFolder(folderId)

      // 루트 폴더 목록에서도 제거
      rootFolders.value = rootFolders.value.filter((f) => f.id !== folderId)

      // 선택된 폴더가 삭제된 경우 선택 해제
      if (selectedFolderId.value === folderId) {
        selectedFolderId.value = null
      }

      // 트리 업데이트
      updateFolderTree()
    } catch (error) {
      console.error('Failed to delete folder:', error)
      throw error
    }
  }

  // 폴더 선택
  function selectFolder(folderId) {
    selectedFolderId.value = folderId
  }

  // 폴더 선택 해제
  function clearSelection() {
    selectedFolderId.value = null
  }

  // 폴더 이동 (JWT 인증 사용)
  async function moveFolder(folderId, newParentId) {
    try {
      console.log('[FolderStore] moveFolder 호출:', { folderId, newParentId })

      const response = await folderApi.moveFolder(folderId, {
        parentId: newParentId
      })

      const updatedFolder = response.data
      console.log('[FolderStore] 폴더 이동 완료:', updatedFolder)

      // 폴더 목록에서 업데이트
      const index = folders.value.findIndex((f) => f.id === folderId)
      if (index !== -1) {
        folders.value[index] = updatedFolder
      }

      // 루트 폴더 목록 업데이트
      if (!updatedFolder.parentId) {
        // 루트로 이동한 경우
        const rootExists = rootFolders.value.find(f => f.id === folderId)
        if (!rootExists) {
          rootFolders.value.push(updatedFolder)
        }
      } else {
        // 루트에서 다른 폴더로 이동한 경우
        rootFolders.value = rootFolders.value.filter(f => f.id !== folderId)
      }

      // 트리 업데이트
      updateFolderTree()
      console.log('[FolderStore] 트리 업데이트 완료')

      return updatedFolder
    } catch (error) {
      console.error('[FolderStore] 폴더 이동 실패:', error)
      throw error
    }
  }

  return {
    folders,
    selectedFolderId,
    rootFolders,
    folderTree,
    selectedFolder,
    sortOption,
    fetchRootFolders,
    fetchChildFolders,
    loadAllFolders,
    createFolder,
    updateFolder,
    deleteFolder,
    selectFolder,
    clearSelection,
    updateFolderTree,
    moveFolder,
    setSortOption
  }
})
