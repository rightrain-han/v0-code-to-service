"use client"

import { useState } from "react"
import type { WarningSymbol } from "@/types/msds"

interface WarningSymbolProps {
  symbol: WarningSymbol
  size?: "sm" | "md" | "lg"
  showTooltip?: boolean
}

export function WarningSymbolComponent({ symbol, size = "md", showTooltip = true }: WarningSymbolProps) {
  const [showTooltipState, setShowTooltipState] = useState(false)
  const [imageError, setImageError] = useState(false)

  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
  }

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setShowTooltipState(true)}
      onMouseLeave={() => setShowTooltipState(false)}
    >
      <div
        className={`${sizeClasses[size]} rounded-lg overflow-hidden bg-amber-50 border-2 border-amber-400 flex items-center justify-center shadow-sm hover:shadow-md transition-shadow`}
      >
        {!imageError ? (
          <img
            src={symbol.imageUrl || "/placeholder.svg"}
            alt={symbol.name}
            className="w-full h-full object-contain p-1"
            onError={() => setImageError(true)}
          />
        ) : (
          <span className="text-amber-600 font-bold text-xs">{symbol.name.charAt(0)}</span>
        )}
      </div>

      {showTooltip && showTooltipState && (
        <div className="absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-foreground text-background text-xs rounded-lg shadow-lg whitespace-nowrap">
          <div className="font-semibold">{symbol.name}</div>
          <div className="text-muted-foreground text-[10px] max-w-[200px] whitespace-normal">{symbol.description}</div>
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-foreground"></div>
        </div>
      )}
    </div>
  )
}
