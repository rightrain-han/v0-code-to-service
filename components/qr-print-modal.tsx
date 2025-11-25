"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Download, Printer } from "lucide-react"
import { QRCodeComponent } from "./qr-code"
import type { MsdsItem } from "@/types/msds"

interface QRPrintModalProps {
  isOpen: boolean
  onClose: () => void
  msdsItem: MsdsItem | null
}

export function QRPrintModal({ isOpen, onClose, msdsItem }: QRPrintModalProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const printRef = useRef<HTMLDivElement>(null)

  if (!msdsItem) return null

  const qrValue = typeof window !== "undefined" ? `${window.location.origin}/msds/${msdsItem.id}` : ""

  const handlePrint = () => {
    if (printRef.current) {
      const printWindow = window.open("", "_blank")
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>MSDS QR코드 - ${msdsItem.name}</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 0; padding: 20px; display: flex; flex-direction: column; align-items: center; }
                .qr-container { text-align: center; border: 2px solid #000; padding: 20px; margin: 20px; border-radius: 8px; }
                .qr-title { font-size: 18px; font-weight: bold; margin-bottom: 10px; }
                .qr-info { font-size: 12px; color: #666; margin-top: 10px; }
              </style>
            </head>
            <body>
              <div class="qr-container">
                <div class="qr-title">${msdsItem.name}</div>
                ${printRef.current?.innerHTML}
                <div class="qr-info">ID: ${msdsItem.id}</div>
                <div class="qr-info">용도: ${msdsItem.usage}</div>
              </div>
            </body>
          </html>
        `)
        printWindow.document.close()
        printWindow.print()
        printWindow.close()
      }
    }
  }

  const handleDownloadPNG = async () => {
    setIsGenerating(true)
    try {
      const QRCodeLib = (await import("qrcode")).default
      const qrDataURL = await QRCodeLib.toDataURL(qrValue, {
        width: 300,
        margin: 2,
        color: { dark: "#000000", light: "#FFFFFF" },
      })

      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      if (!ctx) return

      canvas.width = 400
      canvas.height = 450
      ctx.fillStyle = "#FFFFFF"
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.strokeStyle = "#000000"
      ctx.lineWidth = 2
      ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20)
      ctx.fillStyle = "#000000"
      ctx.font = "bold 18px Arial"
      ctx.textAlign = "center"
      ctx.fillText(msdsItem.name, canvas.width / 2, 40)

      const qrImage = new Image()
      qrImage.crossOrigin = "anonymous"
      qrImage.onload = () => {
        ctx.drawImage(qrImage, 50, 60, 300, 300)
        ctx.font = "12px Arial"
        ctx.fillText(`ID: ${msdsItem.id}`, canvas.width / 2, 380)
        ctx.fillText(`용도: ${msdsItem.usage}`, canvas.width / 2, 400)

        const link = document.createElement("a")
        link.download = `MSDS_QR_${msdsItem.name}_${msdsItem.id}.png`
        link.href = canvas.toDataURL()
        link.click()
      }
      qrImage.src = qrDataURL
    } catch (error) {
      console.error("QR코드 다운로드 오류:", error)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>QR코드 출력 - {msdsItem.name}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-4">
          <div ref={printRef} className="bg-background p-4 rounded-lg border">
            <QRCodeComponent value={qrValue} size={200} />
          </div>

          <div className="text-center">
            <p className="font-medium">{msdsItem.name}</p>
            <p className="text-sm text-muted-foreground">ID: {msdsItem.id}</p>
            <p className="text-sm text-muted-foreground">용도: {msdsItem.usage}</p>
          </div>

          <div className="flex gap-2 w-full">
            <Button onClick={handlePrint} className="flex-1">
              <Printer className="w-4 h-4 mr-2" />
              인쇄
            </Button>
            <Button
              onClick={handleDownloadPNG}
              variant="outline"
              className="flex-1 bg-transparent"
              disabled={isGenerating}
            >
              <Download className="w-4 h-4 mr-2" />
              {isGenerating ? "생성 중..." : "PNG 다운로드"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
