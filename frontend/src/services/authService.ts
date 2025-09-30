import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';

interface RegisterData {
  username: string;
  email: string;
  password: string;
}

interface LoginData {
  username: string;
  password: string;
}

interface AuthResponse {
  access_token: string;
  token_type: string;
  user?: {
    id: number;
    username: string;
    email: string;
    kyber_public_key: string;
  };
}

class AuthService {
  private axiosInstance = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      const response = await this.axiosInstance.post<AuthResponse>('/auth/register', data);

      // Store token
      if (response.data.access_token) {
        localStorage.setItem('token', response.data.access_token);
      }

      // For compatibility with the frontend code, create a user object
      const user = {
        id: 0, // Will be set by backend refresh
        username: data.username,
        email: data.email,
        kyber_public_key: '', // Generated on backend
      };

      return {
        ...response.data,
        user,
      };
    } catch (error: any) {
      if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      }
      throw new Error('Registration failed');
    }
  }

  async login(data: LoginData): Promise<AuthResponse> {
    try {
      const response = await this.axiosInstance.post<AuthResponse>('/auth/login', data);

      // Store token
      if (response.data.access_token) {
        localStorage.setItem('token', response.data.access_token);
      }

      return response.data;
    } catch (error: any) {
      if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      }
      throw new Error('Login failed');
    }
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  // Set auth header for subsequent requests
  setAuthToken(token: string): void {
    this.axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  // Initialize auth token from localStorage
  initializeAuth(): void {
    const token = this.getToken();
    if (token) {
      this.setAuthToken(token);
    }
  }
}

const authService = new AuthService();
export default authService;
