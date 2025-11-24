import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

type AuthContextData = {
  medicoId: number | null;
  isLoading: boolean;
  signIn: (medicoId: number) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [medicoId, setMedicoId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const stored = await AsyncStorage.getItem("@medata:medicoId");
      if (stored) setMedicoId(Number(stored));
      setIsLoading(false);
    })();
  }, []);

  async function signIn(id: number) {
    setMedicoId(id);
    await AsyncStorage.setItem("@medata:medicoId", String(id));
  }

  async function signOut() {
    setMedicoId(null);
    await AsyncStorage.removeItem("@medata:medicoId");
  }

  return (
    <AuthContext.Provider value={{ medicoId, isLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  return useContext(AuthContext);
}
