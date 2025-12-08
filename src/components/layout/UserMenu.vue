<template>
  <div class="user-menu-container">
    <!-- 사용자 버튼 -->
    <div class="user-button" @click="toggleMenu">
      <div class="user-avatar">
        {{ userInitial }}
      </div>
      <div class="user-info">
        <span class="user-nickname">{{ authStore.currentUser?.nickname || '사용자' }}</span>
        <span class="workspace-name">개인 워크스페이스</span>
      </div>
      <i class="pi pi-chevron-up expand-icon"></i>
    </div>

    <!-- 팝업 메뉴 -->
    <div v-if="isMenuOpen" class="user-popup-menu" ref="menuRef">
      <!-- 현재 워크스페이스 -->
      <div class="menu-section">
        <div class="section-label">{{ authStore.currentUser?.nickname || '사용자' }}</div>
        <div class="workspace-item active">
          <div class="workspace-avatar">{{ userInitial }}</div>
          <span>개인 워크스페이스</span>
          <i class="pi pi-check"></i>
        </div>
      </div>

      <div class="menu-divider"></div>

      <!-- 워크스페이스 관리 -->
      <div class="menu-section">
        <div class="menu-item" @click="handleAddWorkspace">
          <i class="pi pi-plus"></i>
          <span>워크스페이스 추가</span>
        </div>
      </div>

      <div class="menu-divider"></div>

      <!-- 설정 -->
      <div class="menu-section">
        <div class="menu-item" @click="handleOpenProfile">
          <i class="pi pi-user"></i>
          <span>내 정보</span>
        </div>
        <div class="menu-item" @click="toggleTheme">
          <i :class="uiStore.isDarkMode ? 'pi pi-sun' : 'pi pi-moon'"></i>
          <span>{{ uiStore.isDarkMode ? '라이트 모드' : '다크 모드' }}</span>
        </div>
      </div>

      <div class="menu-divider"></div>

      <!-- 로그아웃 -->
      <div class="menu-section">
        <div class="menu-item logout" @click="handleLogout">
          <i class="pi pi-sign-out"></i>
          <span>로그아웃</span>
        </div>
      </div>
    </div>

    <!-- 내 정보 모달 -->
    <ProfileModal v-model:visible="isProfileModalOpen" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { useUiStore } from '@/stores/uiStore'
import ProfileModal from '@/components/modals/ProfileModal.vue'

const router = useRouter()
const authStore = useAuthStore()
const uiStore = useUiStore()

const isMenuOpen = ref(false)
const isProfileModalOpen = ref(false)
const menuRef = ref(null)

const userInitial = computed(() => {
  const nickname = authStore.currentUser?.nickname || '사용자'
  return nickname.charAt(0).toUpperCase()
})

function toggleMenu() {
  isMenuOpen.value = !isMenuOpen.value
}

function closeMenu() {
  isMenuOpen.value = false
}

function handleOpenProfile() {
  isProfileModalOpen.value = true
  closeMenu()
}

function toggleTheme() {
  uiStore.toggleDarkMode()
  closeMenu()
}

function handleAddWorkspace() {
  // TODO: 워크스페이스 추가 기능
  alert('워크스페이스 기능은 준비 중입니다.')
  closeMenu()
}

async function handleLogout() {
  closeMenu()
  await authStore.logout()
  router.push('/')
}

// 외부 클릭 시 메뉴 닫기
function handleClickOutside(event) {
  const container = document.querySelector('.user-menu-container')
  if (container && !container.contains(event.target)) {
    closeMenu()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.user-menu-container {
  position: relative;
  border-top: 1px solid var(--surface-border);
}

.user-button {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.user-button:hover {
  background-color: var(--surface-hover);
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  background-color: var(--primary-color);
  color: var(--primary-color-text);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.875rem;
}

.user-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.user-nickname {
  font-weight: 600;
  font-size: 0.875rem;
  color: var(--text-color);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.workspace-name {
  font-size: 0.75rem;
  color: var(--text-color-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.expand-icon {
  color: var(--text-color-secondary);
  font-size: 0.75rem;
}

/* 팝업 메뉴 */
.user-popup-menu {
  position: absolute;
  bottom: 100%;
  left: 0;
  right: 0;
  margin-bottom: 4px;
  background-color: var(--surface-overlay);
  border: 1px solid var(--surface-border);
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  overflow: hidden;
}

.dark-mode .user-popup-menu {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
}

.menu-section {
  padding: 0.5rem;
}

.section-label {
  padding: 0.5rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-color-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.menu-divider {
  height: 1px;
  background-color: var(--surface-border);
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.625rem 0.75rem;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.15s;
  color: var(--text-color);
  font-size: 0.875rem;
  position: relative;
}

.menu-item:hover {
  background-color: var(--surface-hover);
}

.menu-item i {
  font-size: 1rem;
  color: var(--text-color-secondary);
  width: 1.25rem;
  text-align: center;
}

.menu-item .pi-check {
  margin-left: auto;
  color: var(--primary-color);
}

.menu-item.logout {
  color: var(--red-500);
}

.menu-item.logout i {
  color: var(--red-500);
}

/* 워크스페이스 아이템 */
.workspace-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.625rem 0.75rem;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.15s;
  color: var(--text-color);
  font-size: 0.875rem;
}

.workspace-item:hover {
  background-color: var(--surface-hover);
}

.workspace-item.active {
  background-color: var(--surface-hover);
}

.workspace-item .pi-check {
  margin-left: auto;
  color: var(--primary-color);
}

.workspace-avatar {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  background-color: var(--primary-color);
  color: var(--primary-color-text);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.75rem;
}
</style>
