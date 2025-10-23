"use client"

import { useState, useEffect } from "react"
import Sidebar from "@/components/sidebar"
import Dashboard from "@/components/dashboard"
import DataEntry from "@/components/data-entry"
import ViewRecords from "@/components/view-records"

export default function Home() {
  const [currentPage, setCurrentPage] = useState("dashboard")
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userInfo, setUserInfo] = useState<any>(null)
  const [loginForm, setLoginForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const response = await fetch('https://script.google.com/macros/s/AKfycbzNtDzl7Epk4_R7Vnklnry2Muwd5gTb-EXV60g-sEchodL8BIQMOwz4P_nK0wPCr5wt/exec?action=getUsers')
      const data = await response.json()
      
      const foundUser = data.users?.find((u: any) => 
        u.username === loginForm.username && u.password === loginForm.password
      )

      if (foundUser) {
        // Parse allowed pages from Access page column
        const allowedPages = foundUser.acesspage ? 
          foundUser.acesspage.split(',').map((page: string) => page.trim().toLowerCase()) : []

        const userWithAccess = {
          ...foundUser,
          allowedPages: allowedPages,
          userFirmName: foundUser.firmname || 'All', // Get user's firm name from column E
          isAdmin: foundUser.role === 'admin' // Check if user is admin
        }
        
        setUserInfo(userWithAccess)
        setIsLoggedIn(true)
        
        // Set first allowed page as current page
        if (allowedPages.length > 0) {
          const firstAllowedPage = allowedPages.find((page: string) => 
            ['dashboard', 'data entry', 'records'].includes(page)
          )
          if (firstAllowedPage) {
            const pageMap: {[key: string]: string} = {
              'dashboard': 'dashboard',
              'data entry': 'entry',
              'records': 'records'
            }
            setCurrentPage(pageMap[firstAllowedPage] || 'dashboard')
          }
        }
        
        localStorage.setItem('user', JSON.stringify(userWithAccess))
      } else {
        setError('Invalid username or password')
      }
    } catch (err) {
      setError('Login failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    setIsLoggedIn(false)
    setUserInfo(null)
    setLoginForm({ username: '', password: '' })
    setCurrentPage("dashboard")
    localStorage.removeItem('user')
  }

  // Check if already logged in on page load - FIX: Use useEffect instead of useState
  useEffect(() => {
    const savedUser = localStorage.getItem('user')
    if (savedUser) {
      const user = JSON.parse(savedUser)
      setUserInfo(user)
      setIsLoggedIn(true)
    }
  }, [])

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Machine Efficiency FMS</h1>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <input
                  type="text"
                  id="username"
                  value={loginForm.username}
                  onChange={(e) => setLoginForm({...loginForm, username: e.target.value})}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your username"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                  className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {showPassword ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    )}
                  </svg>
                </button>
              </div>
            </div>

            {error && (
              <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">Powered by Botivate</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar - Fixed height */}
      <Sidebar 
        currentPage={currentPage} 
        onNavigate={setCurrentPage} 
        userInfo={userInfo} 
        onLogout={handleLogout} 
      />
      
      {/* Main content area with footer */}
      <div className="flex-1 flex flex-col">
        <main className="flex-1 overflow-auto">
          {userInfo?.allowedPages?.includes('dashboard') && currentPage === "dashboard" && (
            <Dashboard 
              userFirmName={userInfo.userFirmName} 
              isAdmin={userInfo.isAdmin} 
            />
          )}
          {userInfo?.allowedPages?.includes('data entry') && currentPage === "entry" && (
            <DataEntry 
              userFirmName={userInfo.userFirmName}
              {...({ isAdmin: userInfo.isAdmin } as any)}
            />
          )}
          {userInfo?.allowedPages?.includes('records') && currentPage === "records" && (
            <ViewRecords 
              userFirmName={userInfo.userFirmName} 
              isAdmin={userInfo.isAdmin} 
            />
          )}
          
          {/* Show access denied message if user tries to access unauthorized page */}
          {!userInfo?.allowedPages?.includes(currentPage === 'entry' ? 'data entry' : currentPage) && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="text-6xl mb-4">🚫</div>
                <h2 className="text-2xl font-bold text-gray-700 mb-2">Access Denied</h2>
                <p className="text-gray-500">You don't have permission to access this page.</p>
              </div>
            </div>
          )}
        </main>
        
        {/* Footer - Only in main content area, not full width */}
        <footer className="bg-white border-t border-gray-200 py-3">
          <div className="text-center text-sm text-gray-600">
            Powered by{' '}
            <a 
              href="https://www.botivate.in/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 font-semibold hover:text-blue-800 hover:underline transition-colors duration-200"
            >
              Bootivate
            </a>
          </div>
        </footer>
      </div>
    </div>
  )
}
