import { describe, it, expectTypeOf } from 'vitest'
import type {
  TokenData,
  OAuthTokenResponse,
  LoginCredentials,
  RegistrationData,
  User,
  AuthState,
  TokenStorage,
  ResolvedAuthConfig,
  UseUserOptions,
  AuthFailureCallback,
  OAuthGrantType,
} from '../auth.types'
import type { AuthContextValue } from '../AuthContext'
import type { TokenInterceptorConfig } from '../token-interceptor'
import { OAuthService, OAuthError, normalizeTokenResponse, isTokenExpired } from '../oauth'
import { createTokenStorage, LocalStorageTokenStorage, InMemoryTokenStorage } from '../token-storage'
import { TokenInterceptor } from '../token-interceptor'
import type { Interceptor } from '../../http/types'

// ─── Token Data Types ───────────────────────────────────────────────────────

describe('TokenData type', () => {
  it('has required fields', () => {
    expectTypeOf<TokenData>().toHaveProperty('accessToken')
    expectTypeOf<TokenData>().toHaveProperty('tokenType')
    expectTypeOf<TokenData>().toHaveProperty('expiresAt')
  })

  it('accessToken is string', () => {
    expectTypeOf<TokenData['accessToken']>().toBeString()
  })

  it('refreshToken is optional string', () => {
    expectTypeOf<TokenData['refreshToken']>().toEqualTypeOf<string | undefined>()
  })

  it('scope is optional string', () => {
    expectTypeOf<TokenData['scope']>().toEqualTypeOf<string | undefined>()
  })
})

// ─── OAuthTokenResponse ─────────────────────────────────────────────────────

describe('OAuthTokenResponse type', () => {
  it('uses snake_case fields matching OAuth2 spec', () => {
    expectTypeOf<OAuthTokenResponse>().toHaveProperty('access_token')
    expectTypeOf<OAuthTokenResponse>().toHaveProperty('token_type')
    expectTypeOf<OAuthTokenResponse>().toHaveProperty('expires_in')
  })

  it('refresh_token is optional', () => {
    expectTypeOf<OAuthTokenResponse['refresh_token']>().toEqualTypeOf<string | undefined>()
  })

  it('expires_in is number', () => {
    expectTypeOf<OAuthTokenResponse['expires_in']>().toBeNumber()
  })
})

// ─── User Type ──────────────────────────────────────────────────────────────

describe('User type', () => {
  it('uid is required string', () => {
    expectTypeOf<User['uid']>().toBeString()
  })

  it('name is optional string', () => {
    expectTypeOf<User['name']>().toEqualTypeOf<string | undefined>()
  })

  it('currency has isocode property', () => {
    expectTypeOf<NonNullable<User['currency']>>().toHaveProperty('isocode')
  })
})

// ─── LoginCredentials ───────────────────────────────────────────────────────

describe('LoginCredentials type', () => {
  it('has username and password', () => {
    expectTypeOf<LoginCredentials>().toHaveProperty('username')
    expectTypeOf<LoginCredentials>().toHaveProperty('password')
    expectTypeOf<LoginCredentials['username']>().toBeString()
    expectTypeOf<LoginCredentials['password']>().toBeString()
  })
})

// ─── RegistrationData ───────────────────────────────────────────────────────

describe('RegistrationData type', () => {
  it('has required fields', () => {
    expectTypeOf<RegistrationData>().toHaveProperty('firstName')
    expectTypeOf<RegistrationData>().toHaveProperty('lastName')
    expectTypeOf<RegistrationData>().toHaveProperty('uid')
    expectTypeOf<RegistrationData>().toHaveProperty('password')
  })

  it('titleCode is optional', () => {
    expectTypeOf<RegistrationData['titleCode']>().toEqualTypeOf<string | undefined>()
  })
})

// ─── AuthState ──────────────────────────────────────────────────────────────

