import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useRef, useState } from "react";

type AuthContextData = {
  medicoId: string | null; // GUID
  isLoading: boolean;
  signIn: (medicoId: string) => Promise<void>; // GUID
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [medicoId, setMedicoId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const expiryRef = useRef<number | null>(null);
  const signOutTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const EXPIRY_KEY = "@medata:expiry";
  const MIC_ASKED_KEY = "@medata:micAsked";

  useEffect(() => {
    (async () => {
      const stored = await AsyncStorage.getItem("@medata:medicoId");
      const storedExpiry = await AsyncStorage.getItem(EXPIRY_KEY);

      if (stored && storedExpiry) {
        const expiryNum = Number(storedExpiry);
        const now = Date.now();
        if (expiryNum > now) {
          setMedicoId(stored);
          expiryRef.current = expiryNum;
          const remaining = expiryNum - now;
          
          signOutTimer.current = setTimeout(async () => {
            setMedicoId(null);
            expiryRef.current = null;
            try {
              await AsyncStorage.removeItem("@medata:medicoId");
              await AsyncStorage.removeItem(EXPIRY_KEY);
              await AsyncStorage.removeItem(MIC_ASKED_KEY);
            } catch (e) {
              
            }
          }, remaining);
        } else {
          
          await AsyncStorage.removeItem("@medata:medicoId");
          await AsyncStorage.removeItem(EXPIRY_KEY);
        }
      }

      setIsLoading(false);
    })();
   
  }, []);

  async function signIn(id: string) {
    setMedicoId(id);
    await AsyncStorage.setItem("@medata:medicoId", id);
    const expiry = Date.now() + 10 * 60 * 1000; 
    expiryRef.current = expiry;
    await AsyncStorage.setItem(EXPIRY_KEY, String(expiry));

    
    if (signOutTimer.current) {
      clearTimeout(signOutTimer.current);
    }
    
    signOutTimer.current = setTimeout(async () => {
      setMedicoId(null);
      expiryRef.current = null;
      try {
        await AsyncStorage.removeItem("@medata:medicoId");
        await AsyncStorage.removeItem(EXPIRY_KEY);
        await AsyncStorage.removeItem(MIC_ASKED_KEY);
      } catch (e) {
        
      }
    }, 10 * 60 * 1000);
  }

  async function signOut() {
    setMedicoId(null);
    expiryRef.current = null;
    if (signOutTimer.current) {
      clearTimeout(signOutTimer.current);
      signOutTimer.current = null;
    }
    try {
      await AsyncStorage.removeItem("@medata:medicoId");
      await AsyncStorage.removeItem(EXPIRY_KEY);
      await AsyncStorage.removeItem(MIC_ASKED_KEY);
    } catch (e) {
     
    }
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
