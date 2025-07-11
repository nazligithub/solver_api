const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000'

interface RequestOptions extends RequestInit {
  token?: string
}

export async function fetchAPI(endpoint: string, options: RequestOptions = {}) {
  const { token, ...fetchOptions } = options
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'x-user-id': 'admin', // Admin user ID
    ...options.headers,
  }
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...fetchOptions,
    headers,
  })
  
  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`)
  }
  
  return response.json()
}

// Hair Styles API
export const stylesAPI = {
  getAll: (gender?: string) => {
    const params = gender ? `?gender=${gender}` : ''
    return fetchAPI(`/api/admin/styles${params}`)
  },
  
  create: (data: any) => {
    return fetchAPI('/api/admin/styles', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },
  
  update: (id: string, data: any) => {
    return fetchAPI(`/api/admin/styles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },
  
  delete: (id: string) => {
    return fetchAPI(`/api/admin/styles/${id}`, {
      method: 'DELETE',
    })
  },
  
  createWithAI: (data: any) => {
    return fetchAPI('/api/admin/styles/create-with-ai', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },
  
  updateOrder: (items: { id: number; order: number }[]) => {
    return fetchAPI('/api/admin/styles/order', {
      method: 'PUT',
      body: JSON.stringify({ items }),
    })
  },
}

// Hair Colors API
export const colorsAPI = {
  getAll: (gender?: string) => {
    const params = gender ? `?gender=${gender}` : ''
    return fetchAPI(`/api/admin/colors${params}`)
  },
  
  create: (data: any) => {
    return fetchAPI('/api/admin/colors', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },
  
  update: (id: string, data: any) => {
    return fetchAPI(`/api/admin/colors/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },
  
  delete: (id: string) => {
    return fetchAPI(`/api/admin/colors/${id}`, {
      method: 'DELETE',
    })
  },
  
  updateOrder: (items: { id: number; order: number }[]) => {
    return fetchAPI('/api/admin/colors/order', {
      method: 'PUT',
      body: JSON.stringify({ items }),
    })
  },
}

// Processing History API
export const historyAPI = {
  getAll: (params?: { user_id?: string; process_type?: string; status?: string; limit?: number }) => {
    const queryParams = new URLSearchParams()
    if (params?.user_id) queryParams.append('user_id', params.user_id)
    if (params?.process_type) queryParams.append('process_type', params.process_type)
    if (params?.status) queryParams.append('status', params.status)
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    
    const query = queryParams.toString() ? `?${queryParams.toString()}` : ''
    return fetchAPI(`/api/admin/processing-history${query}`)
  },
}

// Face Analyses API
export const analysesAPI = {
  getAll: (params?: { user_id?: string; face_shape?: string; status?: string; limit?: number }) => {
    const queryParams = new URLSearchParams()
    if (params?.user_id) queryParams.append('user_id', params.user_id)
    if (params?.face_shape) queryParams.append('face_shape', params.face_shape)
    if (params?.status) queryParams.append('status', params.status)
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    
    const query = queryParams.toString() ? `?${queryParams.toString()}` : ''
    return fetchAPI(`/api/admin/face-analyses${query}`)
  },
  
  delete: (id: string) => {
    return fetchAPI(`/api/admin/face-analyses/${id}`, {
      method: 'DELETE',
    })
  },
}

// Conversations API
export const conversationsAPI = {
  getAll: () => {
    return fetchAPI('/api/admin/conversations')
  },
  
  getOne: (id: string) => {
    return fetchAPI(`/api/admin/conversations/${id}`)
  },
  
  delete: (id: string) => {
    return fetchAPI(`/api/admin/conversations/${id}`, {
      method: 'DELETE',
    })
  },
}

// Image Uploads API
export const uploadsAPI = {
  getAll: (user_id?: string) => {
    const params = user_id ? `?user_id=${user_id}` : ''
    return fetchAPI(`/api/admin/image-uploads${params}`)
  },
  
  delete: (id: string) => {
    return fetchAPI(`/api/admin/image-uploads/${id}`, {
      method: 'DELETE',
    })
  },
}

// Dashboard Stats API
export const dashboardAPI = {
  getStats: () => {
    return fetchAPI('/api/admin/dashboard-stats')
  },
}