import React from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Car,
  Activity,
  BarChart3,
  Settings,
  Shield,
  LogOut,
} from 'lucide-react'

interface NavItem {
  name: string
  path: string
  icon: React.ReactNode
}

const navItems: NavItem[] = [
  {
    name: 'Dashboard',
    path: '/dashboard',
    icon: <LayoutDashboard className="w-5 h-5" />,
  },
  {
    name: 'Vehicles',
    path: '/vehicles',
    icon: <Car className="w-5 h-5" />,
  },
  {
    name: 'Events',
    path: '/events',
    icon: <Activity className="w-5 h-5" />,
  },
  {
    name: 'Analytics',
    path: '/analytics',
    icon: <BarChart3 className="w-5 h-5" />,
  },
  {
    name: 'Settings',
    path: '/settings',
    icon: <Settings className="w-5 h-5" />,
  },
]

const Sidebar: React.FC = () => {
  return (
    <aside className="fixed left-0 top-0 h-screen w-64 sidebar flex flex-col z-50">
      {/* Logo */}
      <div className="flex items-center gap-3 p-6 border-b border-white/10">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{
          background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
          boxShadow: '0 4px 14px 0 rgba(59, 130, 246, 0.4)'
        }}>
          <Shield className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-white">ALPR System</h1>
          <p className="text-xs text-slate-400">Barrier Control</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              isActive ? 'sidebar-link active' : 'sidebar-link'
            }
          >
            {item.icon}
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3 p-3 rounded-xl glass mb-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm" style={{
            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
          }}>
            AD
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">Admin User</p>
            <p className="text-xs text-slate-400 truncate">admin@alpr.system</p>
          </div>
        </div>

        <button className="btn btn-secondary w-full">
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
