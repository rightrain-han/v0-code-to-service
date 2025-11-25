"use client"

import { useState } from "react"
import type { ProtectiveEquipment } from "@/types/msds"

interface ProtectiveEquipmentProps {
  equipment: ProtectiveEquipment
  size?: "sm" | "md" | "lg"
  showTooltip?: boolean
}

export function ProtectiveEquipmentComponent({ equipment, size = "md", showTooltip = true }: ProtectiveEquipmentProps) {
  const [showTooltipState, setShowTooltipState] = useState(false)
  const [imageError, setImageError] = useState(false)

  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  }

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setShowTooltipState(true)}
      onMouseLeave={() => setShowTooltipState(false)}
    >
      <div
        className={`${sizeClasses[size]} rounded-full overflow-hidden bg-blue-50 border border-blue-300 flex items-center justify-center`}
      >
        {!imageError ? (
          <img
            src={equipment.imageUrl || "/placeholder.svg"}
            alt={equipment.name}
            className="w-full h-full object-contain p-0.5"
            onError={() => setImageError(true)}
          />
        ) : (
          <span className="text-blue-600 font-bold text-[10px]">{equipment.name.charAt(0)}</span>
        )}
      </div>

      {showTooltip && showTooltipState && (
        <div className="absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-foreground text-background text-xs rounded-lg shadow-lg whitespace-nowrap">
          <div className="font-semibold">{equipment.name}</div>
          <div className="text-muted-foreground text-[10px] max-w-[200px] whitespace-normal">
            {equipment.description}
          </div>
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-foreground"></div>
        </div>
      )}
    </div>
  )
}
