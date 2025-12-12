<template>
  <div class="user-menu-container">
    <!-- 사용자 버튼 -->
    <div class="user-button" @click="toggleMenu">
      <div class="user-avatar">
        {{ userInitial }}
      </div>
      <div class="user-info">
        <span class="user-nickname">{{ authStore.currentUser?.nickname || '사용자' }}</span>
        <span class="workspace-name">{{ currentWorkspaceName }}</span>
      </div>
      <i class="pi pi-chevron-up expand-icon"></i>
    </div>

    <!-- 팝업 메뉴 -->
    <div v-if="isMenuOpen" class="user-popup-menu" ref="menuRef">
      <!-- 워크스페이스 목록 -->
      <div class="menu-section">
        <div class="section-label">워크스페이스</div>
        <div v-for="workspace in workspaceStore.workspaces" :key="workspace.workspaceId" class="workspace-item"
          :class="{ active: workspace.workspaceId === workspaceStore.currentWorkspaceId }"
          @click="handleSelectWorkspace(workspace.workspaceId)">
          <div class="workspace-avatar" :class="{ 'team-workspace': isTeamWorkspace(workspace) }">
            <i :class="isTeamWorkspace(workspace) ? 'pi pi-users' : 'pi pi-user'"></i>
          </div>
          <div class="workspace-item-info">
            <span class="workspace-item-name">{{ workspace.name }}</span>
            <span v-if="isTeamWorkspace(workspace)" class="workspace-member-count">{{ workspace.memberCount }}명</span>
          </div>
          <i v-if="workspace.workspaceId === workspaceStore.currentWorkspaceId" class="pi pi-check"></i>
        </div>
      </div>

      <div class="menu-divider"></div>

      <!-- 워크스페이스 관리 -->
      <div class="menu-section">
        <div class="menu-item" @click="handleAddWorkspace">
          <i class="pi pi-plus"></i>
          <span>워크스페이스 추가</span>
        </div>
        <div class="menu-item" @click="handleManageWorkspace" v-if="workspaceStore.currentWorkspace">
          <i class="pi pi-cog"></i>
          <span>워크스페이스 설정</span>
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

    <!-- 워크스페이스 추가 모달 -->
    <Dialog v-model:visible="isAddWorkspaceModalOpen" header="워크스페이스 추가" :style="{ width: '400px' }" modal>
      <div class="workspace-form">
        <div class="field">
          <label for="workspaceName">이름</label>
          <InputText id="workspaceName" v-model="newWorkspaceName" placeholder="워크스페이스 이름" class="w-full" />
        </div>
        <div class="field">
          <label for="workspaceDesc">설명 (선택)</label>
          <InputText id="workspaceDesc" v-model="newWorkspaceDesc" placeholder="워크스페이스 설명" class="w-full" />
        </div>
      </div>
      <template #footer>
        <Button label="취소" severity="secondary" text @click="isAddWorkspaceModalOpen = false" />
        <Button label="생성" @click="handleCreateWorkspace" :loading="isCreating" />
      </template>
    </Dialog>

    <!-- 워크스페이스 설정 모달 (탭) -->
    <Dialog v-model:visible="isSettingsModalOpen" header="워크스페이스 설정" :style="{ width: '550px' }" modal :closable="true">
      <TabView v-model:activeIndex="activeTabIndex">
        <!-- 일반 탭 -->
        <TabPanel header="일반">
          <div class="tab-content">
            <div class="field">
              <label for="editWorkspaceName">이름</label>
              <InputText id="editWorkspaceName" v-model="editWorkspaceName" placeholder="워크스페이스 이름" class="w-full"
                :disabled="!workspaceStore.isAdmin" />
            </div>
            <div class="field">
              <label for="editWorkspaceDesc">설명</label>
              <InputText id="editWorkspaceDesc" v-model="editWorkspaceDesc" placeholder="워크스페이스 설명" class="w-full"
                :disabled="!workspaceStore.isAdmin" />
            </div>

            <div class="workspace-info">
              <div class="info-item">
                <span class="info-label">내 역할</span>
                <span class="info-value">{{ getRoleLabel(workspaceStore.myRole) }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">멤버 수</span>
                <span class="info-value">{{ workspaceStore.currentWorkspace?.memberCount || 1 }}명</span>
              </div>
              <div class="info-item">
                <span class="info-label">생성일</span>
                <span class="info-value">{{ formatDate(workspaceStore.currentWorkspace?.createdAt) }}</span>
              </div>
            </div>

            <div class="tab-actions">
              <Button label="저장" @click="handleUpdateWorkspace" :loading="isUpdating"
                :disabled="!workspaceStore.isAdmin" />
            </div>

            <!-- 워크스페이스 삭제/나가기 -->
            <div class="danger-zone" v-if="workspaceStore.isOwner">
              <div class="danger-item">
                <div class="danger-text">
                  <strong>워크스페이스 삭제</strong>
                  <p>이 워크스페이스와 모든 데이터가 영구적으로 삭제됩니다.</p>
                </div>
                <Button label="삭제" severity="danger" size="small" @click="confirmDeleteWorkspace" />
              </div>
            </div>

            <div class="danger-zone" v-else>
              <div class="danger-item">
                <div class="danger-text">
                  <strong>워크스페이스 나가기</strong>
                  <p>다시 참여하려면 초대를 받아야 합니다.</p>
                </div>
                <Button label="나가기" severity="warning" size="small" @click="confirmLeaveWorkspace" />
              </div>
            </div>
          </div>
        </TabPanel>

        <!-- 멤버 탭 -->
        <TabPanel header="멤버">
          <div class="tab-content">
            <!-- 멤버 초대 (ADMIN 이상) -->
            <div class="invite-section" v-if="workspaceStore.isAdmin">
              <div class="invite-form">
                <div class="search-container">
                  <InputText v-model="searchEmail" placeholder="이메일로 검색..." class="search-input"
                    @input="handleSearchInput" @focus="showSearchResults = true" />
                  <Dropdown v-model="inviteRole" :options="availableRoles" optionLabel="label" optionValue="value"
                    class="invite-role-select" />
                </div>
                <!-- 검색 결과 드롭다운 -->
                <div
                  v-if="showSearchResults && (searchResults.length > 0 || isSearching || (searchEmail.length >= 3 && !isSearching))"
                  class="search-results">
                  <div v-if="isSearching" class="search-loading">
                    <i class="pi pi-spin pi-spinner"></i> 검색 중...
                  </div>
                  <template v-else>
                    <div v-for="user in searchResults" :key="user.userId" class="search-result-item">
                      <div class="result-avatar">{{ user.nickname?.charAt(0) || user.email.charAt(0) }}</div>
                      <div class="result-info">
                        <span class="result-name">{{ user.nickname || '사용자' }}</span>
                        <span class="result-email">{{ user.email }}</span>
                      </div>
                      <Button label="초대" size="small" @click="handleInviteUser(user)"
                        :loading="invitingUserId === user.userId" />
                    </div>
                    <div v-if="searchResults.length === 0 && searchEmail.length >= 3" class="search-empty">
                      검색 결과가 없습니다.
                    </div>
                  </template>
                </div>
              </div>
            </div>

            <!-- 멤버 목록 -->
            <div class="member-list">
              <div class="member-list-header">
                <span>멤버 ({{ members.length }}명)</span>
              </div>


              <div v-if="members.length === 0" class="empty-members">
                멤버가 없습니다.
              </div>

              <div v-else class="member-items">
                <div v-for="member in members" :key="member.memberId" class="member-item">
                  <div class="member-avatar">{{ getMemberInitial(member) }}</div>
                  <div class="member-info">
                    <span class="member-name">{{ member.nickname || member.email }}</span>
                    <span class="member-email">{{ member.email }}</span>
                  </div>
                  <div class="member-role">
                    <Dropdown v-if="canChangeRole(member)" :modelValue="member.role"
                      @update:modelValue="(val) => handleUpdateRole(member, val)"
                      :options="getAvailableRolesForMember(member)" optionLabel="label" optionValue="value"
                      class="role-dropdown" />
                    <span v-else class="role-badge">{{ getRoleLabel(member.role) }}</span>
                  </div>
                  <Button v-if="canRemoveMember(member)" icon="pi pi-times" severity="danger" text rounded
                    @click="handleRemoveMember(member)" />
                </div>
              </div>
            </div>
          </div>
        </TabPanel>
      </TabView>
    </Dialog>

    <!-- 삭제 확인 다이얼로그 -->
    <Dialog v-model:visible="isDeleteConfirmOpen" header="워크스페이스 삭제" :style="{ width: '450px' }" modal>
      <div class="confirm-content">
        <i class="pi pi-exclamation-triangle" style="font-size: 2rem; color: var(--red-500);"></i>
        <p>정말로 <strong>{{ workspaceStore.currentWorkspace?.name }}</strong> 워크스페이스를 삭제하시겠습니까?</p>
        <div class="confirm-input">
          <label>확인을 위해 워크스페이스 이름 입력</label>
          <InputText v-model="deleteConfirmName" :placeholder="workspaceStore.currentWorkspace?.name" class="w-full" />
        </div>
      </div>
      <template #footer>
        <Button label="취소" severity="secondary" text @click="isDeleteConfirmOpen = false" />
        <Button label="삭제" severity="danger" @click="handleDeleteWorkspace" :loading="isDeleting"
          :disabled="deleteConfirmName !== workspaceStore.currentWorkspace?.name" />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { useUiStore } from '@/stores/uiStore'
import { useWorkspaceStore } from '@/stores/workspaceStore'
import { useFolderStore } from '@/stores/folderStore'
import { usePostStore } from '@/stores/postStore'
import { userApi } from '@/api/userApi'
import ProfileModal from '@/components/modals/ProfileModal.vue'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import TabView from 'primevue/tabview'
import TabPanel from 'primevue/tabpanel'
import Dropdown from 'primevue/dropdown'

const router = useRouter()
const authStore = useAuthStore()
const uiStore = useUiStore()
const workspaceStore = useWorkspaceStore()
const folderStore = useFolderStore()
const postStore = usePostStore()

const isMenuOpen = ref(false)
const isProfileModalOpen = ref(false)
const isAddWorkspaceModalOpen = ref(false)
const isSettingsModalOpen = ref(false)
const isDeleteConfirmOpen = ref(false)
const menuRef = ref(null)
const activeTabIndex = ref(0)

// 워크스페이스 생성 폼
const newWorkspaceName = ref('')
const newWorkspaceDesc = ref('')
const isCreating = ref(false)

// 워크스페이스 수정 폼
const editWorkspaceName = ref('')
const editWorkspaceDesc = ref('')
const isUpdating = ref(false)

// 워크스페이스 삭제
const deleteConfirmName = ref('')
const isDeleting = ref(false)

// 멤버 관리
const members = ref([])
const isLoadingMembers = ref(false)
const isInviting = ref(false)

// 사용자 검색
const searchEmail = ref('')
const searchResults = ref([])
const isSearching = ref(false)
const showSearchResults = ref(false)
const inviteRole = ref('MEMBER')
const invitingUserId = ref(null)
let searchTimeout = null

// 권한 옵션
const availableRoles = [
  { label: '관리자', value: 'ADMIN' },
  { label: '멤버', value: 'MEMBER' },
  { label: '뷰어', value: 'VIEWER' }
]

const userInitial = computed(() => {
  const nickname = authStore.currentUser?.nickname || '사용자'
  return nickname.charAt(0).toUpperCase()
})

const currentWorkspaceName = computed(() => {
  return workspaceStore.currentWorkspace?.name || '워크스페이스 선택'
})

function isTeamWorkspace(workspace) {
  return workspace.memberCount && workspace.memberCount > 1
}

function getWorkspaceInitial(name) {
  return name?.charAt(0).toUpperCase() || 'W'
}

function getMemberInitial(member) {
  const name = member.nickname || member.email || '?'
  return name.charAt(0).toUpperCase()
}

function getRoleLabel(role) {
  const labels = {
    'OWNER': '소유자',
    'ADMIN': '관리자',
    'MEMBER': '멤버',
    'VIEWER': '뷰어'
  }
  return labels[role] || role
}

function formatDate(dateString) {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

function canChangeRole(member) {
  if (member.role === 'OWNER') return false
  if (member.userId === authStore.userId) return false
  return workspaceStore.isAdmin
}

function canRemoveMember(member) {
  if (member.role === 'OWNER') return false
  if (member.userId === authStore.userId) return false
  return workspaceStore.isAdmin
}

function getAvailableRolesForMember(member) {
  return availableRoles
}

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

// 워크스페이스 선택
async function handleSelectWorkspace(workspaceId) {
  if (workspaceStore.currentWorkspaceId === workspaceId) {
    closeMenu()
    return
  }

  workspaceStore.selectWorkspace(workspaceId)

  folderStore.clearFolderData()
  postStore.clearPostData()

  await Promise.all([
    folderStore.loadAllFolders(),
    postStore.fetchPosts()
  ])

  folderStore.updateFolderTree()
  closeMenu()
}

// 워크스페이스 추가 모달 열기
function handleAddWorkspace() {
  newWorkspaceName.value = ''
  newWorkspaceDesc.value = ''
  isAddWorkspaceModalOpen.value = true
  closeMenu()
}

// 워크스페이스 생성
async function handleCreateWorkspace() {
  if (!newWorkspaceName.value.trim()) {
    return
  }

  try {
    isCreating.value = true
    const workspace = await workspaceStore.createWorkspace({
      name: newWorkspaceName.value.trim(),
      description: newWorkspaceDesc.value.trim() || null
    })

    await handleSelectWorkspace(workspace.workspaceId)
    isAddWorkspaceModalOpen.value = false
  } catch (error) {
    console.error('Failed to create workspace:', error)
    alert('워크스페이스 생성에 실패했습니다.')
  } finally {
    isCreating.value = false
  }
}

// 워크스페이스 설정 모달 열기
async function handleManageWorkspace() {
  const workspace = workspaceStore.currentWorkspace
  if (workspace) {
    editWorkspaceName.value = workspace.name || ''
    editWorkspaceDesc.value = workspace.description || ''
  }
  activeTabIndex.value = 0
  isSettingsModalOpen.value = true
  closeMenu()

  // 초기화
  searchEmail.value = ''
  searchResults.value = []
  showSearchResults.value = false

  await loadMembers()
}

// 멤버 목록 로드
async function loadMembers() {
  if (!workspaceStore.currentWorkspaceId) return

  try {
    isLoadingMembers.value = true
    const data = await workspaceStore.loadMembers(workspaceStore.currentWorkspaceId)
    members.value = data
  } catch (error) {
    console.error('Failed to load members:', error)
  } finally {
    isLoadingMembers.value = false
  }
}

// 워크스페이스 수정
async function handleUpdateWorkspace() {
  if (!editWorkspaceName.value.trim()) {
    return
  }

  try {
    isUpdating.value = true
    await workspaceStore.updateWorkspace(workspaceStore.currentWorkspaceId, {
      name: editWorkspaceName.value.trim(),
      description: editWorkspaceDesc.value.trim() || null
    })
    alert('저장되었습니다.')
  } catch (error) {
    console.error('Failed to update workspace:', error)
    alert('워크스페이스 수정에 실패했습니다.')
  } finally {
    isUpdating.value = false
  }
}

// 사용자 검색
function handleSearchInput() {
  showSearchResults.value = true

  // 디바운스
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }

  if (searchEmail.value.length < 3) {
    searchResults.value = []
    return
  }

  searchTimeout = setTimeout(async () => {
    try {
      isSearching.value = true
      const response = await userApi.searchUsers(searchEmail.value)

      // 이미 멤버인 사용자 제외
      const memberIds = members.value.map(m => m.userId)
      searchResults.value = response.data.filter(user => !memberIds.includes(user.userId))
    } catch (error) {
      console.error('Failed to search users:', error)
      searchResults.value = []
    } finally {
      isSearching.value = false
    }
  }, 300)
}

// 검색 결과에서 바로 초대
async function handleInviteUser(user) {
  try {
    invitingUserId.value = user.userId
    await workspaceStore.inviteMember(
      workspaceStore.currentWorkspaceId,
      user.email,
      inviteRole.value
    )

    // 검색 결과에서 제거
    searchResults.value = searchResults.value.filter(u => u.userId !== user.userId)

    await loadMembers()
    await workspaceStore.loadWorkspaces()

    alert(`${user.nickname || user.email}님을 초대했습니다.`)
  } catch (error) {
    console.error('Failed to invite member:', error)
    alert('멤버 초대에 실패했습니다.')
  } finally {
    invitingUserId.value = null
  }
}


// 멤버 권한 변경
async function handleUpdateRole(member, newRole) {
  try {
    await workspaceStore.updateMemberRole(
      workspaceStore.currentWorkspaceId,
      member.memberId,
      newRole
    )
    await loadMembers()
  } catch (error) {
    console.error('Failed to update role:', error)
    alert('권한 변경에 실패했습니다.')
  }
}

// 멤버 제거
async function handleRemoveMember(member) {
  if (!confirm(`${member.nickname || member.email}님을 제거하시겠습니까?`)) {
    return
  }

  try {
    await workspaceStore.removeMember(
      workspaceStore.currentWorkspaceId,
      member.memberId
    )
    await loadMembers()

    // 워크스페이스 목록 갱신 (멤버 수 업데이트)
    await workspaceStore.loadWorkspaces()
  } catch (error) {
    console.error('Failed to remove member:', error)
    alert('멤버 제거에 실패했습니다.')
  }
}

// 워크스페이스 삭제 확인
function confirmDeleteWorkspace() {
  deleteConfirmName.value = ''
  isDeleteConfirmOpen.value = true
}

// 워크스페이스 삭제
async function handleDeleteWorkspace() {
  if (deleteConfirmName.value !== workspaceStore.currentWorkspace?.name) {
    return
  }

  try {
    isDeleting.value = true
    await workspaceStore.deleteWorkspace(workspaceStore.currentWorkspaceId)

    isDeleteConfirmOpen.value = false
    isSettingsModalOpen.value = false

    if (workspaceStore.workspaces.length > 0) {
      await handleSelectWorkspace(workspaceStore.workspaces[0].workspaceId)
    }
  } catch (error) {
    console.error('Failed to delete workspace:', error)
    alert('워크스페이스 삭제에 실패했습니다.')
  } finally {
    isDeleting.value = false
  }
}

// 워크스페이스 나가기 확인
async function confirmLeaveWorkspace() {
  if (!confirm('정말로 이 워크스페이스를 나가시겠습니까?')) {
    return
  }

  try {
    await workspaceStore.leaveWorkspace(workspaceStore.currentWorkspaceId)

    isSettingsModalOpen.value = false

    if (workspaceStore.workspaces.length > 0) {
      await handleSelectWorkspace(workspaceStore.workspaces[0].workspaceId)
    }
  } catch (error) {
    console.error('Failed to leave workspace:', error)
    alert('워크스페이스 나가기에 실패했습니다.')
  }
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

  // 검색 결과 닫기
  const searchContainer = document.querySelector('.search-container')
  if (searchContainer && !searchContainer.contains(event.target)) {
    showSearchResults.value = false
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
  max-height: 400px;
  overflow-y: auto;
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

.workspace-avatar i {
  font-size: 0.75rem;
}

.workspace-item-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.workspace-item-name {
  font-size: 0.875rem;
  color: var(--text-color);
}

.workspace-member-count {
  font-size: 0.7rem;
  color: var(--text-color-secondary);
}

/* 워크스페이스 폼 */
.workspace-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.workspace-form .field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.workspace-form label {
  font-weight: 500;
  font-size: 0.875rem;
  color: var(--text-color);
}

/* 탭 콘텐츠 */
.tab-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 0.5rem 0;
}

.tab-content .field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.tab-content label {
  font-weight: 500;
  font-size: 0.875rem;
  color: var(--text-color);
}

.tab-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 0.5rem;
}

/* 워크스페이스 정보 */
.workspace-info {
  background-color: var(--surface-ground);
  border-radius: 8px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.info-label {
  font-size: 0.875rem;
  color: var(--text-color-secondary);
}

.info-value {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-color);
}

/* 멤버 초대 */
.invite-section {
  background-color: var(--surface-ground);
  border-radius: 8px;
  padding: 1rem;
}

.invite-label {
  display: block;
  font-weight: 500;
  font-size: 0.875rem;
  color: var(--text-color);
  margin-bottom: 0.75rem;
}

.invite-form {
  position: relative;
}

.search-container {
  display: flex;
  gap: 0.5rem;
}

.search-input {
  flex: 1;
}

.invite-role-select {
  width: 100px;
}

.search-results {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background-color: var(--surface-overlay);
  border: 1px solid var(--surface-border);
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 100;
  max-height: 200px;
  overflow-y: auto;
  margin-top: 4px;
}

.search-loading,
.search-empty {
  padding: 1rem;
  text-align: center;
  color: var(--text-color-secondary);
  font-size: 0.875rem;
}

.search-result-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  cursor: pointer;
  transition: background-color 0.15s;
}

