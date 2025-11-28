"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Download, Printer } from "lucide-react"
import { QRCodeComponent } from "./qr-code"
import type { MsdsItem } from "@/types/msds"

interface QRPrintModalProps {
  item: MsdsItem
  onClose: () => void
}

export function QRPrintModal({ item, onClose }: QRPrintModalProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const printRef = useRef<HTMLDivElement>(null)

  const qrValue = typeof window !== "undefined" ? `${window.location.origin}/msds/${item.id}` : ""

  const handlePrint = () => {
    if (printRef.current) {
      const printWindow = window.open("", "_blank")
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>MSDS QR코드 - ${item.name}</title>
              <style>
                @media print {
                  @page { size: A4; margin: 20mm; }
                  body { margin: 0; padding: 0; }
                }
                body { 
                  font-family: Arial, sans-serif; 
                  display: flex; 
                  justify-content: center; 
                  align-items: center; 
                  min-height: 100vh;
                  margin: 0;
                  padding: 20px;
                }
                .qr-container { 
                  text-align: center; 
                  border: 2px solid #e5e7eb; 
                  padding: 40px; 
                  border-radius: 12px;
                  background: white;
                  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                }
                .qr-title { 
                  font-size: 24px; 
                  font-weight: bold; 
                  margin-bottom: 20px;
                  color: #111827;
                }
                .qr-code { margin: 20px 0; }
                .qr-info { 
                  font-size: 14px; 
                  color: #6b7280; 
                  margin: 8px 0;
                  line-height: 1.6;
                }
                .qr-url {
                  font-size: 11px;
                  color: #9ca3af;
                  margin-top: 12px;
                  word-break: break-all;
                }
                .qr-note {
                  font-size: 12px;
                  color: #6b7280;
                  margin-top: 20px;
                  padding-top: 20px;
                  border-top: 1px solid #e5e7eb;
                }
              </style>
            </head>
            <body>
              <div class="qr-container">
                <div class="qr-title">${item.name}</div>
                <div class="qr-code">${printRef.current?.innerHTML}</div>
                <div class="qr-info">ID: ${item.id}</div>
                <div class="qr-info">용도: ${item.purpose || "N/A"}</div>
                <div class="qr-url">URL: ${qrValue}</div>
                <div class="qr-note">• QR코드를 스캔하면 해당 MSDS 상세 정보로 이동합니다<br>• 인쇄 시 A4 용지에 최적화되어 출력됩니다</div>
              </div>
            </body>
          </html>
        `)
        printWindow.document.close()
        printWindow.print()
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

      canvas.width = 500
      canvas.height = 550

      // 배경
      ctx.fillStyle = "#FFFFFF"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // 테두리
      ctx.strokeStyle = "#e5e7eb"
      ctx.lineWidth = 2
      ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40)

      // 제목
      ctx.fillStyle = "#111827"
      ctx.font = "bold 24px Arial"
      ctx.textAlign = "center"
      ctx.fillText(item.name, canvas.width / 2, 60)

      // QR 코드
      const qrImage = new Image()
      qrImage.crossOrigin = "anonymous"
      qrImage.onload = () => {
        ctx.drawImage(qrImage, 100, 90, 300, 300)

        // 정보
        ctx.font = "14px Arial"
        ctx.fillStyle = "#6b7280"
        ctx.fillText(`ID: ${item.id}`, canvas.width / 2, 420)
        ctx.fillText(`용도: ${item.purpose || "N/A"}`, canvas.width / 2, 445)

        // URL
        ctx.font = "11px Arial"
        ctx.fillStyle = "#9ca3af"
        const urlText = `URL: ${qrValue}`
        if (urlText.length > 60) {
          ctx.fillText(urlText.substring(0, 60), canvas.width / 2, 470)
          ctx.fillText(urlText.substring(60), canvas.width / 2, 485)
        } else {
          ctx.fillText(urlText, canvas.width / 2, 470)
        }

        // 다운로드
        const link = document.createElement("a")
        link.download = `MSDS_QR_${item.name.replace(/[^a-zA-Z0-9가-힣]/g, "_")}_${item.id}.png`
        link.href = canvas.toDataURL()
        link.click()
        setIsGenerating(false)
      }
      qrImage.src = qrDataURL
    } catch (error) {
      console.error("QR코드 다운로드 오류:", error)
      setIsGenerating(false)
    }
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl">QR코드 출력 - {item.name}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-6 py-6">
          {/* QR 코드 */}
          <div ref={printRef} className="bg-background p-6 rounded-lg border-2 border-border">
            <QRCodeComponent value={qrValue} size={256} />
          </div>

          {/* 정보 */}
          <div className="text-center space-y-1">
            <p className="font-semibold text-lg">{item.name}</p>
            <p className="text-sm text-muted-foreground">ID: {item.id}</p>
            <p className="text-sm text-muted-foreground">용도: {item.purpose || "N/A"}</p>
            <p className="text-xs text-muted-foreground mt-2 max-w-md break-all">URL: {qrValue}</p>
          </div>

          {/* 버튼 */}
          <div className="flex gap-3 w-full max-w-sm">
            <Button onClick={handlePrint} className="flex-1 bg-transparent" variant="outline">
              <Printer className="w-4 h-4 mr-2" />
              인쇄
            </Button>
            <Button
              onClick={handleDownloadPNG}
              className="flex-1 bg-black text-white hover:bg-black/90"
              disabled={isGenerating}
            >
              <Download className="w-4 h-4 mr-2" />
              {isGenerating ? "생성 중..." : "PNG 다운로드"}
            </Button>
          </div>

          {/* 안내 메시지 */}
          <div className="text-xs text-muted-foreground text-center space-y-1 pt-4 border-t w-full">
            <p>• QR코드를 스캔하면 해당 MSDS 상세 정보로 이동합니다</p>
            <p>• 인쇄 시 A4 용지에 최적화되어 출력됩니다</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
