import React, { useState, useEffect } from 'react';
import {
  Cog6ToothIcon,
  BellIcon,
  ShieldCheckIcon,
  UserCircleIcon,
  KeyIcon,
  GlobeAltIcon,
  PaintBrushIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../components/UI/LoadingSpinner';

interface SystemSettings {
  company_name: string;
  system_email: string;
  default_language: string;
  timezone: string;
  session_timeout: number;
  password_requirements: {
    min_length: number;
    require_uppercase: boolean;
    require_lowercase: boolean;
    require_numbers: boolean;
    require_symbols: boolean;
  };
  two_factor_enabled: boolean;
}

interface NotificationSettings {
  new_risk_assessment: { email: boolean; in_app: boolean };
  assessment_complete: { email: boolean; in_app: boolean };
  high_risk_alert: { email: boolean; in_app: boolean };
  user_activity: { email: boolean; in_app: boolean };
  system_updates: { email: boolean; in_app: boolean };
}

const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    company_name: 'ToluAI Insurance Platform',
    system_email: 'system@toluai.com',
    default_language: 'en',
    timezone: 'UTC-5',
    session_timeout: 30,
    password_requirements: {
      min_length: 8,
      require_uppercase: true,
      require_lowercase: true,
      require_numbers: true,
      require_symbols: false,
    },
    two_factor_enabled: true,
  });

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    new_risk_assessment: { email: true, in_app: true },
    assessment_complete: { email: true, in_app: true },
    high_risk_alert: { email: true, in_app: true },
    user_activity: { email: false, in_app: true },
    system_updates: { email: true, in_app: true },
  });

  const tabs = [
    { id: 'general', label: 'General', icon: Cog6ToothIcon },
    { id: 'profile', label: 'Profile', icon: UserCircleIcon },
    { id: 'security', label: 'Security', icon: ShieldCheckIcon },
    { id: 'notifications', label: 'Notifications', icon: BellIcon },
    { id: 'api', label: 'API Settings', icon: KeyIcon },
    { id: 'appearance', label: 'Appearance', icon: PaintBrushIcon },
  ];

  useEffect(() => {
    // In a real implementation, load settings from API
    // For now, we'll use the default values
  }, []);

  const saveSettings = async () => {
    try {
      setSaving(true);
      setError(null);

      // In a real implementation, you would call the API to save settings
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API call

      setSuccess('Settings saved successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const updateSystemSetting = <K extends keyof SystemSettings>(
    key: K,
    value: SystemSettings[K]
  ) => {
    setSystemSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const updateNotificationSetting = (
    key: keyof NotificationSettings,
    type: 'email' | 'in_app',
    value: boolean
  ) => {
    setNotificationSettings((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        [type]: value,
      },
    }));
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
        <p className="text-sm text-gray-600 mt-1">Configure system preferences and settings</p>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <ExclamationTriangleIcon className="w-5 h-5 text-red-400" />
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex">
            <CheckCircleIcon className="w-5 h-5 text-green-400" />
            <div className="ml-3">
              <p className="text-sm text-green-800">{success}</p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="flex border-b border-gray-200">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-6 py-4 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-5 h-5 mr-2" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="p-6">
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">General Settings</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Company Name
                    </label>
                    <input
                      type="text"
                      value={systemSettings.company_name}
                      onChange={(e) => updateSystemSetting('company_name', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      System Email
                    </label>
                    <input
                      type="email"
                      value={systemSettings.system_email}
                      onChange={(e) => updateSystemSetting('system_email', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Default Language
                    </label>
                    <select
                      value={systemSettings.default_language}
                      onChange={(e) => updateSystemSetting('default_language', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="en">English</option>
                      <option value="es">Spanish</option>
                      <option value="fr">French</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Time Zone
                    </label>
                    <select
                      value={systemSettings.timezone}
                      onChange={(e) => updateSystemSetting('timezone', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="UTC-5">UTC-5 (Eastern Time)</option>
                      <option value="UTC-6">UTC-6 (Central Time)</option>
                      <option value="UTC-7">UTC-7 (Mountain Time)</option>
                      <option value="UTC-8">UTC-8 (Pacific Time)</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    // Reset to original values (in a real app, fetch from API)
                    setSystemSettings({
                      company_name: 'ToluAI Insurance Platform',
                      system_email: 'system@toluai.com',
                      default_language: 'en',
                      timezone: 'UTC-5',
                      session_timeout: 30,
                      password_requirements: {
                        min_length: 8,
                        require_uppercase: true,
                        require_lowercase: true,
                        require_numbers: true,
                        require_symbols: false,
                      },
                      two_factor_enabled: true,
                    });
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  onClick={saveSettings}
                  disabled={saving}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {saving && <LoadingSpinner size="small" />}
                  <span className={saving ? 'ml-2' : ''}>
                    {saving ? 'Saving...' : 'Save Changes'}
                  </span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Security Settings</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">Two-Factor Authentication</p>
                      <p className="text-sm text-gray-600">
                        Add an extra layer of security to your account
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={systemSettings.two_factor_enabled}
                        onChange={(e) =>
                          updateSystemSetting('two_factor_enabled', e.target.checked)
                        }
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">Session Timeout</p>
                      <p className="text-sm text-gray-600">
                        Automatically log out after inactivity
                      </p>
                    </div>
                    <select
                      value={systemSettings.session_timeout}
                      onChange={(e) =>
                        updateSystemSetting('session_timeout', parseInt(e.target.value))
                      }
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value={15}>15 minutes</option>
                      <option value={30}>30 minutes</option>
                      <option value={60}>1 hour</option>
                      <option value={120}>2 hours</option>
                    </select>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="font-medium text-gray-900">Password Requirements</p>
                        <p className="text-sm text-gray-600">
                          Configure password complexity requirements
                        </p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">Minimum length</span>
                        <select
                          value={systemSettings.password_requirements.min_length}
                          onChange={(e) =>
                            updateSystemSetting('password_requirements', {
                              ...systemSettings.password_requirements,
                              min_length: parseInt(e.target.value),
                            })
                          }
                          className="px-3 py-1 border border-gray-300 rounded text-sm"
                        >
                          <option value={6}>6 characters</option>
                          <option value={8}>8 characters</option>
                          <option value={10}>10 characters</option>
                          <option value={12}>12 characters</option>
                        </select>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">Require uppercase letters</span>
                        <input
                          type="checkbox"
                          checked={systemSettings.password_requirements.require_uppercase}
                          onChange={(e) =>
                            updateSystemSetting('password_requirements', {
                              ...systemSettings.password_requirements,
                              require_uppercase: e.target.checked,
                            })
                          }
                          className="rounded border-gray-300"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">Require numbers</span>
                        <input
                          type="checkbox"
                          checked={systemSettings.password_requirements.require_numbers}
                          onChange={(e) =>
                            updateSystemSetting('password_requirements', {
                              ...systemSettings.password_requirements,
                              require_numbers: e.target.checked,
                            })
                          }
                          className="rounded border-gray-300"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">Require symbols</span>
                        <input
                          type="checkbox"
                          checked={systemSettings.password_requirements.require_symbols}
                          onChange={(e) =>
                            updateSystemSetting('password_requirements', {
                              ...systemSettings.password_requirements,
                              require_symbols: e.target.checked,
                            })
                          }
                          className="rounded border-gray-300"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setSystemSettings((prev) => ({
                      ...prev,
                      two_factor_enabled: true,
                      session_timeout: 30,
                      password_requirements: {
                        min_length: 8,
                        require_uppercase: true,
                        require_lowercase: true,
                        require_numbers: true,
                        require_symbols: false,
                      },
                    }));
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={saving}
                >
                  Reset to Defaults
                </button>
                <button
                  onClick={saveSettings}
                  disabled={saving}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {saving && <LoadingSpinner size="small" />}
                  <span className={saving ? 'ml-2' : ''}>
                    {saving ? 'Saving...' : 'Save Changes'}
                  </span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Notification Preferences</h3>
                <div className="space-y-4">
                  {Object.entries(notificationSettings).map(([key, settings]) => {
                    const labels = {
                      new_risk_assessment: {
                        label: 'New Risk Assessment',
                        description: 'When a new risk assessment is created',
                      },
                      assessment_complete: {
                        label: 'Assessment Complete',
                        description: 'When an assessment is completed',
                      },
                      high_risk_alert: {
                        label: 'High Risk Alert',
                        description: 'When a high risk is detected',
                      },
                      user_activity: {
                        label: 'User Activity',
                        description: 'Important user account activities',
                      },
                      system_updates: {
                        label: 'System Updates',
                        description: 'System maintenance and updates',
                      },
                    };

                    const item = labels[key as keyof typeof labels];

                    return (
                      <div
                        key={key}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-gray-900">{item.label}</p>
                          <p className="text-sm text-gray-600">{item.description}</p>
                        </div>
                        <div className="flex space-x-4">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              className="mr-2 rounded border-gray-300"
                              checked={settings.email}
                              onChange={(e) =>
                                updateNotificationSetting(
                                  key as keyof NotificationSettings,
                                  'email',
                                  e.target.checked
                                )
                              }
                            />
                            <span className="text-sm text-gray-700">Email</span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              className="mr-2 rounded border-gray-300"
                              checked={settings.in_app}
                              onChange={(e) =>
                                updateNotificationSetting(
                                  key as keyof NotificationSettings,
                                  'in_app',
                                  e.target.checked
                                )
                              }
                            />
                            <span className="text-sm text-gray-700">In-App</span>
                          </label>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setNotificationSettings({
                      new_risk_assessment: { email: true, in_app: true },
                      assessment_complete: { email: true, in_app: true },
                      high_risk_alert: { email: true, in_app: true },
                      user_activity: { email: false, in_app: true },
                      system_updates: { email: true, in_app: true },
                    });
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={saving}
                >
                  Reset to Defaults
                </button>
                <button
                  onClick={saveSettings}
                  disabled={saving}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {saving && <LoadingSpinner size="small" />}
                  <span className={saving ? 'ml-2' : ''}>
                    {saving ? 'Saving...' : 'Save Changes'}
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