describe('AuthState type', () => {
  it('isAuthenticated is boolean', () => {
    expectTypeOf<AuthState['isAuthenticated']>().toBeBoolean()
  })

  it('user is User | null', () => {
    expectTypeOf<AuthState['user']>().toEqualTypeOf<User | null>()
  })

  it('token is TokenData | null', () => {
    expectTypeOf<AuthState['token']>().toEqualTypeOf<TokenData | null>()
  })

  it('isLoading is boolean', () => {
    expectTypeOf<AuthState['isLoading']>().toBeBoolean()
  })
})

// ─── AuthContextValue ───────────────────────────────────────────────────────

describe('AuthContextValue type', () => {
  it('extends AuthState with action methods', () => {
    expectTypeOf<AuthContextValue>().toHaveProperty('login')
    expectTypeOf<AuthContextValue>().toHaveProperty('logout')
    expectTypeOf<AuthContextValue>().toHaveProperty('register')
    expectTypeOf<AuthContextValue>().toHaveProperty('setUser')
  })

  it('login accepts LoginCredentials and returns Promise<void>', () => {
    expectTypeOf<AuthContextValue['login']>().toEqualTypeOf<
      (credentials: LoginCredentials) => Promise<void>
    >()
  })

  it('logout returns Promise<void>', () => {
    expectTypeOf<AuthContextValue['logout']>().toEqualTypeOf<() => Promise<void>>()
  })

  it('register accepts RegistrationData and returns Promise<void>', () => {
    expectTypeOf<AuthContextValue['register']>().toEqualTypeOf<
      (data: RegistrationData) => Promise<void>
    >()
  })

  it('setUser accepts User | null', () => {
    expectTypeOf<AuthContextValue['setUser']>().toEqualTypeOf<
      (user: User | null) => void
    >()
  })
})

// ─── TokenStorage interface ─────────────────────────────────────────────────

describe('TokenStorage interface', () => {
  it('getToken returns TokenData | null', () => {
    expectTypeOf<TokenStorage['getToken']>().returns.toEqualTypeOf<TokenData | null>()
  })

  it('setToken accepts TokenData', () => {
    expectTypeOf<TokenStorage['setToken']>().parameters.toEqualTypeOf<[TokenData]>()
  })

  it('removeToken returns void', () => {
    expectTypeOf<TokenStorage['removeToken']>().returns.toBeVoid()
  })
})

// ─── ResolvedAuthConfig ─────────────────────────────────────────────────────

describe('ResolvedAuthConfig type', () => {
  it('clientId is required string', () => {
    expectTypeOf<ResolvedAuthConfig['clientId']>().toBeString()
  })

  it('clientSecret is optional', () => {
    expectTypeOf<ResolvedAuthConfig['clientSecret']>().toEqualTypeOf<string | undefined>()
  })

  it('tokenEndpoint is required string', () => {
    expectTypeOf<ResolvedAuthConfig['tokenEndpoint']>().toBeString()
  })
})

// ─── OAuthGrantType union ───────────────────────────────────────────────────

describe('OAuthGrantType type', () => {
  it('is a union of string literals', () => {
    expectTypeOf<OAuthGrantType>().toEqualTypeOf<
      'password' | 'client_credentials' | 'refresh_token'
    >()
  })
})

// ─── UseUserOptions ─────────────────────────────────────────────────────────

describe('UseUserOptions type', () => {
  it('fields is optional', () => {
    expectTypeOf<UseUserOptions['fields']>().not.toBeNever()
  })

  it('enabled is optional boolean', () => {
    expectTypeOf<UseUserOptions['enabled']>().toEqualTypeOf<boolean | undefined>()
  })
})

// ─── AuthFailureCallback ───────────────────────────────────────────────────

describe('AuthFailureCallback type', () => {
  it('is a function returning void', () => {
    expectTypeOf<AuthFailureCallback>().toEqualTypeOf<() => void>()
  })
})

