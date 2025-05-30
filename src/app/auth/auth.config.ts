import { environment } from '../../environments/environment';
import { LogLevel, PassedInitialConfig } from 'angular-auth-oidc-client';

export const authConfig: PassedInitialConfig = {
  config: {
    authority: environment.auth.authority,
    redirectUrl: window.location.origin,
    postLoginRoute: '/',
    postLogoutRedirectUri: window.location.origin,
    clientId: environment.auth.clientId,
    scope: 'openid email profile aws.cognito.signin.user.admin',
    responseType: 'code',
    silentRenew: true,
    useRefreshToken: true,
    allowUnsafeReuseRefreshToken: true,
    ignoreNonceAfterRefresh: true,
    triggerRefreshWhenIdTokenExpired: false,
    renewTimeBeforeTokenExpiresInSeconds: 30,
    historyCleanupOff: false,
    logLevel: LogLevel.Debug,
    // Fixes the issue with the logoff function error
    customParamsEndSessionRequest: {
      client_id: environment.auth.clientId,
      logout_uri: window.location.origin,
    },
  },
};
