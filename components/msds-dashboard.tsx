"use client"

import type React from "react"
import {
  Search,
  ChevronRight,
  ChevronLeft,
  X,
  Menu,
  Shield,
  AlertTriangle,
  FileText,
  RefreshCw,
  Download,
  Eye,
} from "lucide-react"
import { useState, useEffect, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import Link from "next/link"
import type { MsdsItem, WarningSymbol, ProtectiveEquipment } from "@/types/msds"
import { DEFAULT_WARNING_SYMBOLS, DEFAULT_PROTECTIVE_EQUIPMENT } from "@/types/msds"
import { WarningSymbolComponent } from "./warning-symbol"
import { ProtectiveEquipmentComponent } from "./protective-equipment"

const ITEMS_PER_PAGE_DESKTOP = 12
const ITEMS_PER_PAGE_MOBILE = 8

export default function MsdsDashboard() {
  const [currentPage, setCurrentPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState("")
  const [msdsData, setMsdsData] = useState<MsdsItem[]>([])
  const [warningSymbols, setWarningSymbols] = useState<WarningSymbol[]>(DEFAULT_WARNING_SYMBOLS)
  const [protectiveEquipment, setProtectiveEquipment] = useState<ProtectiveEquipment[]>(DEFAULT_PROTECTIVE_EQUIPMENT)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      loadMsdsData(false)
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  const loadMsdsData = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true)

      const [msdsResponse, symbolsResponse, equipmentResponse] = await Promise.all([
        fetch("/api/msds", { cache: "no-store" }),
        fetch("/api/warning-symbols", { cache: "no-store" }),
        fetch("/api/protective-equipment", { cache: "no-store" }),
      ])

      let msdsData: MsdsItem[] = []
      let symbolsData: WarningSymbol[] = []
      let equipmentData: ProtectiveEquipment[] = []

      if (msdsResponse.ok) {
        msdsData = await msdsResponse.json()
      }

      if (symbolsResponse.ok) {
        symbolsData = await symbolsResponse.json()
      }

      if (equipmentResponse.ok) {
        equipmentData = await equipmentResponse.json()
      }

      const enrichedMsdsData = msdsData.map((item) => {
        const warningSymbolsData = symbolsData.filter((symbol) => item.warningSymbols?.includes(symbol.id))
        const protectiveEquipmentData = equipmentData.filter((equipment) => item.hazards?.includes(equipment.id))

        return {
          ...item,
          warningSymbolsData,
          protectiveEquipmentData,
          pdfUrl: item.pdfUrl || `/pdfs/${item.pdfFileName}`,
        }
      })

      setMsdsData(enrichedMsdsData)
      setWarningSymbols(symbolsData.length > 0 ? symbolsData : DEFAULT_WARNING_SYMBOLS)
      setProtectiveEquipment(equipmentData.length > 0 ? equipmentData : DEFAULT_PROTECTIVE_EQUIPMENT)
      setError(null)
    } catch (err) {
      console.error("MSDS 데이터 로딩 오류:", err)
      if (showLoading) {
        setError(err instanceof Error ? err.message : "데이터 로딩 실패")
      }
    } finally {
      if (showLoading) setLoading(false)
    }
  }

  useEffect(() => {
    loadMsdsData()
  }, [])

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadMsdsData()
    setRefreshing(false)
  }

  const handlePdfDownload = (item: MsdsItem, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const link = document.createElement("a")
    link.href = item.pdfUrl || `/pdfs/${item.pdfFileName}`
    link.download = `${item.name}.pdf`
    link.target = "_blank"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return msdsData
    const query = searchQuery.toLowerCase().trim()
    return msdsData.filter((item) => {
      const nameMatch = item.name.toLowerCase().includes(query)
      const usageMatch = item.usage.toLowerCase().includes(query)
      const receptionMatch = item.reception.some((rec) => rec.toLowerCase().includes(query))
      const lawMatch = item.laws.some((law) => law.toLowerCase().includes(query))
      return nameMatch || usageMatch || receptionMatch || lawMatch
    })
  }, [searchQuery, msdsData])

  const itemsPerPage = isMobile ? ITEMS_PER_PAGE_MOBILE : ITEMS_PER_PAGE_DESKTOP
  const totalItems = filteredData.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const isSearching = searchQuery.trim().length > 0

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filteredData.slice(startIndex, endIndex)
  }, [currentPage, filteredData, itemsPerPage])

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
    setCurrentPage(1)
  }

  const clearSearch = () => {
    setSearchQuery("")
    setCurrentPage(1)
  }

  const getPageNumbers = () => {
    const pages: number[] = []
    const maxVisiblePages = isMobile ? 5 : 10

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      const startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2))
      const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)
      for (let i = startPage; i <= endPage; i++) pages.push(i)
    }
    return pages
  }

  const handleCardClick = (item: MsdsItem, e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button")) return
    if (item.pdfFileName) {
      window.open(item.pdfUrl || `/pdfs/${item.pdfFileName}`, "_blank")
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-white text-lg font-medium">MSDS 데이터를 불러오는 중...</p>
          <p className="text-blue-300 text-sm mt-2">잠시만 기다려주세요</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-900 to-slate-900 flex items-center justify-center">
        <div className="text-center p-8 bg-background/10 backdrop-blur rounded-xl">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-white text-xl font-bold mb-2">데이터 로딩 오류</h2>
          <p className="text-red-300 mb-4">{error}</p>
          <Button onClick={() => loadMsdsData()} className="bg-red-600 hover:bg-red-700">
            다시 시도
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-800/90 to-indigo-800/90 backdrop-blur-sm border-b border-white/10 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-white">MSDS 안전관리시스템</h1>
                <p className="text-xs text-blue-200 hidden md:block">Material Safety Data Sheet</p>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-3">
              <Button
                onClick={handleRefresh}
                variant="outline"
                size="sm"
                disabled={refreshing}
                className="border-white/20 text-white hover:bg-white/10 bg-transparent"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
                새로고침
              </Button>
              <Link href="/admin">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-white/20 text-white hover:bg-white/10 bg-transparent"
                >
                  관리자 페이지
                </Button>
              </Link>
            </div>

            <Sheet open={showMobileMenu} onOpenChange={setShowMobileMenu}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon" className="text-white">
                  <Menu className="w-6 h-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72">
                <div className="flex flex-col gap-4 mt-8">
                  <h3 className="font-semibold text-lg">빠른 메뉴</h3>
                  <Link href="/admin" onClick={() => setShowMobileMenu(false)}>
                    <Button variant="outline" className="w-full justify-start bg-transparent">
                      관리자 페이지
                    </Button>
                  </Link>
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">통계</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-muted rounded-lg p-3 text-center">
                        <p className="text-2xl font-bold">{totalItems}</p>
                        <p className="text-xs text-muted-foreground">총 항목</p>
                      </div>
                      <div className="bg-muted rounded-lg p-3 text-center">
                        <p className="text-2xl font-bold">{totalPages}</p>
                        <p className="text-xs text-muted-foreground">총 페이지</p>
                      </div>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Search Bar */}
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-2xl mx-auto">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Input
              type="text"
              placeholder="MSDS명, 용도, 장소, 관련법으로 검색..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="pl-12 pr-10 py-6 text-lg bg-background/95 backdrop-blur border-0 shadow-xl rounded-xl"
            />
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="container mx-auto px-4 mb-6">
        <div className="flex items-center justify-between bg-white/5 backdrop-blur rounded-lg px-4 py-2">
          {isSearching ? (
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-amber-500/20 text-amber-300">
                <Search className="w-3 h-3 mr-1" />
                검색: "{searchQuery}"
              </Badge>
              <span className="text-sm text-blue-200">{filteredData.length}개 결과 발견</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-blue-500/20 text-blue-300">
                <FileText className="w-3 h-3 mr-1" />
                페이지 {currentPage} / {totalPages}
              </Badge>
              <span className="text-sm text-blue-200">총 {totalItems}개 문서</span>
            </div>
          )}
        </div>
      </div>

      {/* Content Grid */}
      <main className="container mx-auto px-4 pb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {paginatedData.length > 0 ? (
            paginatedData.map((item) => (
              <Card
                key={item.id}
                className="group cursor-pointer hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 bg-background/95 backdrop-blur border-0 overflow-hidden"
                onClick={(e) => handleCardClick(item, e)}
              >
                {item.pdfFileName && (
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Badge variant="secondary" className="bg-green-500/20 text-green-400 text-xs">
                      클릭하여 PDF 보기
                    </Badge>
                  </div>
                )}
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-foreground truncate group-hover:text-blue-600 transition-colors">
                        {item.name}
                      </h3>
                      {item.pdfFileName && (
                        <div className="flex items-center gap-1 text-xs text-green-600 mt-1">
                          <FileText className="w-3 h-3" />
                          <span>PDF</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <Badge variant="outline" className="mb-3 text-xs">
                    {item.usage}
                  </Badge>

                  {item.pdfFileName && (
                    <div className="flex gap-2 mb-3">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-xs bg-transparent"
                        onClick={(e) => {
                          e.stopPropagation()
                          window.open(item.pdfUrl || `/pdfs/${item.pdfFileName}`, "_blank")
                        }}
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        보기
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-xs bg-transparent"
                        onClick={(e) => handlePdfDownload(item, e)}
                      >
                        <Download className="w-3 h-3 mr-1" />
                        저장
                      </Button>
                    </div>
                  )}

                  {/* Warning Symbols */}
                  {item.warningSymbolsData && item.warningSymbolsData.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs text-muted-foreground mb-1">경고 표지</p>
                      <div className="flex flex-wrap gap-1">
                        {item.warningSymbolsData.map((symbol) => (
                          <WarningSymbolComponent key={symbol.id} symbol={symbol} size="sm" />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Protective Equipment */}
                  {item.protectiveEquipmentData && item.protectiveEquipmentData.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs text-muted-foreground mb-1">보호 장구</p>
                      <div className="flex flex-wrap gap-1">
                        {item.protectiveEquipmentData.map((equipment) => (
                          <ProtectiveEquipmentComponent key={equipment.id} equipment={equipment} size="sm" />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Reception Locations */}
                  {item.reception && item.reception.length > 0 && (
                    <div className="mb-2">
                      <p className="text-xs text-muted-foreground mb-1">장소</p>
                      <div className="flex flex-wrap gap-1">
                        {item.reception.slice(0, 2).map((rec, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {rec}
                          </Badge>
                        ))}
                        {item.reception.length > 2 && (
                          <Badge variant="secondary" className="text-xs">
                            +{item.reception.length - 2}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Laws */}
                  {item.laws && item.laws.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">관련법</p>
                      <div className="flex flex-wrap gap-1">
                        {item.laws.slice(0, 2).map((law, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs border-amber-300 text-amber-700">
                            {law}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-16">
              <Search className="w-16 h-16 text-blue-300/50 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">검색 결과가 없습니다</h3>
              <p className="text-blue-200">다른 검색어를 시도해보세요</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-8">
            <Button
              variant="outline"
              size="icon"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="border-white/20 text-white hover:bg-white/10 disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>

            {getPageNumbers().map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                size="icon"
                onClick={() => handlePageChange(page)}
                className={currentPage === page ? "bg-blue-600" : "border-white/20 text-white hover:bg-white/10"}
              >
                {page}
              </Button>
            ))}

            <Button
              variant="outline"
              size="icon"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="border-white/20 text-white hover:bg-white/10 disabled:opacity-50"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </main>
    </div>
  )
}
