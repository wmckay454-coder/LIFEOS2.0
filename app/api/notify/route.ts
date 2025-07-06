import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const notificationData = {
      title: body.title || "Life OS Notification",
      body: body.body || "You have a new notification",
      icon: body.icon || "/icon-192x192.png",
      badge: body.badge || "/icon-192x192.png",
      tag: body.tag || `notification-${Date.now()}`,
      data: body.data || {},
      requireInteraction: body.requireInteraction || false,
      silent: body.silent || false,
      timestamp: Date.now(),
      url: body.url || "/",
    }

    // In a real application, you would send this to a push service
    // For testing purposes, we'll return the notification data
    console.log("Notification API called with data:", notificationData)

    return NextResponse.json({
      success: true,
      message: "Notification data processed",
      notification: notificationData,
    })
  } catch (error) {
    console.error("Error in notification API:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to process notification request",
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Notification API is running",
    endpoints: {
      POST: "/api/notify - Send notification data",
    },
  })
}
