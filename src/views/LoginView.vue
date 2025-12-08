<template>

  <div class="login-view">
    <!-- <h2>Astarchia</h2> -->
    <div class="login-container">
      <Card class="login-card">
        <template #title>
          <div class="login-title">
            <!-- <h2>Astarchia</h2> -->
            <p>로그인</p>
          </div>
        </template>

        <template #content>
          <form @submit.prevent="handleLogin" class="login-form">
            <div class="field">
              <InputText id="loginId" v-model="loginId" type="loginId" placeholder="아이디" required autofocus />
            </div>

            <div class="field">
              <Password id="password" v-model="password" placeholder="비밀번호" :feedback="false" required />
            </div>
            <div class="loginBtn">
              <Button type="submit" label="로그인" icon="pi pi-sign-in" severity="primary" :loading="isLoading"
                class="w-full" />
            </div>
          </form>
        </template>
      </Card>
      <div class="register-link">
        <span>계정이 없으신가요?</span>
        <router-link to="/register">회원가입</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import Card from 'primevue/card'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Button from 'primevue/button'
import { useAuthStore } from '@/stores/authStore'
import { TOAST_MESSAGES } from '@/utils/constants'
import { getErrorMessage } from '@/utils/helpers'

const router = useRouter()
const toast = useToast()
const authStore = useAuthStore()

const loginId = ref('')
const password = ref('')
const isLoading = ref(false)

async function handleLogin() {
  if (!loginId.value || !password.value) {
    toast.add({
      severity: 'warn',
      summary: '입력 오류',
      detail: '아이디와 비밀번호를 입력해주세요.',
      life: 3000,
    })
    return
  }

  isLoading.value = true

  try {
    await authStore.login(loginId.value, password.value)

    toast.add({
      severity: 'success',
      summary: '로그인 성공',
      detail: TOAST_MESSAGES.SUCCESS.LOGIN_SUCCESS,
      life: 3000,
    })

    router.push('/main')
  } catch (error) {
    console.error('Login error:', error)

    toast.add({
      severity: 'error',
      summary: '로그인 실패',
      detail: getErrorMessage(error),
      life: 3000,
    })
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.login-card {
  border-radius: 5px;
}

.login-card :deep(.p-card-body) {
  padding: 2.5rem 1.5rem 4.5rem 1.5rem;
}

.login-card :deep(.p-card-title) {
  padding: 0;
  margin-bottom: 1.5rem;
}

.login-view {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: var(--surface-ground);
  transition: background var(--transition-duration);
}

.login-container {
  width: 100%;
  max-width: 500px;
  padding: 2rem;
}

.login-title {
  margin: 0;
  padding: 0;
}

.login-title h2 {
  margin: 0;
  color: var(--primary-color);
  font-size: 2rem;
}

.login-title p {
  margin: 0;
  /* 중복 제거하고 이것만 유지 */
  color: var(--text-color-secondary);
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.field label {
  font-weight: 600;
}

.field :deep(.p-password) {
  width: 100%;
}

.field :deep(.p-password input) {
  width: 100%;
}

.loginBtn {
  margin-top: 2.25rem;
}

.register-link {
  text-align: center;
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  align-items: center;
  color: var(--text-color-secondary);
  margin-top: 1.875rem;
}

.register-link a {
  color: var(--primary-color);
  text-decoration: none;
  font-weight: 600;
}

.register-link a:hover {
  text-decoration: underline;
}

.w-full {
  width: 100%;
}
</style>
