import { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Chat from "./pages/Chat";
import WelcomeOverlay from "./components/WelcomeOverlay";

import Settings from "./pages/Settings";
import SettingsProfile from "./pages/SettingsProfile";
import SettingsPrivacy from "./pages/SettingsPrivacy";
import SettingsChats from "./pages/SettingsChats";
import SettingsNotifications from "./pages/SettingsNotifications";
import SettingsStorage from "./pages/SettingsStorage";
import Status from "./pages/Status";

function App() {
  const isAuthenticated = !!localStorage.getItem('token') && !!localStorage.getItem('user');
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowContent(true);
    }, 4000); // Slightly after welcome screen starts hiding
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <WelcomeOverlay />
      <div className={`auth-container transition-opacity duration-1000 ${showContent ? "opacity-100" : "opacity-0"}`}>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/chat"
            element={isAuthenticated ? <Chat /> : <Navigate to="/" />}
          />
          <Route
            path="/settings"
            element={isAuthenticated ? <Settings /> : <Navigate to="/" />}
          />
          <Route
            path="/settings/profile"
            element={isAuthenticated ? <SettingsProfile /> : <Navigate to="/" />}
          />
          <Route
            path="/settings/privacy"
            element={isAuthenticated ? <SettingsPrivacy /> : <Navigate to="/" />}
          />
          <Route
            path="/settings/chats"
            element={isAuthenticated ? <SettingsChats /> : <Navigate to="/" />}
          />
          <Route
            path="/settings/notifications"
            element={isAuthenticated ? <SettingsNotifications /> : <Navigate to="/" />}
          />
          <Route
            path="/settings/storage"
            element={isAuthenticated ? <SettingsStorage /> : <Navigate to="/" />}
          />
          <Route
            path="/status"
            element={isAuthenticated ? <Status /> : <Navigate to="/" />}
          />
        </Routes>
      </div>
    </>
  );
}

export default App;
