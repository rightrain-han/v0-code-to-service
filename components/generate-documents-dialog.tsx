"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { FileText, Download, Loader2 } from "lucide-react"
import type { MsdsItem } from "@/types/msds"

interface GenerateDocumentsDialogProps {
  item: MsdsItem
  open: boolean
  onClose: () => void
}

export function GenerateDocumentsDialog({ item, open, onClose }: GenerateDocumentsDialogProps) {
  const [generating, setGenerating] = useState(false)
  const [warningLabel, setWarningLabel] = useState<any>(null)
  const [guidelines, setGuidelines] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<"warning" | "guidelines">("warning")

  const handleGenerateWarningLabel = async () => {
    setGenerating(true)
    try {
      const response = await fetch("/api/generate-warning-label", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ msdsData: item }),
      })

      if (response.ok) {
        const data = await response.json()
        setWarningLabel(data.warningLabel)
      }
    } catch (error) {
      console.error("Warning label generation error:", error)
    } finally {
      setGenerating(false)
    }
  }

  const handleGenerateGuidelines = async () => {
    setGenerating(true)
    try {
      const response = await fetch("/api/generate-management-guidelines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ msdsData: item }),
      })

      if (response.ok) {
        const data = await response.json()
        setGuidelines(data.guidelines)
      }
    } catch (error) {
      console.error("Guidelines generation error:", error)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>문서 자동 생성 - {item.name}</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "warning" | "guidelines")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="warning">경고표지</TabsTrigger>
            <TabsTrigger value="guidelines">관리요령</TabsTrigger>
          </TabsList>

          <TabsContent value="warning" className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">MSDS 데이터를 기반으로 경고표지를 자동 생성합니다</p>
              <Button onClick={handleGenerateWarningLabel} disabled={generating} size="sm">
                {generating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    생성 중...
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4 mr-2" />
                    생성하기
                  </>
                )}
              </Button>
            </div>

            {warningLabel && (
              <Card>
                <CardContent className="p-6 space-y-4">
                  <div>
                    <h3 className="font-bold text-lg">{warningLabel.productName}</h3>
                  </div>
                  <div>
                    <p className="text-sm font-semibold mb-2">신호어: {warningLabel.signalWord}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold mb-2">유해·위험 문구:</p>
                    <ul className="list-disc list-inside text-sm space-y-1">
                      {warningLabel.hazardStatements.map((stmt: string, idx: number) => (
                        <li key={idx}>{stmt}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-sm font-semibold mb-2">예방조치 문구:</p>
                    <ul className="list-disc list-inside text-sm space-y-1">
                      {warningLabel.precautionaryStatements.map((stmt: string, idx: number) => (
                        <li key={idx}>{stmt}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="pt-4 border-t">
                    <Button size="sm" variant="outline">
                      <Download className="w-4 h-4 mr-2" />
                      PDF로 다운로드
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="guidelines" className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                MSDS 데이터를 기반으로 화학물질 작업공정별 관리요령을 자동 생성합니다
              </p>
              <Button onClick={handleGenerateGuidelines} disabled={generating} size="sm">
                {generating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    생성 중...
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4 mr-2" />
                    생성하기
                  </>
                )}
              </Button>
            </div>

            {guidelines && (
              <Card>
                <CardContent className="p-6 space-y-4">
                  <div>
                    <h3 className="font-bold text-lg">{guidelines.productName}</h3>
                  </div>
                  <div>
                    <p className="text-sm font-semibold mb-2">신호어: {guidelines.signalWord}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold mb-2">유해성·위험성:</p>
                    <ul className="list-disc list-inside text-sm space-y-1">
                      {guidelines.hazardsRisks.map((risk: string, idx: number) => (
                        <li key={idx}>{risk}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-sm font-semibold mb-2">취급 시 주의사항:</p>
                    <ul className="list-none text-sm space-y-1">
                      {guidelines.handlingPrecautions.map((precaution: string, idx: number) => (
                        <li key={idx}>{precaution}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-sm font-semibold mb-2">착용 보호구:</p>
                    <p className="text-sm">{guidelines.protectiveEquipment.join(", ")}</p>
                  </div>
                  <div className="pt-4 border-t">
                    <Button size="sm" variant="outline">
                      <Download className="w-4 h-4 mr-2" />
                      PDF로 다운로드
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
