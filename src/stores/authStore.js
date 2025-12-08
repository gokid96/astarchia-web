import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { userApi } from '@/api/userApi'

export const useAuthStore = defineStore('auth', () => {
  // 상태
  const currentUser = ref(null)
  const isAuthenticated = computed(() => !!currentUser.value)

  // userId를 일관되게 제공 (id 또는 userId 필드 둘 다 지원)
  const userId = computed(() => currentUser.value?.userId || currentUser.value?.id || null)

  // 서버에서 현재 로그인 상태 확인 (세션 기반)
  async function checkAuthStatus() {
    try {
      const response = await userApi.getCurrentUser()
      
      if (response.data?.authenticated) {
        currentUser.value = {
          userId: response.data.userId,
          id: response.data.userId,
          loginId: response.data.loginId,
          nickname: response.data.nickname,
        }
        return true
      } else {
        currentUser.value = null
        return false
      }
    } catch (error) {
      // 401 에러 등 - 로그인 안 된 상태
      currentUser.value = null
      return false
    }
  }

  // 앱 시작 시 로그인 상태 복원
  async function loadUserFromStorage() {
    // 세션 방식: 서버에 세션 유효성 확인
    await checkAuthStatus()
  }

  // 인증 데이터 정리
  function clearAuthData() {
    currentUser.value = null
  }

  // 사용자 정보 조회 (세션 기반)
  async function getUserInfo() {
    try {
      const response = await userApi.getUserInfo()
      currentUser.value = response.data
      return response.data
    } catch (error) {
      console.error('Failed to get user info:', error)
      throw error
    }
  }

  // 로그인
  async function login(loginId, password) {
    try {
      const response = await userApi.login(loginId, password)
      const userData = response.data

      // 세션은 서버에서 관리, 프론트는 사용자 정보만 상태로 보관
      currentUser.value = {
        userId: userData.userId,
        id: userData.userId,
        loginId: userData.loginId,
        nickname: userData.nickname,
      }

      return userData
    } catch (error) {
      console.error('Login failed:', error)
      throw error
    }
  }

  // 회원가입
  async function register(userData) {
    try {
      const response = await userApi.register(userData)
      const data = response.data

      // 회원가입 후 자동 로그인 (세션 생성됨)
      currentUser.value = {
        userId: data.userId,
        id: data.userId,
        loginId: data.loginId,
        nickname: data.nickname,
      }

      return data
    } catch (error) {
      console.error('Registration failed:', error)
      throw error
    }
  }

  // 로그아웃
  async function logout() {
    try {
      // 서버에 로그아웃 요청 (세션 무효화)
      await userApi.logout()
    } catch (error) {
      console.error('Logout request failed:', error)
      // 에러가 나도 프론트 상태는 정리
    }
    clearAuthData()
  }

  // 사용자 정보 수정
  async function updateUserInfo(data) {
    try {
      const response = await userApi.updateUser(data)
      currentUser.value = response.data
      return response.data
    } catch (error) {
      console.error('Failed to update user info:', error)
      throw error
    }
  }

  // 회원 탈퇴
  async function deleteAccount() {
    try {
      await userApi.deleteUser()
      clearAuthData()
    } catch (error) {
      console.error('Failed to delete account:', error)
      throw error
    }
  }

  return {
    currentUser,
    userId,
    isAuthenticated,
    loadUserFromStorage,
    checkAuthStatus,
    getUserInfo,
    login,
    register,
    logout,
    updateUserInfo,
    deleteAccount,
  }
})
