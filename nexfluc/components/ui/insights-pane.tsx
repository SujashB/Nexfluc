"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

export interface InsightsPaneProps {
  messages: Array<{ source: "user" | "ai"; message: string }>
  className?: string
}

export const InsightsPane = React.forwardRef<HTMLDivElement, InsightsPaneProps>(
  ({ messages, className }, ref) => {
    const [insights, setInsights] = React.useState<string[]>([])
    const [isLoading, setIsLoading] = React.useState(false)
    const [error, setError] = React.useState<string | null>(null)
    const lastMessageCountRef = React.useRef(0)

    React.useEffect(() => {
      // Only generate insights if we have new messages and at least 2 messages
      if (messages.length < 2 || messages.length === lastMessageCountRef.current) {
        return
      }

      // Debounce: wait a bit after the last message before generating insights
      const timeoutId = setTimeout(async () => {
        setIsLoading(true)
        setError(null)

        try {
          const response = await fetch("/api/insights", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ messages }),
          })

          if (!response.ok) {
            throw new Error("Failed to generate insights")
          }

          const data = await response.json()
          setInsights(data.insights || [])
          lastMessageCountRef.current = messages.length
        } catch (err) {
          console.error("Error fetching insights:", err)
          setError("Failed to load insights")
        } finally {
          setIsLoading(false)
        }
      }, 2000) // Wait 2 seconds after last message

      return () => clearTimeout(timeoutId)
    }, [messages])

    if (messages.length < 2) {
      return null
    }

    return (
      <Card
        ref={ref}
        className={cn(
          "w-full max-w-2xl border-stone-700/50 bg-stone-900/40 backdrop-blur-md",
          className
        )}
      >
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold uppercase tracking-wider text-stone-400">
            Insights & Suggestions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-stone-400" />
              <span className="ml-2 text-sm text-stone-400">
                Generating insights...
              </span>
            </div>
          ) : error ? (
            <div className="py-4 text-sm text-red-400">{error}</div>
          ) : insights.length > 0 ? (
            <ul className="space-y-2">
              {insights.map((insight, index) => (
                <li
                  key={index}
                  className="flex items-start gap-2 text-sm text-stone-200"
                >
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-stone-500" />
                  <span>{insight}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="py-4 text-sm text-stone-500">
              No insights available yet. Continue the conversation to generate
              insights.
            </div>
          )}
        </CardContent>
      </Card>
    )
  }
)

InsightsPane.displayName = "InsightsPane"

