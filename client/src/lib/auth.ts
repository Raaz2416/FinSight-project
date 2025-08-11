import { apiRequest } from "./queryClient";
import type { User, LoginCredentials, InsertUser } from "@shared/schema";

interface AuthResponse {
  user: User;
  token: string;
}

export class AuthService {
  private static instance: AuthService;
  private token: string | null = null;
  private user: User | null = null;

  private constructor() {
    this.token = localStorage.getItem("auth_token");
  }

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiRequest("POST", "/api/auth/login", credentials);
    const data: AuthResponse = await response.json();
    
    this.token = data.token;
    this.user = data.user;
    localStorage.setItem("auth_token", data.token);
    
    return data;
  }

  async register(userData: InsertUser): Promise<AuthResponse> {
    const response = await apiRequest("POST", "/api/auth/register", userData);
    const data: AuthResponse = await response.json();
    
    this.token = data.token;
    this.user = data.user;
    localStorage.setItem("auth_token", data.token);
    
    return data;
  }

  async getCurrentUser(): Promise<User | null> {
    if (!this.token) return null;
    
    try {
      const response = await fetch("/api/auth/me", {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      });
      
      if (!response.ok) {
        this.logout();
        return null;
      }
      
      const data = await response.json();
      this.user = data.user;
      return this.user;
    } catch {
      this.logout();
      return null;
    }
  }

  logout(): void {
    this.token = null;
    this.user = null;
    localStorage.removeItem("auth_token");
  }

  getToken(): string | null {
    return this.token;
  }

  getUser(): User | null {
    return this.user;
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }
}

export const auth = AuthService.getInstance();

// Helper function to add auth header to requests
export function getAuthHeaders(): Record<string, string> {
  const token = auth.getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
