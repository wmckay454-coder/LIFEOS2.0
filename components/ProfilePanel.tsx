import { ProfilePanelProps } from '@/lib/types'

export default function ProfilePanel({ profile }: ProfilePanelProps) {
  return (
    <div className="bg-black/30 p-4 rounded-xl border border-indigo-900/50 hover:border-indigo-700/50 transition-all duration-300">
      <div className="text-sm space-y-2">
        <p className="flex items-center space-x-2">
          <span className="text-indigo-400">Age:</span>
          <span className="text-white/90">{profile.age}</span>
        </p>
        <p className="flex items-center space-x-2">
          <span className="text-indigo-400">Height:</span>
          <span className="text-white/90">{profile.height}</span>
        </p>
        <p className="flex items-center space-x-2">
          <span className="text-indigo-400">Weight:</span>
          <span className="text-white/90">{profile.weight}</span>
        </p>
      </div>
    </div>
  )
}