// ─── OAuthService class ─────────────────────────────────────────────────────

describe('OAuthService class', () => {
  it('login returns Promise<TokenData>', () => {
    expectTypeOf<OAuthService['login']>().returns.resolves.toEqualTypeOf<TokenData>()
  })

  it('clientCredentials returns Promise<TokenData>', () => {
    expectTypeOf<OAuthService['clientCredentials']>().returns.resolves.toEqualTypeOf<TokenData>()
  })

  it('refreshAccessToken returns Promise<TokenData>', () => {
    expectTypeOf<OAuthService['refreshAccessToken']>().returns.resolves.toEqualTypeOf<TokenData>()
  })

  it('revokeToken returns Promise<void>', () => {
    expectTypeOf<OAuthService['revokeToken']>().returns.resolves.toBeVoid()
  })
})

// ─── OAuthError class ───────────────────────────────────────────────────────

describe('OAuthError class', () => {
  it('extends Error', () => {
    expectTypeOf<OAuthError>().toExtend<Error>()
  })

  it('has errorCode and statusCode', () => {
    expectTypeOf<OAuthError['errorCode']>().toBeString()
    expectTypeOf<OAuthError['statusCode']>().toBeNumber()
  })

  it('isInvalidGrant returns boolean', () => {
    expectTypeOf<OAuthError['isInvalidGrant']>().returns.toBeBoolean()
  })

  it('isInvalidClient returns boolean', () => {
    expectTypeOf<OAuthError['isInvalidClient']>().returns.toBeBoolean()
  })
})

// ─── Function signatures ────────────────────────────────────────────────────

describe('normalizeTokenResponse', () => {
  it('accepts OAuthTokenResponse and returns TokenData', () => {
    expectTypeOf(normalizeTokenResponse).parameters.toEqualTypeOf<[OAuthTokenResponse]>()
    expectTypeOf(normalizeTokenResponse).returns.toEqualTypeOf<TokenData>()
  })
})

describe('isTokenExpired', () => {
  it('accepts TokenData with optional margin and returns boolean', () => {
    expectTypeOf(isTokenExpired).returns.toBeBoolean()
  })
})

describe('createTokenStorage', () => {
  it('returns TokenStorage', () => {
    expectTypeOf(createTokenStorage).returns.toEqualTypeOf<TokenStorage>()
  })
})

// ─── TokenInterceptor class ─────────────────────────────────────────────────

describe('TokenInterceptor class', () => {
  it('createRequestInterceptor returns an Interceptor', () => {
    expectTypeOf<TokenInterceptor['createRequestInterceptor']>().returns.toExtend<Interceptor>()
  })

  it('handleUnauthorized returns Promise<TokenData | null>', () => {
    expectTypeOf<TokenInterceptor['handleUnauthorized']>().returns.resolves.toEqualTypeOf<TokenData | null>()
  })
})

// ─── TokenInterceptorConfig ─────────────────────────────────────────────────

describe('TokenInterceptorConfig type', () => {
  it('requires storage and oauthService', () => {
    expectTypeOf<TokenInterceptorConfig>().toHaveProperty('storage')
    expectTypeOf<TokenInterceptorConfig>().toHaveProperty('oauthService')
  })

  it('onAuthFailure is optional', () => {
    expectTypeOf<TokenInterceptorConfig['onAuthFailure']>().toEqualTypeOf<
      AuthFailureCallback | undefined
    >()
  })
})

// ─── Storage classes implement TokenStorage ─────────────────────────────────

describe('Storage implementations', () => {
  it('LocalStorageTokenStorage implements TokenStorage', () => {
    expectTypeOf<LocalStorageTokenStorage>().toExtend<TokenStorage>()
  })

  it('InMemoryTokenStorage implements TokenStorage', () => {
    expectTypeOf<InMemoryTokenStorage>().toExtend<TokenStorage>()
  })
})
