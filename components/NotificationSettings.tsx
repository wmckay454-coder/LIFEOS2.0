'use client'
import React, { useState, useEffect } from 'react'
import { NotificationManager } from '@/lib/utils/notificationManager'

interface NotificationSettingsProps {
  preferredCheckInTime: string
  onTimeChange: (time: string) => void
  habits: any[]
  onHabitReminder: (habitName: string) => void
  onCheckInReminder: () => void
}

export default function NotificationSettings({ 
  preferredCheckInTime, 
  onTimeChange, 
  habits, 
  onHabitReminder, 
  onCheckInReminder 
}: NotificationSettingsProps) {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const [habitReminders, setHabitReminders] = useState(true)
  const [checkInReminders, setCheckInReminders] = useState(true)

  useEffect(() => {
    setNotificationsEnabled(NotificationManager.isEnabled())
  }, [])

  const handleEnableNotifications = async () => {
    const granted = await NotificationManager.requestPermission()
    setNotificationsEnabled(granted)
    
    if (granted) {
      // Schedule initial reminders
      if (habitReminders) {
        NotificationManager.scheduleHabitReminders(habits, onHabitReminder)
      }
      if (checkInReminders) {
        NotificationManager.scheduleCheckInReminder(preferredCheckInTime, onCheckInReminder)
      }
    }
  }

  const handleTimeChange = (newTime: string) => {
    onTimeChange(newTime)
    if (notificationsEnabled && checkInReminders) {
      NotificationManager.scheduleCheckInReminder(newTime, onCheckInReminder)
    }
  }

  const handleHabitRemindersToggle = (enabled: boolean) => {
    setHabitReminders(enabled)
    if (notificationsEnabled && enabled) {
      NotificationManager.scheduleHabitReminders(habits, onHabitReminder)
    }
  }

  const testNotification = () => {
    NotificationManager.showNotification('Test Notification', {
      body: 'Notifications are working correctly!',
      tag: 'test'
    })
  }

  return (
    <div className="bg-black/40 border border-indigo-800/50 rounded-2xl p-6">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
        <span className="mr-3">🔔</span>
        Notification Settings
      </h3>

      <div className="space-y-4">
        {/* Enable Notifications */}
        <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
          <div>
            <h4 className="text-white font-medium text-sm">Enable Notifications</h4>
            <p className="text-gray-400 text-xs">
              {NotificationManager.isSupported() 
                ? 'Get reminders for habits and check-ins' 
                : 'Notifications not supported in this browser'}
            </p>
          </div>
          {NotificationManager.isSupported() && (
            <button
              onClick={handleEnableNotifications}
              disabled={notificationsEnabled}
              className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                notificationsEnabled
                  ? 'bg-green-600 text-white cursor-default'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              }`}
            >
              {notificationsEnabled ? 'Enabled' : 'Enable'}
            </button>
          )}
        </div>

        {notificationsEnabled && (
          <>
            {/* Check-in Time */}
            <div className="p-3 bg-gray-800/50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h4 className="text-white font-medium text-sm">Daily Check-in Time</h4>
                  <p className="text-gray-400 text-xs">When to remind you for daily check-in</p>
                </div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={checkInReminders}
                    onChange={(e) => setCheckInReminders(e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-300">Enable</span>
                </label>
              </div>
              <input
                type="time"
                value={preferredCheckInTime}
                onChange={(e) => handleTimeChange(e.target.value)}
                disabled={!checkInReminders}
                className="w-full bg-black/50 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
              />
            </div>

            {/* Habit Reminders */}
            <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
              <div>
                <h4 className="text-white font-medium text-sm">Habit Reminders</h4>
                <p className="text-gray-400 text-xs">Remind me about incomplete habits at 8 PM</p>
              </div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={habitReminders}
                  onChange={(e) => handleHabitRemindersToggle(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-300">Enable</span>
              </label>
            </div>

            {/* Test Notification */}
            <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
              <div>
                <h4 className="text-white font-medium text-sm">Test Notifications</h4>
                <p className="text-gray-400 text-xs">Send a test notification to verify setup</p>
              </div>
              <button
                onClick={testNotification}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
              >
                Test
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
