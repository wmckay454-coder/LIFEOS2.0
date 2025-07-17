'use client'
import React from 'react'
import { dataManager } from '@/lib/utils/dataManager'

interface BackupReminderProps {
  onClose: () => void
  onBackup: () => void
}

export default function BackupReminder({ onClose, onBackup }: BackupReminderProps) {
  const handleBackup = () => {
    dataManager.downloadBackup()
    dataManager.markBackupReminderShown()
    onBackup()
    onClose()
  }

  const handleSkip = () => {
    dataManager.markBackupReminderShown()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-orange-950 to-red-950 border border-orange-800/50 rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-white text-xl">💾</span>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Backup Reminder</h2>
          <p className="text-gray-300 text-sm">
            It&apos;s been a week since your last backup. Keep your progress safe by downloading a backup file.
          </p>
        </div>

        <div className="space-y-3">
          <div className="bg-orange-900/30 p-3 rounded-lg border border-orange-800/50">
            <h4 className="text-orange-300 font-medium text-sm mb-1">Why backup?</h4>
            <ul className="text-gray-300 text-xs space-y-1">
              <li>• Protect against browser data clearing</li>
              <li>• Transfer data between devices</li>
              <li>• Restore if something goes wrong</li>
            </ul>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={handleSkip}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg text-sm transition-colors"
            >
              Remind Later
            </button>
            <button
              onClick={handleBackup}
              className="flex-1 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white py-2 rounded-lg text-sm transition-all duration-300 transform hover:scale-105"
            >
              Download Backup
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
