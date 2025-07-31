import { useState } from "react";
import LoginScreen from "@/components/LoginScreen";
import ChatScreen from "@/components/ChatScreen";
import AdminPanel from "@/components/AdminPanel";

type Screen = 'login' | 'chat' | 'admin';

const Index = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>('login');

  const handleLogin = () => {
    setCurrentScreen('chat');
  };

  const handleAdminPanel = () => {
    setCurrentScreen('admin');
  };

  const handleBackToChat = () => {
    setCurrentScreen('chat');
  };

  if (currentScreen === 'login') {
    return <LoginScreen onLogin={handleLogin} />;
  }

  if (currentScreen === 'admin') {
    return <AdminPanel onBack={handleBackToChat} />;
  }

  return <ChatScreen onAdminPanel={handleAdminPanel} />;
};

export default Index;
