import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import useAuthStore from './store/authStore'
import useThemeStore from './store/themeStore'
import LoginPage from './pages/LoginPage'
import Layout from './components/Layout'
import PurchaseEditor from './pages/PurchaseEditor'
import MainPage from './pages/MainPage'
import ScanReceiptPage from './pages/ScanReceiptPage'
import PurchaseList from './pages/PurchaseList'
import AnalyticsPage from './pages/AnalyticsPage'
import UserManagement from './pages/UserManagement'
import SettingsPage from './pages/SettingsPage'
import MoneyFlowPage from './pages/MoneyFlowPage'

function App() {
  const { user, isAuthenticated, checkAuth, loading, logout } = useAuthStore()
  const { initTheme } = useThemeStore()

  useEffect(() => {
    checkAuth()
    initTheme()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-light-gray font-sans">
        <div className="text-deep-blue font-bold animate-pulse">Loading Moneyflow...</div>
      </div>
    )
  }

  return (
    <Routes>
      <Route 
        path="/login" 
        element={!isAuthenticated ? <LoginPage /> : <Navigate to="/" />} 
      />
      
      {/* Protected Routes */}
      <Route 
        path="/" 
        element={isAuthenticated ? <Layout /> : <Navigate to="/login" />}
      >
        <Route index element={<MainPage />} />
        <Route path="scan" element={<ScanReceiptPage />} />
        <Route path="purchases" element={<PurchaseList />} />
        <Route path="create-purchase" element={<PurchaseEditor />} />
        <Route path="edit-purchase/:id" element={<PurchaseEditor />} />
        <Route path="dashboard" element={<AnalyticsPage />} />
        <Route 
          path="users" 
          element={user?.administrator ? <UserManagement /> : <Navigate to="/" />} 
        />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="moneyflow" element={<MoneyFlowPage />} />
      </Route>
    </Routes>
  )
}

export default App
