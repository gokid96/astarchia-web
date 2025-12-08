import apiClient from './axios'

// 백엔드 응답을 프론트엔드 형식으로 변환
function transformPost(post) {
  return {
    id: post.postId,
    title: post.title,
    content: post.content,
    summary: post.summary,
    thumbnailUrl: post.thumbnailUrl,
    slug: post.slug,
    status: post.status || 'DRAFT',
    visibility: post.visibility || 'PRIVATE',
    folderId: post.folderId || post.folder?.id,
    categoryId: post.categoryId || post.category?.id,
    seriesId: post.seriesId || post.series?.id,
    viewCount: post.viewCount || 0,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    // 추가 정보 (있으면 포함)
    author: post.author,
    category: post.category,
    series: post.series,
    folder: post.folder,
  }
}

export const postApi = {

  // 내 게시글 목록 조회 - /api/v1/posts/my (JWT 인증 사용)
  async getMyPosts(page = 0, size = 20) {
    const response = await apiClient.get('/posts/my', {
      params: { page, size },
    })
    // 응답 데이터 변환 (페이지네이션 응답)
    if (response.data.content) {
      response.data.content = response.data.content.map(transformPost)
    }
    return response
  },

  // ID로 게시글 조회 - /api/v1/posts/id/{postId}
  async getPostById(postId) {
    const response = await apiClient.get(`/posts/id/${postId}`)
    response.data = transformPost(response.data)
    return response
  },

  // 게시글 생성 - /api/v1/posts (JWT 인증 사용)
  async createPost(data) {
    console.log('postApi.createPost - Sending to backend:', JSON.stringify(data, null, 2))
    const response = await apiClient.post('/posts', data)
    console.log('postApi.createPost - Backend response:', JSON.stringify(response.data, null, 2))
    response.data = transformPost(response.data)
    return response
  },

  // 게시글 수정 - /api/v1/posts/{postId} (JWT 인증 사용)
  async updatePost(postId, data) {
    console.log('postApi.updatePost - Updating postId:', postId, 'with data:', JSON.stringify(data, null, 2))
    const response = await apiClient.patch(`/posts/${postId}`, data)
    console.log('postApi.updatePost - Backend response:', JSON.stringify(response.data, null, 2))
    response.data = transformPost(response.data)
    return response
  },

  // 게시글 삭제 - /api/v1/posts/{postId} (JWT 인증 사용)
  deletePost(postId) {
    return apiClient.delete(`/posts/${postId}`)
  },

  // 게시글 폴더 이동 - /api/v1/posts/{postId}/move (JWT 인증 사용)
  async movePost(postId, folderId) {
    console.log('postApi.movePost - Moving postId:', postId, 'to folderId:', folderId)
    const response = await apiClient.patch(`/posts/${postId}/move`, { folderId })
    console.log('postApi.movePost - Backend response:', JSON.stringify(response.data, null, 2))
    response.data = transformPost(response.data)
    return response
  },
}

export default postApi
