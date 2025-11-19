import { useState } from "react";
import LoginScreen from "@/components/LoginScreen";
import SimpleChatScreen from "@/components/SimpleChatScreen";
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

  const handleLogout = () => {
    setCurrentScreen('login');
  };

  if (currentScreen === 'admin') {
    return <AdminPanel onBack={handleBackToChat} onLogout={handleLogout} />;
  }

  return <SimpleChatScreen onAdminPanel={handleAdminPanel} />;
};

export default Index;
