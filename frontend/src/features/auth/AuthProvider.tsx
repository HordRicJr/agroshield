import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { api, AUTH_EXPIRED_EVENT, tokenStore } from '@/lib/api'
import type {
  MeResponse,
  Permission,
  RegisterRequest,
  TokenResponse,
} from '@/types/api'
import { toUiRole, type User } from '@/types'
import { AuthContext, type AuthStatus } from './auth-context'

function buildUser(me: MeResponse, organizationName?: string): User {
  return {
    id: me.userId,
    fullName: me.fullName,
    email: me.email,
    role: toUiRole(me.roles),
    organizationId: me.organizationId,
    organizationName: organizationName ?? 'Votre organisation',
    mfaEnabled: false,
    permissions: me.permissions,
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [status, setStatus] = useState<AuthStatus>(() =>
    tokenStore.getRefreshToken() ? 'restoring' : 'anonymous',
  )

  const applyTokens = useCallback((tokens: TokenResponse) => {
    tokenStore.setAccessToken(tokens.accessToken)
    tokenStore.setRefreshToken(tokens.refreshToken)
  }, [])

  const fetchMe = useCallback(async () => {
    const me = await api.get<MeResponse>('/auth/me')
    setUser(buildUser(me))
    setStatus('authenticated')
  }, [])

  // Restauration de session au chargement (refresh token présent).
  useEffect(() => {
    if (status !== 'restoring') return
    fetchMe().catch(() => {
      tokenStore.clear()
      setUser(null)
      setStatus('anonymous')
    })
  }, [status, fetchMe])

  // Session expirée (refresh échoué au milieu d'une navigation).
  useEffect(() => {
    const onExpired = () => {
      setUser(null)
      setStatus('anonymous')
    }
    window.addEventListener(AUTH_EXPIRED_EVENT, onExpired)
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, onExpired)
  }, [])

  const login = useCallback(
    async (email: string, password: string) => {
      const tokens = await api.post<TokenResponse>(
        '/auth/login',
        { email, password },
        { anonymous: true },
      )
      applyTokens(tokens)
      await fetchMe()
    },
    [applyTokens, fetchMe],
  )

  const register = useCallback(
    async (data: RegisterRequest) => {
      const tokens = await api.post<TokenResponse>('/auth/register', data, {
        anonymous: true,
      })
      applyTokens(tokens)
      const me = await api.get<MeResponse>('/auth/me')
      setUser(buildUser(me, data.organizationName))
      setStatus('authenticated')
    },
    [applyTokens],
  )

  const logout = useCallback(async () => {
    const refreshToken = tokenStore.getRefreshToken()
    try {
      if (refreshToken) {
        await api.post<void>('/auth/logout', { refreshToken })
      }
    } catch {
      // Le logout local prime : on purge quoi qu'il arrive.
    } finally {
      tokenStore.clear()
      setUser(null)
      setStatus('anonymous')
    }
  }, [])

  const hasPermission = useCallback(
    (permission: Permission) => user?.permissions.includes(permission) ?? false,
    [user],
  )

  const value = useMemo(
    () => ({
      user,
      status,
      isAuthenticated: user !== null,
      login,
      register,
      logout,
      hasPermission,
    }),
    [user, status, login, register, logout, hasPermission],
  )

  return <AuthContext value={value}>{children}</AuthContext>
}
