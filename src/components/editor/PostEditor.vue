<template>
  <div class="post-editor">
    <!-- 저장 상태 표시 -->
    <div class="editor-header">
      <div class="save-status">
        <template v-if="isSaving">
          <i class="pi pi-spin pi-spinner"></i>
          <span class="status-text">저장 중...</span>
        </template>
        <template v-else>
          <i class="pi pi-check"></i>
          <span class="status-text">저장됨</span>
        </template>
      </div>
    </div>

    <!-- 에디터 영역 -->
    <div class="editor-content">
      <div class="field">
        <InputText id="postTitle" v-model="formData.title" autofocus />
      </div>

      <div class="field">
        <Textarea id="postContent" v-model="formData.content" rows="20" autoResize />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import { debounce } from '@/utils/helpers'

const props = defineProps({
  post: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['save', 'cancel'])

const formData = ref({
  title: '',
  content: '',
  folderId: null,
})

const isEditMode = ref(false)
const isSaving = ref(false)

// 자동 저장 함수 (디바운스)
const autoSave = debounce(() => {
  if (!props.post?.id) {
    console.log('[PostEditor] No post ID, skipping auto-save')
    return
  }

  console.log('[PostEditor] Auto-saving...')
  isSaving.value = true

  const data = {
    id: props.post.id,
    title: formData.value.title.trim() || '무제',
    content: formData.value.content,
    folderId: formData.value.folderId,
    status: 'DRAFT',
    visibility: 'PRIVATE',
    silent: true, // 자동 저장은 조용히
  }

  emit('save', data)

  // 저장 완료 표시
  setTimeout(() => {
    isSaving.value = false
  }, 500)
}, 1000) // 1초 디바운스

// post가 변경될 때 폼 초기화
watch(
  () => props.post,
  (newPost) => {
    if (newPost && newPost.id) {
      // 기존 게시글 수정 모드
      isEditMode.value = true
      formData.value = {
        title: newPost.title || '무제',
        content: newPost.content || '',
        folderId: newPost.folderId || null,
      }
    } else if (newPost && newPost.folderId) {
      // 특정 폴더에 새 노트 생성
      isEditMode.value = false
      formData.value = {
        title: '무제',
        content: '',
        folderId: newPost.folderId,
      }
    } else {
      // 루트에 새 노트 생성
      isEditMode.value = false
      formData.value = {
        title: '무제',
        content: '',
        folderId: null,
      }
    }
  },
  { immediate: true }
)

// formData 변경 감지 - 자동 저장
watch(
  () => [formData.value.title, formData.value.content],
  () => {
    if (props.post?.id) {
      console.log('[PostEditor] Content changed, triggering auto-save')
      autoSave()
    }
  }
)

// 수동 저장 (필요시)
function handleSave() {
  if (!props.post?.id) {
    return
  }

  const data = {
    id: props.post.id,
    title: formData.value.title.trim() || '무제',
    content: formData.value.content,
    folderId: formData.value.folderId,
    status: 'DRAFT',
    visibility: 'PRIVATE',
  }

  emit('save', data)
}

function handleCancel() {
  emit('cancel')
}
</script>

<style scoped>
.post-editor {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: var(--surface-card);
}

/* 헤더 - 저장 상태 */
.editor-header {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding: 0.75rem 2rem;
  border-bottom: 1px solid var(--surface-border);
  min-height: 50px;
}

.save-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: var(--text-color-secondary);
}

.save-status i {
  font-size: 1rem;
}

.status-text {
  font-weight: 500;
}

/* 에디터 컨텐츠 영역 */
.editor-content {
  flex: 1;
  overflow-y: auto;
  padding: 3rem 4rem;
  max-width: 1500px;
  margin: 0 auto;
  width: 100%;
}

.field {
  margin-bottom: 1.5rem;
}

/* 제목 입력 - 테두리 제거 + 큰 폰트 */
#postTitle {
  border: none !important;
  outline: none !important;
  box-shadow: none !important;
  font-size: 2.5rem;
  font-weight: 700;
  padding: 0.5rem 0;
  background: transparent;
  width: 100%;
}

#postTitle:enabled:hover {
  border: none !important;
}

#postTitle:enabled:focus {
  border: none !important;
  outline: none !important;
  box-shadow: none !important;
}

#postTitle::placeholder {
  color: var(--text-color-secondary);
  opacity: 0.4;
}

/* 내용 입력 - 테두리 제거 + 가독성 좋은 폰트 */
#postContent {
  border: none !important;
  outline: none !important;
  box-shadow: none !important;
  font-size: 1.1rem;
  font-family: inherit;
  /* monospace 대신 일반 폰트 */
  line-height: 1.75;
  padding: 0.5rem 0;
  background: transparent;
  min-height: 500px;
  resize: none;
  width: 100%;
}

#postContent:enabled:hover {
  border: none !important;
}

#postContent:enabled:focus {
  border: none !important;
  outline: none !important;
  box-shadow: none !important;
}

#postContent::placeholder {
  color: var(--text-color-secondary);
  opacity: 0.4;
}

/* PrimeVue 기본 스타일 덮어쓰기 */
:deep(.p-inputtext) {
  border: none !important;
  outline: none !important;
  box-shadow: none !important;
  background: transparent !important;
}

:deep(.p-inputtext:enabled:hover) {
  border: none !important;
}

:deep(.p-inputtext:enabled:focus) {
  border: none !important;
  outline: none !important;
  box-shadow: none !important;
}

:deep(.p-inputtextarea) {
  border: none !important;
  outline: none !important;
  box-shadow: none !important;
  background: transparent !important;
}

:deep(.p-inputtextarea:enabled:hover) {
  border: none !important;
}

:deep(.p-inputtextarea:enabled:focus) {
  border: none !important;
  outline: none !important;
  box-shadow: none !important;
}
</style>