.search-result-item:hover {
  background-color: var(--surface-hover);
}

.result-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: var(--primary-color);
  color: var(--primary-color-text);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.875rem;
}

.result-info {
  flex: 1;
  min-width: 0;
}

.result-name {
  display: block;
  font-weight: 500;
  font-size: 0.875rem;
  color: var(--text-color);
}

.result-email {
  display: block;
  font-size: 0.75rem;
  color: var(--text-color-secondary);
}

/* 선택된 사용자 */
.selected-user {
  margin-top: 1rem;
  padding: 0.75rem;
  background-color: var(--surface-card);
  border: 1px solid var(--surface-border);
  border-radius: 6px;
}

.selected-user-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.selected-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: var(--primary-color);
  color: var(--primary-color-text);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.875rem;
}

.selected-details {
  flex: 1;
  min-width: 0;
}

.selected-name {
  display: block;
  font-weight: 500;
  font-size: 0.875rem;
  color: var(--text-color);
}

.selected-email {
  display: block;
  font-size: 0.75rem;
  color: var(--text-color-secondary);
}

.invite-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.75rem;
  justify-content: flex-end;
}

.invite-role {
  width: 100px;
}

/* 멤버 목록 */
.member-list {
  border: 1px solid var(--surface-border);
  border-radius: 8px;
  overflow: hidden;
}

