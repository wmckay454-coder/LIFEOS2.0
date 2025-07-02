"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import HomePanel from "@/components/HomePanel"
import StatsPanel from "@/components/StatsPanel"
import JournalPanel from "@/components/JournalPanel"
import TodoPanel from "@/components/TodoPanel"
import HabitTracker from "@/components/HabitTracker"
import DailyCheckIn from "@/components/DailyCheckIn"
import MissionsPanel from "@/components/MissionsPanel"
import ProfilePanel from "@/components/ProfilePanel"
import NotificationSettings from "@/components/NotificationSettings"
import SmartDashboard from "@/components/SmartDashboard"
import MoodPredictionPanel from "@/components/MoodPredictionPanel"
import AICopilot from "@/components/AICopilot"
import DataManager from "@/components/DataManager"
import PWAStatus from "@/components/PWAStatus"
import Gatekeeper from "@/components/Gatekeeper"
import { calculateLevel, calculateTotalXP } from "@/app/utils/xpLogix"
import { DataManager as DM, generateDailyMissions } from "@/lib/utils/dataManager"
import type { Stats, JournalEntry, Todo, CheckInData, Habit, Mission, Profile, FloatingXP } from "@/lib/types"
import {
  Home,
  BarChart3,
  BookOpen,
  CheckSquare,
  Target,
  Calendar,
  User,
  Settings,
  Brain,
  TrendingUp,
  Menu,
  X,
  Smartphone,
} from "lucide-react"

