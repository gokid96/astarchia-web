import apiClient from './axios'

// 백엔드 응답을 프론트엔드 형식으로 변환
function transformFolder(folder) {
  return {
    id: folder.folderId,
    name: folder.name,
    description: folder.description,
    parentId: folder.parentId,
    orderIndex: folder.orderIndex,
    postCount: folder.postCount || 0,
    childCount: folder.childCount || 0,
    createdAt: folder.createdAt,
    updatedAt: folder.updatedAt,
    children: folder.children || [],
    hasChildren: (folder.children?.length > 0) || (folder.childCount > 0) || false,
  }
}

export const folderApi = {
  // 루트 폴더 목록 조회 - /api/v1/folders (JWT 인증 사용)
  async getRootFolders() {
    const response = await apiClient.get('/folders')
    // 응답 데이터 변환
    response.data = response.data.map(transformFolder)
    return response
  },

  // 하위 폴더 목록 조회 - /api/v1/folders/{folderId}/children (JWT 인증 사용)
  async getChildFolders(folderId) {
    const response = await apiClient.get(`/folders/${folderId}/children`)
    // 응답 데이터 변환
    response.data = response.data.map(transformFolder)
    return response
  },

  // 폴더 생성 - /api/v1/folders (JWT 인증 사용)
  async createFolder(data) {
    const response = await apiClient.post('/folders', data)
    // 응답 데이터 변환
    response.data = transformFolder(response.data)
    return response
  },

  // 폴더 수정 - /api/v1/folders/{folderId} (JWT 인증 사용)
  async updateFolder(folderId, data) {
    const response = await apiClient.patch(`/folders/${folderId}`, data)
    // 응답 데이터 변환
    response.data = transformFolder(response.data)
    return response
  },

  // 폴더 이동 - /api/v1/folders/{folderId}/move (JWT 인증 사용)
  async moveFolder(folderId, data) {
    const response = await apiClient.patch(`/folders/${folderId}/move`, data)
    response.data = transformFolder(response.data)
    return response
  },

  // 폴더 삭제 - /api/v1/folders/{folderId} (JWT 인증 사용)
  deleteFolder(folderId) {
    return apiClient.delete(`/folders/${folderId}`)
  },
}

export default folderApi
