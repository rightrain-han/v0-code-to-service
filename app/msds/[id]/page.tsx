import { notFound } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, FileText, Download } from "lucide-react"
import type { MsdsItem } from "@/types/msds"

async function getMsdsItem(id: string): Promise<MsdsItem | null> {
  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL || process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000"

    const response = await fetch(`${baseUrl}/api/msds`, {
      cache: "no-store",
    })

    if (!response.ok) return null

    const items: MsdsItem[] = await response.json()
    return items.find((item) => item.id === Number.parseInt(id)) || null
  } catch (error) {
    console.error("Error fetching MSDS item:", error)
    return null
  }
}

export default async function MsdsDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const item = await getMsdsItem(id)

  if (!item) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground py-4 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm" className="text-primary-foreground hover:bg-primary-foreground/10">
                <ArrowLeft className="h-4 w-4 mr-2" />
                목록으로
              </Button>
            </Link>
            <h1 className="text-xl font-bold">MSDS 상세정보</h1>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6">
        <div className="grid md:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  {item.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-muted-foreground">ID</span>
                    <p className="font-medium">{item.id}</p>
                  </div>

                  <div>
                    <span className="text-sm text-muted-foreground">용도</span>
                    <p>
                      <Badge variant="secondary">{item.usage}</Badge>
                    </p>
                  </div>
                </div>

                <div>
                  <span className="text-sm text-muted-foreground">장소</span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {item.reception.map((rec, idx) => (
                      <Badge key={idx} variant="outline">
                        {rec}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-sm text-muted-foreground">관련법</span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {item.laws.map((law, idx) => (
                      <Badge key={idx} variant="outline" className="bg-blue-50 text-blue-700">
                        {law}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Warning Symbols */}
            {item.warningSymbolsData && item.warningSymbolsData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>그림문자</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-4">
                    {item.warningSymbolsData.map((symbol) => (
                      <div key={symbol.id} className="flex flex-col items-center gap-2">
                        {symbol.imageUrl && (
                          <img
                            src={symbol.imageUrl || "/placeholder.svg"}
                            alt={symbol.name}
                            className="w-16 h-16 object-contain"
                          />
                        )}
                        <span className="text-xs text-center">{symbol.name}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Protective Equipment */}
            {item.protectiveEquipmentData && item.protectiveEquipmentData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>보호구</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-4">
                    {item.protectiveEquipmentData.map((equipment) => (
                      <div key={equipment.id} className="flex flex-col items-center gap-2">
                        {equipment.imageUrl && (
                          <img
                            src={equipment.imageUrl || "/placeholder.svg"}
                            alt={equipment.name}
                            className="w-16 h-16 object-contain"
                          />
                        )}
                        <span className="text-xs text-center">{equipment.name}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>문서 다운로드</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* MSDS PDF */}
                {item.pdfFileName && item.pdfUrl && (
                  <a
                    href={item.pdfUrl}
                    download={item.pdfFileName}
                    className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted transition-colors"
                  >
                    <FileText className="h-8 w-8 text-green-600" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">MSDS</p>
                      <p className="text-xs text-muted-foreground">PDF 다운로드 →</p>
                    </div>
                    <Download className="h-4 w-4 text-muted-foreground" />
                  </a>
                )}

                {/* Warning Label PDF */}
                {item.warningLabelPdfName && item.warningLabelPdfUrl && (
                  <a
                    href={item.warningLabelPdfUrl}
                    download={item.warningLabelPdfName}
                    className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted transition-colors"
                  >
                    <FileText className="h-8 w-8 text-orange-600" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">경고표지</p>
                      <p className="text-xs text-muted-foreground">PDF 다운로드 →</p>
                    </div>
                    <Download className="h-4 w-4 text-muted-foreground" />
                  </a>
                )}

                {/* Management Guidelines PDF */}
                {item.managementGuidelinesPdfName && item.managementGuidelinesPdfUrl && (
                  <a
                    href={item.managementGuidelinesPdfUrl}
                    download={item.managementGuidelinesPdfName}
                    className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted transition-colors"
                  >
                    <FileText className="h-8 w-8 text-blue-600" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">관리요령</p>
                      <p className="text-xs text-muted-foreground">PDF 다운로드 →</p>
                    </div>
                    <Download className="h-4 w-4 text-muted-foreground" />
                  </a>
                )}

                {!item.pdfUrl && !item.warningLabelPdfUrl && !item.managementGuidelinesPdfUrl && (
                  <p className="text-sm text-muted-foreground text-center py-4">다운로드 가능한 문서가 없습니다</p>
                )}
              </CardContent>
            </Card>

            {/* QR Code Access Info */}
            <Card>
              <CardHeader>
                <CardTitle>QR 코드 접근</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-2">이 페이지는 QR 코드를 통해 접근되었습니다.</p>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• 모바일에서 QR 코드 스캔</li>
                  <li>• 즉시 MSDS 정보 확인</li>
                  <li>• PDF 다운로드 가능</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
