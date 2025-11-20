"use client"

interface SidebarProps {
  currentPage: string
  onNavigate: (page: string) => void
  userInfo?: any
  onLogout?: () => void
}

export default function Sidebar({ currentPage, onNavigate, userInfo, onLogout }: SidebarProps) {
  const allMenuItems = [
    { 
      id: "dashboard", 
      label: "Dashboard", 
      icon: "📊", 
      access: "dashboard" 
    },
    { 
      id: "entry", 
      label: "Data Entry", 
      icon: "📝", 
      access: "data entry" 
    },
    { 
      id: "records", 
      label: "View Records", 
      icon: "📁", 
      access: "records" 
    },
  ]

  // Filter menu items based on user's allowed pages
  const menuItems = allMenuItems.filter(item => 
    userInfo?.allowedPages?.includes(item.access)
  )

  const handleNavigate = (pageId: string) => {
    const item = menuItems.find(m => m.id === pageId)
    if (item && userInfo?.allowedPages?.includes(item.access)) {
      onNavigate(pageId)
    }
  }

  return (
    <div className="w-64 bg-gradient-to-b from-blue-900 to-blue-800 text-white flex flex-col shadow-xl">
      <div className="p-6 border-b border-blue-700">
        <h1 className="text-xl font-bold mb-1">Machine Efficiency</h1>
        {/* <p className="text-sm text-blue-200">Data Management Portal</p> */}
        {userInfo && (
          <div className="mt-3 text-xs text-blue-200">
            <p>Welcome, {userInfo.username}</p>
            {/* <p>Role: {userInfo.role}</p> */}
            <p className="text-blue-300 mt-1">
              {/* Access: {userInfo.allowedPages?.join(', ') || 'No access'} */}
            </p>
          </div>
        )}
      </div>

      <nav className="flex-1 py-6">
        {menuItems.length > 0 ? (
          menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavigate(item.id)}
              className={`w-full px-6 py-3 flex items-center gap-3 transition-all ${
                currentPage === item.id
                  ? "bg-blue-700 border-l-4 border-blue-400 text-white"
                  : "text-blue-100 hover:bg-blue-800"
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </button>
          ))
        ) : (
          <div className="px-6 py-3 text-blue-300 text-sm">
            No pages available for your account
          </div>
        )}
      </nav>

      <div className="p-4 border-t border-blue-700">
        {onLogout && (
          <button
            onClick={onLogout}
            className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg transition duration-300 mb-3 flex items-center justify-center gap-2"
          >
            <span>🚪</span>
            <span>Logout</span>
          </button>
        )}
       
       
      </div>
    </div>
  )
}