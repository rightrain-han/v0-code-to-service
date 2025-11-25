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
          {item.pdfFileName && (
            <a href={item.pdfUrl || `/pdfs/${item.pdfFileName}`} target="_blank" rel="noopener noreferrer">
              <Button variant="secondary" size="sm">
                <Download className="h-4 w-4 mr-2" />
                PDF 다운로드
              </Button>
            </a>
          )}
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
            {item.warningSymbols && item.warningSymbols.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>경고 표지</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-4">
                    {item.warningSymbols.map((symbolId) => (
                      <div key={symbolId} className="flex flex-col items-center gap-1">
                        <div className="w-16 h-16 bg-yellow-100 rounded-lg flex items-center justify-center border border-yellow-300">
                          <span className="text-2xl font-bold text-yellow-700">{symbolId}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Protective Equipment */}
            {item.hazards && item.hazards.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>보호장구</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-4">
                    {item.hazards.map((hazardId) => (
                      <div key={hazardId} className="flex flex-col items-center gap-1">
                        <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center border border-blue-300">
                          <span className="text-2xl font-bold text-blue-700">{hazardId}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* PDF Info */}
            {item.pdfFileName && (
              <Card>
                <CardHeader>
                  <CardTitle>PDF 문서</CardTitle>
                </CardHeader>
                <CardContent>
                  <a
                    href={item.pdfUrl || `/pdfs/${item.pdfFileName}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted transition-colors"
                  >
                    <FileText className="h-8 w-8 text-red-500" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{item.pdfFileName}</p>
                      <p className="text-sm text-muted-foreground">PDF 열기 →</p>
                    </div>
                  </a>
                </CardContent>
              </Card>
            )}

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