.member-list-header {
  padding: 0.75rem 1rem;
  background-color: var(--surface-ground);
  font-weight: 600;
  font-size: 0.875rem;
  border-bottom: 1px solid var(--surface-border);
}

.loading-members,
.empty-members {
  padding: 2rem;
  text-align: center;
  color: var(--text-color-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.member-items {
  max-height: 250px;
  overflow-y: auto;
}

.member-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--surface-border);
}

.member-item:last-child {
  border-bottom: none;
}

.member-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: var(--primary-color);
  color: var(--primary-color-text);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.875rem;
}

.member-info {
  flex: 1;
  min-width: 0;
}

.member-name {
  display: block;
  font-weight: 500;
  font-size: 0.875rem;
  color: var(--text-color);
}

.member-email {
  display: block;
  font-size: 0.75rem;
  color: var(--text-color-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
}

.member-role {
  min-width: 90px;
}

.role-dropdown {
  width: 111px;
}

.role-badge {
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
  background-color: var(--surface-ground);
  border-radius: 4px;
  color: var(--text-color-secondary);
}

/* 위험 구역 */
.danger-zone {
  border: 1px solid var(--red-200);
  border-radius: 8px;
  padding: 1rem;
  margin-top: 0.5rem;
}

.dark-mode .danger-zone {
  border-color: var(--red-900);
}

.danger-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.danger-text {
  flex: 1;
}

.danger-text strong {
  font-size: 0.875rem;
  color: var(--text-color);
}

.danger-text p {
  font-size: 0.75rem;
  color: var(--text-color-secondary);
  margin: 0.25rem 0 0 0;
}

/* 삭제 확인 */
.confirm-content {
  text-align: center;
  padding: 1rem 0;
}

.confirm-content p {
  margin: 1rem 0;
  color: var(--text-color);
}

.confirm-input {
  text-align: left;
  margin-top: 1.5rem;
}

.confirm-input label {
  display: block;
  font-size: 0.875rem;
  color: var(--text-color-secondary);
  margin-bottom: 0.5rem;
}
</style>
