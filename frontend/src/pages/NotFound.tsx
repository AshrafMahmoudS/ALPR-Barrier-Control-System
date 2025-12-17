import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Home, Search, ArrowLeft, AlertCircle } from 'lucide-react'
import { Button } from '../components/common'

const NotFound: React.FC = () => {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-red-500/5 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 text-center max-w-2xl mx-auto">
        {/* 404 Number */}
        <div className="mb-8">
          <div className="relative inline-block">
            <h1 className="text-[180px] font-bold leading-none bg-gradient-to-br from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent select-none">
              404
            </h1>
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-pink-500/20 blur-3xl -z-10"></div>
          </div>
        </div>

        {/* Error Icon */}
        <div className="mb-6 flex justify-center">
          <div className="p-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl">
            <AlertCircle className="w-16 h-16 text-red-400" />
          </div>
        </div>

        {/* Error Message */}
        <h2 className="text-4xl font-bold text-slate-100 mb-4">
          Page Not Found
        </h2>
        <p className="text-lg text-slate-400 mb-8 max-w-md mx-auto">
          The page you're looking for doesn't exist or has been moved. Please check the URL or return to the dashboard.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button
            onClick={() => navigate(-1)}
            variant="secondary"
            className="min-w-[200px] bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Go Back
          </Button>
          <Button
            onClick={() => navigate('/dashboard')}
            variant="primary"
            className="min-w-[200px] bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg shadow-blue-500/20"
          >
            <Home className="w-5 h-5 mr-2" />
            Back to Dashboard
          </Button>
        </div>

        {/* Additional Help */}
        <div className="mt-12 p-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl">
          <div className="flex items-start gap-4">
            <Search className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
            <div className="text-left">
              <h3 className="text-lg font-semibold text-slate-200 mb-2">
                Looking for something specific?
              </h3>
              <p className="text-sm text-slate-400 mb-4">
                Here are some helpful links to get you back on track:
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => navigate('/vehicles')}
                  className="text-sm text-blue-400 hover:text-blue-300 text-left transition-colors"
                >
                  → Vehicles
                </button>
                <button
                  onClick={() => navigate('/events')}
                  className="text-sm text-blue-400 hover:text-blue-300 text-left transition-colors"
                >
                  → Events
                </button>
                <button
                  onClick={() => navigate('/sessions')}
                  className="text-sm text-blue-400 hover:text-blue-300 text-left transition-colors"
                >
                  → Sessions
                </button>
                <button
                  onClick={() => navigate('/analytics')}
                  className="text-sm text-blue-400 hover:text-blue-300 text-left transition-colors"
                >
                  → Analytics
                </button>
                <button
                  onClick={() => navigate('/settings')}
                  className="text-sm text-blue-400 hover:text-blue-300 text-left transition-colors"
                >
                  → Settings
                </button>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="text-sm text-blue-400 hover:text-blue-300 text-left transition-colors"
                >
                  → Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Error Code */}
        <div className="mt-8 text-xs text-slate-600">
          Error Code: 404 - NOT_FOUND
        </div>
      </div>

      {/* Custom animations */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 0.8; }
        }
        .delay-1000 {
          animation-delay: 1s;
        }
        .delay-2000 {
          animation-delay: 2s;
        }
      `}</style>
    </div>
  )
}

export default NotFound
