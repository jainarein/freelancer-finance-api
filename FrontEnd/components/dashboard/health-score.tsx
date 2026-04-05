"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface HealthScoreProps {
  score: number
  maxScore?: number
}

export function HealthScore({ score, maxScore = 100 }: HealthScoreProps) {
  const percentage = (score / maxScore) * 100
  const circumference = 2 * Math.PI * 45
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  const getScoreColor = () => {
    if (percentage >= 70) return "text-success"
    if (percentage >= 40) return "text-warning"
    return "text-destructive"
  }

  const getStrokeColor = () => {
    if (percentage >= 70) return "stroke-success"
    if (percentage >= 40) return "stroke-warning"
    return "stroke-destructive"
  }

  const getScoreLabel = () => {
    if (percentage >= 70) return "Excellent"
    if (percentage >= 40) return "Good"
    return "Needs Attention"
  }

  return (
    <Card className="border-border/50 bg-card">
      <CardHeader>
        <CardTitle className="text-base font-medium text-foreground">
          Financial Health Score
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center pb-6">
        <div className="relative">
          <svg className="h-32 w-32 -rotate-90 transform">
            <circle
              cx="64"
              cy="64"
              r="45"
              stroke="currentColor"
              strokeWidth="10"
              fill="none"
              className="text-secondary"
            />
            <circle
              cx="64"
              cy="64"
              r="45"
              stroke="currentColor"
              strokeWidth="10"
              fill="none"
              strokeLinecap="round"
              className={cn("transition-all duration-1000", getStrokeColor())}
              style={{
                strokeDasharray: circumference,
                strokeDashoffset: strokeDashoffset,
              }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={cn("text-3xl font-bold", getScoreColor())}>
              {score}
            </span>
            <span className="text-xs text-muted-foreground">/ {maxScore}</span>
          </div>
        </div>
        <p className={cn("mt-4 text-sm font-medium", getScoreColor())}>
          {getScoreLabel()}
        </p>
      </CardContent>
    </Card>
  )
}
