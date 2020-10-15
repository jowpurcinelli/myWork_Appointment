import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
  } from 'react';
  import AsyncStorage from '@react-native-community/async-storage';
  import api from '../services/api';
  
  interface AuthState {
    user: object;
    token: string;
  }
  
  interface SignInCredentials {
    email: string;
    password: string;
  }
  
  interface AuthContextData {
    loading: boolean;
    user: object;
    signIn(credentials: SignInCredentials): Promise<void>;
    signOut(): void;
  }
  
  const AuthContext = createContext<AuthContextData>({} as AuthContextData);
  
  export const AuthProvider: React.FC = ({ children }) => {
    const [data, setData] = useState<AuthState>({} as AuthState);
    const [loading, setLoading] = useState(true);
  
    useEffect(() => {
      async function loadStorageData(): Promise<void> {
        const [user, token] = await AsyncStorage.multiGet([
          '@MyWork:user',
          '@MyWork:token',
        ]);
  
        if (user[1] && token[1]) {
          setData({ token: token[1], user: JSON.parse(user[1]) });
        }
  
        setLoading(false);
      }
  
      loadStorageData();
    }, []);
  
    const signIn = useCallback(async ({ email, password }) => {
      const response = await api.post('sessions', { email, password });
  
      const { user, token } = response.data;
  
      await AsyncStorage.multiSet([
        ['@MyWork:user', JSON.stringify(user)],
        ['@MyWork:token', token],
      ]);
  
      setData({ user, token });
    }, []);
  
    const signOut = useCallback(async () => {
      await AsyncStorage.multiRemove(['@GoBarber:user', '@GoBarber:token']);
  
      setData({} as AuthState);
    }, []);
  
    return (
      <AuthContext.Provider value={{ loading, user: data.user, signIn, signOut }}>
        {children}
      </AuthContext.Provider>
    );
  };
  
  export const useAuth = (): AuthContextData => {
    const context = useContext(AuthContext);
  
    if (!context) {
      throw new Error('useAuth must be used within an AuthProvider');
    }
  
    return context;
  };