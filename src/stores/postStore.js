import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { postApi } from '@/api/postApi'
import { useFolderStore } from './folderStore'

export const usePostStore = defineStore('post', () => {
  // 상태
  const posts = ref([])
  const currentPost = ref(null)
  const pagination = ref({
    page: 0,
    size: 20,
    totalPages: 0,
    totalElements: 0,
  })

  // 폴더 스토어
  const folderStore = useFolderStore()

  // 계산된 속성 - 선택된 폴더의 게시글 필터링
  const filteredPosts = computed(() => {
    if (!folderStore.selectedFolderId) {
      return posts.value
    }

    return posts.value.filter((post) => post.folderId === folderStore.selectedFolderId)
  })

  // 내 게시글 목록 조회 (JWT 인증 사용)
  async function fetchMyPosts(page = 0, size = 20) {
    try {
      const response = await postApi.getMyPosts(page, size)

      posts.value = response.data.content || response.data
      pagination.value = {
        page: response.data.number || page,
        size: response.data.size || size,
        totalPages: response.data.totalPages || 0,
        totalElements: response.data.totalElements || 0,
      }

      return response.data
    } catch (error) {
      console.error('Failed to fetch my posts:', error)
      throw error
    }
  }

  // ID로 게시글 조회
  async function getPostById(postId) {
    try {
      const response = await postApi.getPostById(postId)
      currentPost.value = response.data
      return response.data
    } catch (error) {
      console.error('Failed to get post by id:', error)
      throw error
    }
  }

  // 게시글 생성 (JWT 인증 사용)
  async function createPost(data) {
    try {
      const response = await postApi.createPost(data)
      const newPost = response.data

      posts.value.unshift(newPost)
      pagination.value.totalElements += 1

      return newPost
    } catch (error) {
      console.error('Failed to create post:', error)
      throw error
    }
  }

  // 게시글 수정 (JWT 인증 사용)
  async function updatePost(postId, data) {
    try {
      const response = await postApi.updatePost(postId, data)
      const updatedPost = response.data

      // 게시글 목록에서 업데이트
      const index = posts.value.findIndex((p) => p.id === postId)
      if (index !== -1) {
        posts.value[index] = updatedPost
      }

      // 현재 게시글도 업데이트
      if (currentPost.value?.id === postId) {
        currentPost.value = updatedPost
      }

      return updatedPost
    } catch (error) {
      console.error('Failed to update post:', error)
      throw error
    }
  }

  // 게시글 삭제 (JWT 인증 사용)
  async function deletePost(postId) {
    try {
      await postApi.deletePost(postId)

      // 게시글 목록에서 제거
      posts.value = posts.value.filter((p) => p.id !== postId)
      pagination.value.totalElements = Math.max(0, pagination.value.totalElements - 1)

      // 현재 게시글도 초기화
      if (currentPost.value?.id === postId) {
        currentPost.value = null
      }
    } catch (error) {
      console.error('Failed to delete post:', error)
      throw error
    }
  }

  // 현재 게시글 설정
  function setCurrentPost(post) {
    currentPost.value = post
  }

  // 현재 게시글 초기화
  function clearCurrentPost() {
    currentPost.value = null
  }

  // 게시글 폴더 이동 (JWT 인증 사용)
  async function movePost(postId, folderId) {
    try {
      const response = await postApi.movePost(postId, folderId)
      const updatedPost = response.data

      // 게시글 목록에서 업데이트
      const index = posts.value.findIndex((p) => p.id === postId)
      if (index !== -1) {
        posts.value[index] = updatedPost
      }

      // 현재 게시글도 업데이트
      if (currentPost.value?.id === postId) {
        currentPost.value = updatedPost
      }

      return updatedPost
    } catch (error) {
      console.error('Failed to move post:', error)
      throw error
    }
  }

  return {
    posts,
    currentPost,
    pagination,
    filteredPosts,
    fetchMyPosts,
    getPostById,
    createPost,
    updatePost,
    deletePost,
    setCurrentPost,
    clearCurrentPost,
    movePost,
  }
})
