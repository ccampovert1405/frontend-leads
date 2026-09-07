import axios from 'axios';

// Si no se especifica VITE_API_URL, se utiliza ruta relativa ('') para aprovechar el proxy de Vite (/v1 -> http://localhost:3000/v1)
export const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export const api = axios.create({
  baseURL: API_BASE_URL ? `${API_BASE_URL}/v1` : '/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para inyectar automáticamente el JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para manejar expiración de token o respuestas estructuradas
api.interceptors.response.use(
  (response) => {
    // Si la respuesta viene envuelta en StandardApiResponse { success: true, data: ... }
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token expirado o inválido
      if (window.location.pathname !== '/login') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

export interface UserDto {
  id: string;
  username: string;
  role: string;
  rol?: {
    rolId: string;
    nombreRol: string;
    descripcion?: string;
  } | null;
  isActive: boolean;
  createdAt: string;
}

export interface RoleDto {
  rolId: string;
  nombreRol: string;
  descripcion?: string | null;
  permisosCount?: number;
  menusCount?: number;
  usersCount?: number;
  permisos?: PermissionDto[];
  menus?: MenuDto[];
}

export interface PermissionDto {
  permisoId: string;
  nombreAccion: string;
  identificadorAccion: string;
  rolesCount?: number;
  roles?: { rolId: string; nombreRol: string }[];
}

export interface MenuDto {
  id: string;
  label: string;
  ruta: string;
  icono: string;
  orden: number;
  tipo: string;
}

// Clientes API especializados
export const usersApi = {
  getAll: () => api.get<UserDto[]>('/users'),
  getById: (id: string) => api.get<UserDto>(`/users/${id}`),
  create: (data: { username: string; password: string; roleId?: string; role?: string; isActive?: boolean }) =>
    api.post<UserDto>('/users', data),
  update: (id: string, data: { username?: string; password?: string; roleId?: string; role?: string; isActive?: boolean }) =>
    api.patch<UserDto>(`/users/${id}`, data),
  delete: (id: string) => api.delete<{ success: boolean; message: string }>(`/users/${id}`),
};

export const rolesApi = {
  getAll: () => api.get<RoleDto[]>('/roles'),
  getById: (id: string) => api.get<RoleDto>(`/roles/${id}`),
  create: (data: { nombreRol: string; descripcion?: string; permissionIds?: string[]; menuIds?: string[] }) =>
    api.post<RoleDto>('/roles', data),
  update: (id: string, data: { nombreRol?: string; descripcion?: string; permissionIds?: string[]; menuIds?: string[] }) =>
    api.patch<RoleDto>(`/roles/${id}`, data),
  assignPermissions: (id: string, permissionIds: string[]) =>
    api.post<RoleDto>(`/roles/${id}/permissions`, { permissionIds }),
  assignMenus: (id: string, menuIds: string[]) =>
    api.post<RoleDto>(`/roles/${id}/menus`, { menuIds }),
  delete: (id: string) => api.delete<{ success: boolean; message: string }>(`/roles/${id}`),
};

export const permissionsApi = {
  getAll: () => api.get<PermissionDto[]>('/permissions'),
  create: (data: { nombreAccion: string; identificadorAccion: string }) =>
    api.post<PermissionDto>('/permissions', data),
  delete: (id: string) => api.delete<{ success: boolean; message: string }>(`/permissions/${id}`),
};

export const menusApi = {
  getAll: () => api.get<MenuDto[]>('/menus'),
  getMyMenus: () => api.get<MenuDto[]>('/menus/my-menus'),
  create: (data: { label: string; ruta: string; icono?: string; orden?: number; tipo?: string }) =>
    api.post<MenuDto>('/menus', data),
  update: (id: string, data: { label?: string; ruta?: string; icono?: string; orden?: number; tipo?: string }) =>
    api.patch<MenuDto>(`/menus/${id}`, data),
  delete: (id: string) => api.delete<{ success: boolean; message: string }>(`/menus/${id}`),
};

export default api;
