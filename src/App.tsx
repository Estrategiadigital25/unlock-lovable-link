// src/App.tsx
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import LoginScreen from "@/components/LoginScreen";
import ChatScreen from "@/components/ChatScreen";
import AdminPanel from "@/components/AdminPanel";
import { Loader2 } from "lucide-react";

type Screen = 'login' | 'chat' | 'admin';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('login');
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Verificar si hay sesión activa al cargar
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setIsAuthenticated(true);
          setCurrentScreen('chat');
        }
      } catch (error) {
        console.error('Error checking session:', error);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    // Escuchar cambios en la autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
      if (session) {
        setCurrentScreen('chat');
      } else {
        setCurrentScreen('login');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
    setCurrentScreen('chat');
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setIsAuthenticated(false);
      setCurrentScreen('login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleAdminPanel = () => setCurrentScreen('admin');
  const handleBackToChat = () => setCurrentScreen('chat');

  // Mostrar loading mientras verifica la sesión
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Si no está autenticado, mostrar login
  if (!isAuthenticated) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  // Si está autenticado, mostrar las pantallas correspondientes
  if (currentScreen === 'admin') {
    return <AdminPanel onBack={handleBackToChat} onLogout={handleLogout} />;
    //                                            ^^^^^^^^^^^^^^^^^^^^^ ✅ AGREGADO
  }

  return <ChatScreen onAdminPanel={handleAdminPanel} onLogout={handleLogout} />;
}

