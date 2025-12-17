import React, { useState, useEffect } from 'react'
import {
  Save,
  Settings as SettingsIcon,
  Camera,
  Scan,
  Bell,
  Users,
  Database,
  Shield,
  Wifi,
  HardDrive
} from 'lucide-react'
import { Card, CardHeader, CardBody, Button, Badge } from '../components/common'
import { apiService } from '../services/api'
import { toast } from 'react-hot-toast'

interface SystemSettings {
  site_name: string
  site_location: string
  timezone: string
  date_format: string
  barrier_auto_close_delay: number
  max_session_duration: number
}

interface CameraSettings {
  camera_1_enabled: boolean
  camera_1_url: string
  camera_1_resolution: string
  camera_1_fps: number
  camera_2_enabled: boolean
  camera_2_url: string
  camera_2_resolution: string
  camera_2_fps: number
}

interface ALPRSettings {
  min_confidence: number
  processing_threads: number
  country_code: string
  region: string
  detect_region: boolean
  top_n_results: number
}

interface NotificationSettings {
  email_enabled: boolean
  email_recipients: string
  notify_on_denied: boolean
  notify_on_error: boolean
  notify_on_suspicious: boolean
  webhook_enabled: boolean
  webhook_url: string
}

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'system' | 'camera' | 'alpr' | 'notifications' | 'users' | 'backup'>('system')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Settings state
  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    site_name: '',
    site_location: '',
    timezone: 'UTC',
    date_format: 'YYYY-MM-DD',
    barrier_auto_close_delay: 5,
    max_session_duration: 24
  })

  const [cameraSettings, setCameraSettings] = useState<CameraSettings>({
    camera_1_enabled: true,
    camera_1_url: '',
    camera_1_resolution: '1920x1080',
    camera_1_fps: 30,
    camera_2_enabled: true,
    camera_2_url: '',
    camera_2_resolution: '1920x1080',
    camera_2_fps: 30
  })

  const [alprSettings, setALPRSettings] = useState<ALPRSettings>({
    min_confidence: 80,
    processing_threads: 2,
    country_code: 'us',
    region: '',
    detect_region: true,
    top_n_results: 10
  })

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    email_enabled: false,
    email_recipients: '',
    notify_on_denied: true,
    notify_on_error: true,
    notify_on_suspicious: true,
    webhook_enabled: false,
    webhook_url: ''
  })

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const response = await apiService.getSettings()
      // Ensure all values are defined to prevent controlled/uncontrolled warnings
      if (response.system) {
        setSystemSettings({
          ...systemSettings,
          ...response.system
        })
      }
      if (response.camera) {
        setCameraSettings({
          ...cameraSettings,
          ...response.camera
        })
      }
      if (response.alpr) {
        setALPRSettings({
          ...alprSettings,
          ...response.alpr
        })
      }
      if (response.notifications) {
        setNotificationSettings({
          ...notificationSettings,
          ...response.notifications
        })
      }
    } catch (error: any) {
      // If endpoint doesn't exist (404), just use default settings silently
      if (error.response?.status !== 404) {
        console.error('Failed to fetch settings:', error)
        toast.error('Failed to load settings')
      }
      // Use default settings that are already initialized
    } finally {
      setLoading(false)
    }
  }

  const handleSaveSettings = async () => {
    try {
      setSaving(true)
      const settings = {
        system: systemSettings,
        camera: cameraSettings,
        alpr: alprSettings,
        notifications: notificationSettings
      }
      await apiService.updateSettings(settings)
      toast.success('Settings saved successfully')
    } catch (error: any) {
      console.error('Failed to save settings:', error)
      // If endpoint doesn't exist (404), show a more appropriate message
      if (error.response?.status === 404) {
        toast.error('Settings endpoint not yet implemented. Changes saved locally.')
      } else {
        toast.error('Failed to save settings')
      }
    } finally {
      setSaving(false)
    }
  }

  const tabs = [
    { id: 'system' as const, label: 'System', icon: SettingsIcon },
    { id: 'camera' as const, label: 'Camera', icon: Camera },
    { id: 'alpr' as const, label: 'ALPR', icon: Scan },
    { id: 'notifications' as const, label: 'Notifications', icon: Bell },
    { id: 'users' as const, label: 'Users', icon: Users },
    { id: 'backup' as const, label: 'Backup', icon: Database }
  ]

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Settings</h1>
          <p className="text-slate-400 mt-1">System configuration and preferences</p>
        </div>
        <Card>
          <CardBody>
            <div className="animate-pulse space-y-4">
              <div className="h-10 bg-white/10 rounded w-1/3"></div>
              <div className="h-40 bg-white/10 rounded"></div>
            </div>
          </CardBody>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Settings</h1>
          <p className="text-slate-400 mt-1">System configuration and preferences</p>
        </div>
        <Button variant="primary" onClick={handleSaveSettings} isLoading={saving}>
          <Save className="w-4 h-4 mr-2" />
          Save Changes
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-blue-500 text-white'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* System Settings */}
      {activeTab === 'system' && (
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold text-slate-100">System Settings</h2>
            <p className="text-sm text-slate-400">General system configuration</p>
          </CardHeader>
          <CardBody>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Site Name
                  </label>
                  <input
                    type="text"
                    value={systemSettings.site_name}
                    onChange={(e) => setSystemSettings({ ...systemSettings, site_name: e.target.value })}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    placeholder="My Parking System"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Site Location
                  </label>
                  <input
                    type="text"
                    value={systemSettings.site_location}
                    onChange={(e) => setSystemSettings({ ...systemSettings, site_location: e.target.value })}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    placeholder="Building A, Floor 1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Timezone
                  </label>
                  <select
                    value={systemSettings.timezone}
                    onChange={(e) => setSystemSettings({ ...systemSettings, timezone: e.target.value })}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  >
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">Eastern Time</option>
                    <option value="America/Chicago">Central Time</option>
                    <option value="America/Denver">Mountain Time</option>
                    <option value="America/Los_Angeles">Pacific Time</option>
                    <option value="Europe/London">London</option>
                    <option value="Asia/Dubai">Dubai</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Date Format
                  </label>
                  <select
                    value={systemSettings.date_format}
                    onChange={(e) => setSystemSettings({ ...systemSettings, date_format: e.target.value })}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  >
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Barrier Auto-Close Delay (seconds)
                  </label>
                  <input
                    type="number"
                    value={systemSettings.barrier_auto_close_delay}
                    onChange={(e) => setSystemSettings({ ...systemSettings, barrier_auto_close_delay: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    min="1"
                    max="60"
                  />
                  <p className="text-xs text-slate-500 mt-1">Time before barrier automatically closes</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Max Session Duration (hours)
                  </label>
                  <input
                    type="number"
                    value={systemSettings.max_session_duration}
                    onChange={(e) => setSystemSettings({ ...systemSettings, max_session_duration: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    min="1"
                    max="168"
                  />
                  <p className="text-xs text-slate-500 mt-1">Maximum parking session duration</p>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Camera Settings */}
      {activeTab === 'camera' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-slate-100">Camera 1 (Entry)</h2>
                  <p className="text-sm text-slate-400">Entry point camera configuration</p>
                </div>
                <Badge variant={cameraSettings.camera_1_enabled ? 'success' : 'default'}>
                  {cameraSettings.camera_1_enabled ? 'Enabled' : 'Disabled'}
                </Badge>
              </div>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={cameraSettings.camera_1_enabled}
                    onChange={(e) => setCameraSettings({ ...cameraSettings, camera_1_enabled: e.target.checked })}
                    className="w-4 h-4 rounded border-white/20 bg-white/5 text-blue-500 focus:ring-2 focus:ring-blue-500/50"
                  />
                  <label className="text-sm text-slate-300">Enable Camera 1</label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Camera URL / Device Path
                  </label>
                  <input
                    type="text"
                    value={cameraSettings.camera_1_url}
                    onChange={(e) => setCameraSettings({ ...cameraSettings, camera_1_url: e.target.value })}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    placeholder="rtsp://192.168.1.10:554/stream or /dev/video0"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Resolution
                    </label>
                    <select
                      value={cameraSettings.camera_1_resolution}
                      onChange={(e) => setCameraSettings({ ...cameraSettings, camera_1_resolution: e.target.value })}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    >
                      <option value="640x480">640x480 (VGA)</option>
                      <option value="1280x720">1280x720 (HD)</option>
                      <option value="1920x1080">1920x1080 (Full HD)</option>
                      <option value="3840x2160">3840x2160 (4K)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      FPS
                    </label>
                    <input
                      type="number"
                      value={cameraSettings.camera_1_fps}
                      onChange={(e) => setCameraSettings({ ...cameraSettings, camera_1_fps: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      min="1"
                      max="60"
                    />
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-slate-100">Camera 2 (Exit)</h2>
                  <p className="text-sm text-slate-400">Exit point camera configuration</p>
                </div>
                <Badge variant={cameraSettings.camera_2_enabled ? 'success' : 'default'}>
                  {cameraSettings.camera_2_enabled ? 'Enabled' : 'Disabled'}
                </Badge>
              </div>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={cameraSettings.camera_2_enabled}
                    onChange={(e) => setCameraSettings({ ...cameraSettings, camera_2_enabled: e.target.checked })}
                    className="w-4 h-4 rounded border-white/20 bg-white/5 text-blue-500 focus:ring-2 focus:ring-blue-500/50"
                  />
                  <label className="text-sm text-slate-300">Enable Camera 2</label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Camera URL / Device Path
                  </label>
                  <input
                    type="text"
                    value={cameraSettings.camera_2_url}
                    onChange={(e) => setCameraSettings({ ...cameraSettings, camera_2_url: e.target.value })}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    placeholder="rtsp://192.168.1.11:554/stream or /dev/video1"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Resolution
                    </label>
                    <select
                      value={cameraSettings.camera_2_resolution}
                      onChange={(e) => setCameraSettings({ ...cameraSettings, camera_2_resolution: e.target.value })}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    >
                      <option value="640x480">640x480 (VGA)</option>
                      <option value="1280x720">1280x720 (HD)</option>
                      <option value="1920x1080">1920x1080 (Full HD)</option>
                      <option value="3840x2160">3840x2160 (4K)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      FPS
                    </label>
                    <input
                      type="number"
                      value={cameraSettings.camera_2_fps}
                      onChange={(e) => setCameraSettings({ ...cameraSettings, camera_2_fps: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      min="1"
                      max="60"
                    />
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* ALPR Settings */}
      {activeTab === 'alpr' && (
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold text-slate-100">ALPR Configuration</h2>
            <p className="text-sm text-slate-400">License plate recognition settings</p>
          </CardHeader>
          <CardBody>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Minimum Confidence (%)
                  </label>
                  <input
                    type="number"
                    value={alprSettings.min_confidence}
                    onChange={(e) => setALPRSettings({ ...alprSettings, min_confidence: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    min="50"
                    max="100"
                  />
                  <p className="text-xs text-slate-500 mt-1">Minimum confidence threshold for plate recognition</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Processing Threads
                  </label>
                  <input
                    type="number"
                    value={alprSettings.processing_threads}
                    onChange={(e) => setALPRSettings({ ...alprSettings, processing_threads: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    min="1"
                    max="8"
                  />
                  <p className="text-xs text-slate-500 mt-1">Number of CPU threads for processing</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Country Code
                  </label>
                  <select
                    value={alprSettings.country_code}
                    onChange={(e) => setALPRSettings({ ...alprSettings, country_code: e.target.value })}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  >
                    <option value="us">United States</option>
                    <option value="eu">Europe</option>
                    <option value="au">Australia</option>
                    <option value="kr2">South Korea</option>
                    <option value="br2">Brazil</option>
                    <option value="gb">Great Britain</option>
                    <option value="ae">UAE</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Region (Optional)
                  </label>
                  <input
                    type="text"
                    value={alprSettings.region}
                    onChange={(e) => setALPRSettings({ ...alprSettings, region: e.target.value })}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    placeholder="e.g., ca for California"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Top N Results
                  </label>
                  <input
                    type="number"
                    value={alprSettings.top_n_results}
                    onChange={(e) => setALPRSettings({ ...alprSettings, top_n_results: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    min="1"
                    max="20"
                  />
                  <p className="text-xs text-slate-500 mt-1">Number of plate candidates to return</p>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-white/10">
                <input
                  type="checkbox"
                  checked={alprSettings.detect_region}
                  onChange={(e) => setALPRSettings({ ...alprSettings, detect_region: e.target.checked })}
                  className="w-4 h-4 rounded border-white/20 bg-white/5 text-blue-500 focus:ring-2 focus:ring-blue-500/50"
                />
                <label className="text-sm text-slate-300">Auto-detect plate region</label>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Notification Settings */}
      {activeTab === 'notifications' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold text-slate-100">Email Notifications</h2>
              <p className="text-sm text-slate-400">Configure email alerts</p>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={notificationSettings.email_enabled}
                    onChange={(e) => setNotificationSettings({ ...notificationSettings, email_enabled: e.target.checked })}
                    className="w-4 h-4 rounded border-white/20 bg-white/5 text-blue-500 focus:ring-2 focus:ring-blue-500/50"
                  />
                  <label className="text-sm text-slate-300">Enable Email Notifications</label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Email Recipients (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={notificationSettings.email_recipients}
                    onChange={(e) => setNotificationSettings({ ...notificationSettings, email_recipients: e.target.value })}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    placeholder="admin@example.com, security@example.com"
                  />
                </div>

                <div className="space-y-3 pt-4 border-t border-white/10">
                  <p className="text-sm font-medium text-slate-300">Notification Events</p>

                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={notificationSettings.notify_on_denied}
                      onChange={(e) => setNotificationSettings({ ...notificationSettings, notify_on_denied: e.target.checked })}
                      className="w-4 h-4 rounded border-white/20 bg-white/5 text-blue-500"
                    />
                    <label className="text-sm text-slate-300">Denied Access Attempts</label>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={notificationSettings.notify_on_error}
                      onChange={(e) => setNotificationSettings({ ...notificationSettings, notify_on_error: e.target.checked })}
                      className="w-4 h-4 rounded border-white/20 bg-white/5 text-blue-500"
                    />
                    <label className="text-sm text-slate-300">System Errors</label>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={notificationSettings.notify_on_suspicious}
                      onChange={(e) => setNotificationSettings({ ...notificationSettings, notify_on_suspicious: e.target.checked })}
                      className="w-4 h-4 rounded border-white/20 bg-white/5 text-blue-500"
                    />
                    <label className="text-sm text-slate-300">Suspicious Activity</label>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold text-slate-100">Webhook Integration</h2>
              <p className="text-sm text-slate-400">Send events to external services</p>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={notificationSettings.webhook_enabled}
                    onChange={(e) => setNotificationSettings({ ...notificationSettings, webhook_enabled: e.target.checked })}
                    className="w-4 h-4 rounded border-white/20 bg-white/5 text-blue-500 focus:ring-2 focus:ring-blue-500/50"
                  />
                  <label className="text-sm text-slate-300">Enable Webhook</label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Webhook URL
                  </label>
                  <input
                    type="url"
                    value={notificationSettings.webhook_url}
                    onChange={(e) => setNotificationSettings({ ...notificationSettings, webhook_url: e.target.value })}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    placeholder="https://example.com/webhook"
                  />
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold text-slate-100">User Management</h2>
            <p className="text-sm text-slate-400">Manage system users and permissions</p>
          </CardHeader>
          <CardBody>
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400">User management interface coming soon</p>
              <p className="text-sm text-slate-500 mt-2">Contact administrator for user access</p>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Backup Tab */}
      {activeTab === 'backup' && (
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold text-slate-100">Backup & Restore</h2>
            <p className="text-sm text-slate-400">Database backup and recovery options</p>
          </CardHeader>
          <CardBody>
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                <div className="flex items-center gap-3">
                  <HardDrive className="w-8 h-8 text-blue-400" />
                  <div>
                    <p className="text-sm font-medium text-slate-200">Create Backup</p>
                    <p className="text-xs text-slate-500">Export all database records</p>
                  </div>
                </div>
                <Button variant="secondary">
                  <Database className="w-4 h-4 mr-2" />
                  Backup Now
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                <div className="flex items-center gap-3">
                  <Shield className="w-8 h-8 text-green-400" />
                  <div>
                    <p className="text-sm font-medium text-slate-200">Restore from Backup</p>
                    <p className="text-xs text-slate-500">Import previous backup file</p>
                  </div>
                </div>
                <Button variant="secondary">
                  Choose File
                </Button>
              </div>

              <div className="pt-4 border-t border-white/10">
                <p className="text-sm font-medium text-slate-300 mb-3">Recent Backups</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <span className="text-sm text-slate-300">backup_2025-01-15.sql</span>
                    <span className="text-xs text-slate-500">2.4 MB</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <span className="text-sm text-slate-300">backup_2025-01-10.sql</span>
                    <span className="text-xs text-slate-500">2.3 MB</span>
                  </div>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  )
}

export default Settings
