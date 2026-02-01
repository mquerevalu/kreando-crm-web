import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
} from 'amazon-cognito-identity-js';

const COGNITO_REGION = process.env.REACT_APP_COGNITO_REGION || 'us-east-2';
const USER_POOL_ID = process.env.REACT_APP_COGNITO_USER_POOL_ID || 'us-east-2_UvmWSCB4i';
const CLIENT_ID = process.env.REACT_APP_COGNITO_CLIENT_ID || 'APP_CLIENT_ID';

const userPool = new CognitoUserPool({
  UserPoolId: USER_POOL_ID,
  ClientId: CLIENT_ID,
});

export interface CognitoUserData {
  username: string;
  email: string;
  name: string;
}

export interface AuthResponse {
  user: CognitoUserData;
  token: string;
  refreshToken?: string;
}

export const cognitoService = {
  login: async (username: string, password: string): Promise<AuthResponse> => {
    return new Promise((resolve, reject) => {
      const authenticationDetails = new AuthenticationDetails({
        Username: username,
        Password: password,
      });

      const cognitoUser = new CognitoUser({
        Username: username,
        Pool: userPool,
      });

      cognitoUser.authenticateUser(authenticationDetails, {
        onSuccess: (result) => {
          const accessToken = result.getAccessToken().getJwtToken();
          const refreshToken = result.getRefreshToken()?.getToken();
          
          // Decodificar el token para obtener información del usuario
          const decodedToken = decodeToken(accessToken);
          
          const user: CognitoUserData = {
            username: decodedToken.username || username,
            email: decodedToken.email || username,
            name: decodedToken.name || decodedToken.email || username,
          };

          resolve({
            user,
            token: accessToken,
            refreshToken,
          });
        },
        onFailure: (error) => {
          console.error('Cognito login error:', error);
          reject(new Error(error.message || 'Error al iniciar sesión'));
        },
      });
    });
  },

  logout: async (): Promise<void> => {
    const cognitoUser = userPool.getCurrentUser();
    if (cognitoUser) {
      cognitoUser.signOut();
    }
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  },

  refreshToken: async (refreshTokenStr: string): Promise<AuthResponse> => {
    return new Promise((resolve, reject) => {
      const cognitoUser = userPool.getCurrentUser();
      
      if (!cognitoUser) {
        reject(new Error('No user found'));
        return;
      }

      const refreshToken = new (require('amazon-cognito-identity-js').CognitoRefreshToken)({
        RefreshToken: refreshTokenStr,
      });

      cognitoUser.refreshSession(refreshToken, (error, result) => {
        if (error) {
          console.error('Cognito refresh token error:', error);
          reject(new Error('Error al refrescar el token'));
        } else {
          const accessToken = result.getAccessToken().getJwtToken();
          const decodedToken = decodeToken(accessToken);
          
          const user: CognitoUserData = {
            username: decodedToken.username,
            email: decodedToken.email,
            name: decodedToken.name || decodedToken.email,
          };

          resolve({
            user,
            token: accessToken,
            refreshToken: result.getRefreshToken()?.getToken(),
          });
        }
      });
    });
  },

  signUp: async (username: string, password: string, email: string, name: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      userPool.signUp(
        username,
        password,
        [
          {
            Name: 'email',
            Value: email,
          },
          {
            Name: 'name',
            Value: name,
          },
        ],
        [],
        (error, result) => {
          if (error) {
            console.error('Cognito signup error:', error);
            reject(new Error(error.message || 'Error al registrarse'));
          } else {
            resolve();
          }
        }
      );
    });
  },

  confirmSignUp: async (username: string, code: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const cognitoUser = new CognitoUser({
        Username: username,
        Pool: userPool,
      });

      cognitoUser.confirmRegistration(code, true, (error, result) => {
        if (error) {
          console.error('Cognito confirm signup error:', error);
          reject(new Error(error.message || 'Error al confirmar el registro'));
        } else {
          resolve();
        }
      });
    });
  },
};

// Función auxiliar para decodificar JWT
function decodeToken(token: string): any {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding token:', error);
    return {};
  }
}
