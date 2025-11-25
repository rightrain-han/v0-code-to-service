"use client"

import { AlertCircle, CheckCircle2, Info } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface UploadStatusInfoProps {
  type: "info" | "success" | "error"
  title: string
  description?: string
}

export function UploadStatusInfo({ type, title, description }: UploadStatusInfoProps) {
  const variants = {
    info: {
      icon: Info,
      className: "border-blue-200 bg-blue-50 text-blue-800",
    },
    success: {
      icon: CheckCircle2,
      className: "border-green-200 bg-green-50 text-green-800",
    },
    error: {
      icon: AlertCircle,
      className: "border-red-200 bg-red-50 text-red-800",
    },
  }

  const { icon: Icon, className } = variants[type]

  return (
    <Alert className={className}>
      <Icon className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      {description && <AlertDescription>{description}</AlertDescription>}
    </Alert>
  )
}
