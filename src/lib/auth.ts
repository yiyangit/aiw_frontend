const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:32122';

export interface User {
  id: string;
  username: string;
  email: string;
  role: number;
}

export interface AuthResponse {
  status: string;
  message: string;
  data: {
    token: string;
    user: User;
  };
}

export interface LoginInput {
  username: string;
  password: string;
}

export interface RegisterInput {
  username: string;
  email: string;
  password: string;
}

class AuthService {
  private token: string | null = null;
  private user: User | null = null;

  constructor() {
    // 在客户端初始化时从localStorage读取
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token');
      const userStr = localStorage.getItem('auth_user');
      if (userStr) {
        this.user = JSON.parse(userStr);
      }
    }
  }

  // 登录
  async login(credentials: LoginInput): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    const data = await response.json();

    if (response.ok && data.status === 'success') {
      this.setAuthData(data.data.token, data.data.user);
    }

    return data;
  }

  // 注册
  async register(userData: RegisterInput): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    const data = await response.json();

    if (response.ok && data.status === 'success') {
      this.setAuthData(data.data.token, data.data.user);
    }

    return data;
  }

  // 游客登录
  async guestLogin(): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/guest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (response.ok && data.status === 'success') {
      this.setAuthData(data.data.token, data.data.user);
    }

    return data;
  }

  // 获取用户信息
  async getProfile(): Promise<{ status: string; message: string; data: User }> {
    const response = await fetch(`${API_BASE_URL}/api/v1/user/profile`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`,
      },
    });

    return await response.json();
  }

  // 设置认证数据
  private setAuthData(token: string, user: User) {
    this.token = token;
    this.user = user;

    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
      localStorage.setItem('auth_user', JSON.stringify(user));
    }
  }

  // 登出
  logout() {
    this.token = null;
    this.user = null;

    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
    }
  }

  // 获取当前token
  getToken(): string | null {
    return this.token;
  }

  // 获取当前用户
  getUser(): User | null {
    return this.user;
  }

  // 检查是否已登录
  isAuthenticated(): boolean {
    return this.token !== null && this.user !== null;
  }

  // 检查token是否过期
  async isTokenValid(): Promise<boolean> {
    if (!this.token) return false;

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/user/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.token}`,
        },
      });

      return response.ok;
    } catch (error) {
      return false;
    }
  }

  // 刷新用户信息
  async refreshUser(): Promise<void> {
    if (this.token) {
      try {
        const response = await this.getProfile();
        if (response.status === 'success') {
          this.user = response.data;
          if (typeof window !== 'undefined') {
            localStorage.setItem('auth_user', JSON.stringify(response.data));
          }
        }
      } catch (error) {
        console.error('Failed to refresh user data:', error);
        this.logout();
      }
    }
  }
}

export const authService = new AuthService();