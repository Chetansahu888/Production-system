"use client"

interface SidebarProps {
  currentPage: string
  onNavigate: (page: string) => void
}

export default function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: "📊" },
    { id: "entry", label: "Data Entry", icon: "📝" },
    { id: "records", label: "View Records", icon: "📋" },
  ]

  return (
    <div className="w-64 bg-gradient-to-b from-blue-900 to-blue-800 text-white flex flex-col shadow-xl">
      <div className="p-6 border-b border-blue-700">
        <h1 className="text-xl font-bold mb-1">Production System</h1>
        <p className="text-sm text-blue-200">Data Management Portal</p>
      </div>

      <nav className="flex-1 py-6">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`w-full px-6 py-3 flex items-center gap-3 transition-all ${
              currentPage === item.id
                ? "bg-blue-700 border-l-4 border-blue-400 text-white"
                : "text-blue-100 hover:bg-blue-800"
            }`}
          >
            <span className="text-xl">{item.icon}</span>
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-blue-700 text-xs text-blue-300 text-center">Production Management v2.0</div>
    </div>
  )
}
