import { Problem, ChatRequest, Category, Collection } from '@/types';
import { authService } from '@/lib/auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:32122';

// 获取认证token
function getAuthToken(): string | null {
  return authService.getToken();
}

export async function getProblems(subject: string, chapterNum?: string, sectionNum?: string): Promise<{ problems: string[] }> {
  const params = new URLSearchParams({ subject });

  if (chapterNum) {
    params.append('chapter', chapterNum);
  }

  if (sectionNum) {
    params.append('section', sectionNum);
  }

  const response = await fetch(`${API_BASE_URL}/api/v1/problems?${params}`);
  if (!response.ok) {
    throw new Error('Failed to fetch problems');
  }
  return response.json();
}

export async function getProblem(id: string): Promise<Problem> {
  const response = await fetch(`${API_BASE_URL}/api/v1/problem/${id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch problem');
  }
  return response.json();
}

export async function deleteProblem(id: string): Promise<{ message: string; problem_id: string }> {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}/api/v1/admin/problem/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete problem');
  }

  return response.json();
}

export async function chatWithAI(id: string, messages: ChatRequest['messages']): Promise<ReadableStream> {
  const response = await fetch(`${API_BASE_URL}/api/v1/problem_chat/${id}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ messages }),
  });

  if (!response.ok) {
    throw new Error('Failed to start chat');
  }

  return response.body!;
}

// 管理员登录已移除，使用统一的用户登录系统
// 管理员操作通过普通登录后检查权限决定

// 上传题目图片
export async function uploadImage(data: {
  image: File;
  origin?: string;
  collections?: string[];
}): Promise<any> {
  const token = getAuthToken();
  const formData = new FormData();
  formData.append('image', data.image);
  if (data.origin) {
    formData.append('origin', data.origin);
  }
  if (data.collections && data.collections.length > 0) {
    data.collections.forEach(colId => {
      formData.append('collections[]', colId);
    });
  }

  // 创建带超时的 AbortController
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 310000); // 增加超时时间到310秒

  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/admin/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '上传失败');
    }

    return response.json();
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('请求超时：图片处理时间过长，请检查网络连接或尝试减少图片数量');
    }
    if (err.message.includes('CORS') || err.message.includes('Cross-Origin')) {
      throw new Error('跨域请求被阻止：请检查服务器CORS配置');
    }
    throw err;
  }
}

// 批量上传图片（一个图片可能返回多个题目）
export async function uploadImageBatch(data: {
  image: File;
  origin?: string;
  collections?: string[];
}): Promise<{
  results: Array<{
    id: string;
    statement: string;
    solution: string;
    subject: string;
    section: string;
    origin: string;
    difficulty: number;
  }>;
  errors?: string[];
}> {
  const token = getAuthToken();
  const formData = new FormData();
  formData.append('image', data.image);
  if (data.origin) {
    formData.append('origin', data.origin);
  }
  if (data.collections && data.collections.length > 0) {
    data.collections.forEach(colId => {
      formData.append('collections[]', colId);
    });
  }

  // 创建带超时的 AbortController
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 310000); // 增加超时时间到310秒

  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/admin/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '上传失败');
    }

    return response.json();
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('请求超时：图片处理时间过长，请检查网络连接或尝试减少图片数量');
    }
    if (err.message.includes('CORS') || err.message.includes('Cross-Origin')) {
      throw new Error('跨域请求被阻止：请检查服务器CORS配置');
    }
    throw err;
  }
}

// 批量上传多张图片并一次性处理
export async function uploadImagesBatch(data: {
  images: File[];
  origin?: string;
  collections?: string[];
}): Promise<{
  results: Array<{
    id: string;
    statement: string;
    solution: string;
    subject: string;
    section: string;
    origin: string;
    difficulty: number;
   }>;
  errors?: string[];
}> {
  const token = getAuthToken();
  const formData = new FormData();

  // 添加所有图片
  data.images.forEach((image, index) => {
    formData.append('images', image);
  });

  if (data.origin) {
    formData.append('origin', data.origin);
  }

  if (data.collections && data.collections.length > 0) {
    data.collections.forEach(colId => {
      formData.append('collections[]', colId);
    });
  }

  // 创建带超时的 AbortController
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 310000); // 增加超时时间到310秒，支持GLM API处理

  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/admin/upload/batch`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
      signal: controller.signal, // 关联超时控制
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const error = await response.json();
      // 提供更详细的错误信息
      const errorMsg = error.error || `HTTP ${response.status}: ${response.statusText}`;
      throw new Error(`批量上传失败: ${errorMsg}`);
    }

    return response.json();
  } catch (err: any) {
    clearTimeout(timeoutId);
    // 区分超时错误和其他错误
    if (err.name === 'AbortError') {
      throw new Error('请求超时：图片处理时间过长，请检查网络连接或尝试减少图片数量');
    }
    // 区分真正的CORS错误
    if (err.message.includes('CORS') || err.message.includes('Cross-Origin')) {
      throw new Error('跨域请求被阻止：请检查服务器CORS配置');
    }
    throw err;
  }
}

// ================== 分类相关API ==================

// 获取所有分类
export async function getCategories(): Promise<Category[]> {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}/api/v1/categories`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    throw new Error('Failed to fetch categories');
  }
  return response.json();
}

// 获取分类树
export async function getCategoryTree(): Promise<Category[]> {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}/api/v1/categories/tree`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    throw new Error('Failed to fetch category tree');
  }
  return response.json();
}

// 创建分类
export async function createCategory(data: {
  name: string;
  parent_id?: string;
  description?: string;
}): Promise<Category> {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}/api/v1/category`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || '创建分类失败');
  }

  return response.json();
}

// 更新分类
export async function updateCategory(id: string, data: {
  name?: string;
  parent_id?: string;
  description?: string;
}): Promise<Category> {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}/api/v1/category/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || '更新分类失败');
  }

  return response.json();
}

// 删除分类
export async function deleteCategory(id: string): Promise<{ message: string }> {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}/api/v1/category/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || '删除分类失败');
  }

  return response.json();
}

// ================== 习题集相关API ==================

// 获取所有习题集
export async function getCollections(): Promise<Collection[]> {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}/api/v1/collections`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    throw new Error('Failed to fetch collections');
  }
  return response.json();
}

// 获取包含题目详情的习题集
export async function getCollectionsWithProblems(): Promise<Collection[]> {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}/api/v1/collections/with-problems`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    throw new Error('Failed to fetch collections');
  }
  return response.json();
}

// 创建习题集
export async function createCollection(data: {
  name: string;
  description?: string;
  problem_ids?: string[];
  category_ids?: string[];
}): Promise<Collection> {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}/api/v1/collection`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || '创建习题集失败');
  }

  return response.json();
}

// 更新习题集
export async function updateCollection(id: string, data: {
  name?: string;
  description?: string;
  problem_ids?: string[];
  category_ids?: string[];
}): Promise<Collection> {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}/api/v1/collection/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || '更新习题集失败');
  }

  return response.json();
}

// 删除习题集
export async function deleteCollection(id: string): Promise<{ message: string }> {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}/api/v1/collection/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || '删除习题集失败');
  }

  return response.json();
}

// 一键生成答案
export async function generateAnswers(model?: string): Promise<ReadableStream> {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}/api/v1/admin/generate-answers`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || '启动生成答案失败');
  }

  return response.body!;
}