export default function LifeOSApp() {
  // Core state
  const [currentView, setCurrentView] = useState("home")
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)

  // User data state
  const [stats, setStats] = useState<Stats>({ MIND: 0, BODY: 0, SPIRIT: 0, WORK: 0, PLAY: 0 })
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([])
  const [todos, setTodos] = useState<Todo[]>([])
  const [checkIns, setCheckIns] = useState<CheckInData[]>([])
  const [habits, setHabits] = useState<Habit[]>([])
  const [missions, setMissions] = useState<Mission[]>([])
  const [floatingXP, setFloatingXP] = useState<FloatingXP[]>([])
  const [preferredCheckInTime, setPreferredCheckInTime] = useState("20:00")

  // Profile state
  const [profile, setProfile] = useState<Profile>({
    age: 25,
    height: "5'8\"",
    weight: "150 lbs",
  })

  // Initialize data manager and load data
  useEffect(() => {
    initializeApp()
    setupSharedContentListener()
  }, [])

  const initializeApp = async () => {
    try {
      // Initialize data manager with migration and backup
      await DM.initialize()

      // Load complete user data
      const userData = await DM.loadCompleteData()

      // Set state from loaded data
      setProfile(userData.profile)
      setStats(userData.stats)
      setHabits(userData.habits)
      setJournalEntries(userData.journalEntries)
      setCheckIns(userData.checkIns)
      setTodos(userData.todos)
      setMissions(userData.missions)
      setPreferredCheckInTime(userData.settings.preferredCheckInTime)

      // Generate today's missions if needed
      await generateTodaysMissions()

      setIsInitialized(true)
    } catch (error) {
      console.error("Failed to initialize app:", error)
      // Still allow app to run with default data
      setIsInitialized(true)
    }
  }

  const setupSharedContentListener = () => {
    window.addEventListener("shared-content", (event: any) => {
      const { title, text, url } = event.detail

      // Add shared content as journal entry
      if (text) {
        handleAddJournalEntry(`Shared: ${text}`, 5, ["shared"])
      }
    })
  }

  const saveUserData = async () => {
    if (!isInitialized) return

    try {
      const userData = await DM.loadCompleteData()

      // Update with current state
      userData.profile = profile
      userData.stats = stats
      userData.habits = habits
      userData.journalEntries = journalEntries
      userData.checkIns = checkIns
      userData.todos = todos
      userData.missions = missions
      userData.settings.preferredCheckInTime = preferredCheckInTime

      await DM.saveCompleteData(userData)
    } catch (error) {
      console.error("Failed to save user data:", error)
    }
  }

  // Auto-save when data changes
  useEffect(() => {
    if (isInitialized) {
      saveUserData()
    }
  }, [stats, journalEntries, todos, checkIns, habits, profile, preferredCheckInTime, missions, isInitialized])

  const generateTodaysMissions = async () => {
    const today = new Date().toDateString()
    const userData = await DM.loadCompleteData()

    // Check if we already have missions for today
    const todaysMissions = userData.missions.filter((m) => new Date(m.id.split("_")[1]).toDateString() === today)

    if (todaysMissions.length === 0) {
      const newMissions = generateDailyMissions()
      setMissions((prev) => [...prev, ...newMissions])
    }
  }

  // XP and level calculations
  const totalXP = calculateTotalXP(stats)
  const level = calculateLevel(totalXP)
  const recentCheckIn = checkIns.length > 0 ? checkIns[checkIns.length - 1] : null

  // Event handlers
  const handleXPAdd = (stat: keyof Stats, baseXP: number) => {
    const newFloatingXP: FloatingXP = {
      id: Date.now().toString(),
      stat,
      amount: baseXP,
      timestamp: Date.now(),
    }

    setFloatingXP((prev) => [...prev, newFloatingXP])
    setStats((prev) => ({ ...prev, [stat]: prev[stat] + baseXP }))

    setTimeout(() => {
      setFloatingXP((prev) => prev.filter((f) => f.id !== newFloatingXP.id))
    }, 1000)
  }

  const handleQuickCheckIn = (mood: number, energy: number, emoji?: string) => {
    const newCheckIn: CheckInData = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      mood,
      energy,
      emoji,
      notes: "",
    }
    setCheckIns((prev) => [...prev, newCheckIn])
    handleXPAdd("SPIRIT", 5)
  }

  const handleAddJournalEntry = (content: string, mood: number, tags: string[]) => {
    const newEntry: JournalEntry = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      content,
      mood,
      tags,
    }
    setJournalEntries((prev) => [...prev, newEntry])
    handleXPAdd("MIND", 15)
  }

  const handleAddTodo = (text: string) => {
    const newTodo: Todo = {
      id: Date.now().toString(),
      text,
      completed: false,
      createdAt: new Date().toISOString(),
      xpReward: 10,
    }
    setTodos((prev) => [...prev, newTodo])
  }

  const handleCompleteTodo = (id: string) => {
    const todo = todos.find((t) => t.id === id)
    if (todo && !todo.completed) {
      setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, completed: true } : t)))
      handleXPAdd("WORK", todo.xpReward)
    }
  }

  const handleDeleteTodo = (id: string) => {
    setTodos((prev) => prev.filter((t) => t.id !== id))
  }

  const handleCompleteMission = (missionId: string) => {
    const mission = missions.find((m) => m.id === missionId)
    if (mission && !mission.completed) {
      setMissions((prev) => prev.map((m) => (m.id === missionId ? { ...m, completed: true } : m)))
      handleXPAdd(mission.stat as keyof Stats, mission.xpReward)
    }
  }

  const handleAddGoal = (goal: any) => {
    console.log("Adding goal:", goal)
  }

  const handleDismissAlert = (alertId: string) => {
    console.log("Dismissing alert:", alertId)
  }

  const handleHabitReminder = (habitName: string) => {
    console.log("Habit reminder:", habitName)
  }

  const handleCheckInReminder = () => {
    console.log("Check-in reminder triggered")
  }

  const todaysMission = missions.find((m) => !m.completed) || null

  // Navigation items
  const navItems = [
    { id: "home", label: "Home", icon: Home },
    { id: "stats", label: "Stats", icon: BarChart3 },
    { id: "journal", label: "Journal", icon: BookOpen },
    { id: "todos", label: "Quests", icon: CheckSquare },
    { id: "habits", label: "Habits", icon: Target },
    { id: "checkin", label: "Check-in", icon: Calendar },
    { id: "missions", label: "Missions", icon: Target },
    { id: "smart", label: "AI Dashboard", icon: Brain },
    { id: "mood", label: "Mood AI", icon: TrendingUp },
    { id: "profile", label: "Profile", icon: User },
    { id: "pwa", label: "PWA Status", icon: Smartphone },
    { id: "settings", label: "Settings", icon: Settings },
  ]

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <Card className="bg-black/20 backdrop-blur-xl border-white/10 shadow-2xl">
          <CardContent className="p-8 text-center">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold text-xl">L</span>
            </div>
            <h2 className="text-white text-xl font-bold mb-2">Initializing LIFE OS</h2>
            <p className="text-gray-300">Setting up your personal growth system...</p>
            <div className="mt-4 w-full bg-gray-700 rounded-full h-2">
              <div className="bg-purple-600 h-2 rounded-full animate-pulse w-3/4"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Gatekeeper onUnlock={() => setIsAuthenticated(true)} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Mobile Header */}
      <div className="lg:hidden sticky top-0 z-50 bg-black/20 backdrop-blur-xl border-b border-white/10">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-sm">L</span>
            </div>
            <div>
              <h1 className="text-white font-bold text-lg">LIFE OS</h1>
              <p className="text-purple-300 text-xs">Level {level}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-white hover:bg-white/10"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="absolute top-full left-0 right-0 bg-black/95 backdrop-blur-xl border-b border-white/10">
            <div className="grid grid-cols-2 gap-2 p-4">
              {navItems.map((item) => {
                const Icon = item.icon
                return (
                  <Button
                    key={item.id}
                    variant={currentView === item.id ? "default" : "ghost"}
                    onClick={() => {
                      setCurrentView(item.id)
                      setIsMobileMenuOpen(false)
                    }}
                    className="justify-start text-white hover:bg-white/10 h-12"
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {item.label}
                  </Button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      <div className="flex">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block w-80 min-h-screen bg-black/20 backdrop-blur-xl border-r border-white/10">
          <div className="p-6">
            {/* Logo */}
            <div className="flex items-center space-x-3 mb-8">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/25">
                <span className="text-white font-bold text-xl">L</span>
              </div>
              <div>
                <h1 className="text-white font-bold text-2xl">LIFE OS</h1>
                <p className="text-purple-300 text-sm">Your Personal Growth System</p>
              </div>
            </div>

            {/* Level Progress */}
            <Card className="mb-6 bg-gradient-to-r from-purple-900/50 to-pink-900/50 border-purple-500/20 shadow-xl">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-semibold">Level {level}</span>
                  <Badge variant="secondary" className="bg-purple-500/20 text-purple-300">
                    {totalXP} XP
                  </Badge>
                </div>
                <div className="w-full bg-black/30 h-3 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
                    style={{ width: `${((totalXP % 500) / 500) * 100}%` }}
                  />
                </div>
                <p className="text-purple-300 text-xs mt-1">{500 - (totalXP % 500)} XP to next level</p>
              </CardContent>
            </Card>

            {/* Navigation */}
            <nav className="space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = currentView === item.id
                return (
                  <Button
                    key={item.id}
                    variant="ghost"
                    onClick={() => setCurrentView(item.id)}
                    className={`w-full justify-start h-12 rounded-xl transition-all duration-200 ${
                      isActive
                        ? "bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-white border border-purple-500/30 shadow-lg shadow-purple-500/10"
                        : "text-gray-300 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    {item.label}
                  </Button>
                )
              })}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-h-screen">
          <div className="p-4 lg:p-8 max-w-7xl mx-auto">
            {currentView === "home" && (
              <HomePanel
                stats={stats}
                onQuickCheckIn={handleQuickCheckIn}
                todaysMission={todaysMission}
                onCompleteMission={handleCompleteMission}
                level={level}
                totalXP={totalXP}
                recentMood={recentCheckIn?.mood || 0}
                recentEnergy={recentCheckIn?.energy || 0}
              />
            )}

            {currentView === "stats" && (
              <StatsPanel
                stats={stats}
                handleXPAdd={handleXPAdd}
                floatingXP={floatingXP}
                journalEntries={journalEntries}
                checkIns={checkIns}
                habits={habits}
              />
            )}

            {currentView === "journal" && (
              <JournalPanel
                entries={journalEntries}
                onAddEntry={handleAddJournalEntry}
                checkIns={checkIns}
                stats={stats}
              />
            )}

            {currentView === "todos" && (
              <TodoPanel
                todos={todos}
                onAddTodo={handleAddTodo}
                onCompleteTodo={handleCompleteTodo}
                onDeleteTodo={handleDeleteTodo}
                checkIns={checkIns}
                stats={stats}
              />
            )}

            {currentView === "habits" && (
              <HabitTracker habits={habits} onUpdateHabits={setHabits} onXPGain={handleXPAdd} />
            )}

            {currentView === "checkin" && (
              <DailyCheckIn onCheckIn={handleQuickCheckIn} recentCheckIns={checkIns} onXPGain={handleXPAdd} />
            )}

            {currentView === "missions" && (
              <MissionsPanel missions={missions} onCompleteMission={handleCompleteMission} />
            )}

            {currentView === "smart" && (
              <SmartDashboard
                stats={stats}
                habits={habits}
                checkIns={checkIns}
                journalEntries={journalEntries}
                todos={todos}
                onAddGoal={handleAddGoal}
                onDismissAlert={handleDismissAlert}
              />
            )}

            {currentView === "mood" && (
              <MoodPredictionPanel checkIns={checkIns} journalEntries={journalEntries} habits={habits} stats={stats} />
            )}

            {currentView === "pwa" && <PWAStatus />}

            {currentView === "profile" && (
              <div className="space-y-6">
                <Card className="bg-black/20 backdrop-blur-xl border-white/10 shadow-2xl">
                  <CardContent className="p-6">
                    <h2 className="text-2xl font-bold text-white mb-4">Profile</h2>
                    <ProfilePanel profile={profile} />
                  </CardContent>
                </Card>
                <DataManager />
              </div>
            )}

            {currentView === "settings" && (
              <div className="space-y-6">
                <Card className="bg-black/20 backdrop-blur-xl border-white/10 shadow-2xl">
                  <CardContent className="p-6">
                    <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                      <Settings className="w-6 h-6 mr-3" />
                      Settings
                    </h2>
                    <NotificationSettings
                      preferredCheckInTime={preferredCheckInTime}
                      onTimeChange={setPreferredCheckInTime}
                      habits={habits}
                      onHabitReminder={handleHabitReminder}
                      onCheckInReminder={handleCheckInReminder}
                    />
                  </CardContent>
                </Card>
                <AICopilot
                  stats={stats}
                  recentMood={recentCheckIn?.mood ?? 5}
                  recentEnergy={recentCheckIn?.energy ?? 5}
                  habits={habits}
                  missions={missions}
                  journalEntries={journalEntries}
                  checkIns={checkIns}
                  onSuggestMission={(mission) => setMissions((prev) => [...prev, mission])}
                  onAddJournalEntry={handleAddJournalEntry}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
