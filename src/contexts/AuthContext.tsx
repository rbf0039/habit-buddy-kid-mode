import { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  signUp: (email: string, password: string, name: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  loading: boolean;
  isChildMode: boolean;
  setChildMode: (enabled: boolean) => void;
  verifyPin: (pin: string) => Promise<boolean>;
  createPin: (pin: string) => Promise<{ error: any }>;
  hasPin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isChildMode, setIsChildMode] = useState(false);
  const [hasPin, setHasPin] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Load child mode state from localStorage
    const savedMode = localStorage.getItem("childMode");
    if (savedMode === "true") {
      setIsChildMode(true);
    }

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // Check if user has a PIN set
        if (session?.user) {
          setTimeout(() => {
            checkUserPin(session.user.id);
          }, 0);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      if (session?.user) {
        checkUserPin(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkUserPin = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("pin")
      .eq("id", userId)
      .single();
    
    setHasPin(!!data?.pin);
  };

  const setChildMode = (enabled: boolean) => {
    setIsChildMode(enabled);
    localStorage.setItem("childMode", enabled.toString());
  };

  const signUp = async (email: string, password: string, name: string) => {
    const redirectUrl = `${window.location.origin}/dashboard`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          name: name
        }
      }
    });
    
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setChildMode(false);
    navigate("/");
  };

  const createPin = async (pin: string) => {
    if (!user) return { error: "No user logged in" };
    
    const { error } = await supabase
      .from("profiles")
      .update({ pin })
      .eq("id", user.id);
    
    if (!error) {
      setHasPin(true);
    }
    
    return { error };
  };

  const verifyPin = async (pin: string) => {
    if (!user) return false;
    
    const { data } = await supabase
      .from("profiles")
      .select("pin")
      .eq("id", user.id)
      .single();
    
    return data?.pin === pin;
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      signUp, 
      signIn, 
      signOut, 
      loading,
      isChildMode,
      setChildMode,
      verifyPin,
      createPin,
      hasPin
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};