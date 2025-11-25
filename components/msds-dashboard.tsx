"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Search, Eye, Download, RefreshCw, Menu, Shield, AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"
import type { MsdsItem, WarningSymbol, ProtectiveEquipment } from "@/types/msds"

const STATUS_COLORS: Record<string, string> = {
  순수시약: "bg-blue-500",
  NOx저감: "bg-blue-500",
  폐수처리: "bg-green-500",
  보일러용수처리: "bg-green-500",
  과학물질분야: "bg-purple-500",
  연료: "bg-orange-500",
  소독용가스: "bg-cyan-500",
  "발전기 냉각": "bg-sky-500",
  Purge: "bg-indigo-500",
  default: "bg-green-500",
}

const USAGE_COLORS: Record<string, string> = {
  순수시약: "bg-blue-500 text-white",
  NOx저감: "bg-blue-600 text-white",
  폐수처리: "bg-indigo-500 text-white",
  보일러용수처리: "bg-violet-500 text-white",
  과학물질분야: "bg-purple-500 text-white",
  연료: "bg-emerald-500 text-white",
  "소독용 가스": "bg-teal-500 text-white",
  "발전기 냉각": "bg-sky-500 text-white",
  Purge: "bg-indigo-600 text-white",
  default: "bg-blue-500 text-white",
}

function MsdsDashboard() {
  const [data, setData] = useState<MsdsItem[]>([])
  const [warningSymbols, setWarningSymbols] = useState<WarningSymbol[]>([])
  const [protectiveEquipment, setProtectiveEquipment] = useState<ProtectiveEquipment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [refreshing, setRefreshing] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [dbStatus, setDbStatus] = useState<"connected" | "restoring" | "error">("connected")

  const itemsPerPage = 12

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      const [msdsRes, symbolsRes, equipmentRes] = await Promise.all([
        fetch("/api/msds"),
        fetch("/api/warning-symbols"),
        fetch("/api/protective-equipment"),
      ])

      const msdsData = await msdsRes.json()
      const symbolsData = await symbolsRes.json()
      const equipmentData = await equipmentRes.json()

      if (msdsData.dbRestoring || symbolsData.dbRestoring || equipmentData.dbRestoring) {
        setDbStatus("restoring")
      } else {
        setDbStatus("connected")
      }

      if (msdsData.items) {
        const processedItems = msdsData.items.map((item: MsdsItem) => ({
          ...item,
          warningSymbolsData: item.warningSymbols
            ?.map((wsId: string) => symbolsData.symbols?.find((s: WarningSymbol) => s.id === wsId))
            .filter(Boolean),
          protectiveEquipmentData: item.hazards
            ?.map((peId: string) => equipmentData.equipment?.find((e: ProtectiveEquipment) => e.id === peId))
            .filter(Boolean),
        }))
        setData(processedItems)
      }

      if (symbolsData.symbols) setWarningSymbols(symbolsData.symbols)
      if (equipmentData.equipment) setProtectiveEquipment(equipmentData.equipment)
    } catch (error) {
      console.error("Failed to fetch data:", error)
      setDbStatus("error")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Filter data
  const filteredData = data.filter((item) => {
    const searchLower = searchTerm.toLowerCase()
    return (
      item.name?.toLowerCase().includes(searchLower) ||
      item.usage?.toLowerCase().includes(searchLower) ||
      item.reception?.some((r) => r.toLowerCase().includes(searchLower)) ||
      item.laws?.some((l) => l.toLowerCase().includes(searchLower))
    )
  })

  // Pagination
  const totalItems = filteredData.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage)

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchData()
    setRefreshing(false)
  }

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  const handleCardClick = (item: MsdsItem, e: React.MouseEvent) => {
    if (item.pdfUrl || item.pdfFileName) {
      window.open(item.pdfUrl || `/pdfs/${item.pdfFileName}`, "_blank")
    }
  }

  const handlePdfDownload = (item: MsdsItem, e: React.MouseEvent) => {
    e.stopPropagation()
    const link = document.createElement("a")
    link.href = item.pdfUrl || `/pdfs/${item.pdfFileName}`
    link.download = item.pdfFileName || `${item.name}.pdf`
    link.click()
  }

  const getPageNumbers = () => {
    const pages: number[] = []
    const maxVisible = 5
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2))
    const end = Math.min(totalPages, start + maxVisible - 1)

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1)
    }

    for (let i = start; i <= end; i++) {
      pages.push(i)
    }
    return pages
  }

  const getStatusColor = (usage: string) => {
    return STATUS_COLORS[usage] || STATUS_COLORS.default
  }

  const getUsageColor = (usage: string) => {
    return USAGE_COLORS[usage] || USAGE_COLORS.default
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">데이터를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white border-2 border-blue-600 flex items-center justify-center">
                <Shield className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-gray-900">MSDS 안전관리시스템</h1>
                <p className="text-xs text-gray-500 hidden md:block">Material Safety Data Sheet</p>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-3">
              <Button
                onClick={handleRefresh}
                variant="outline"
                size="sm"
                disabled={refreshing}
                className="border-gray-300 text-gray-700 hover:bg-gray-100 bg-transparent"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
                새로고침
              </Button>
              <Link href="/admin">
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                  관리자 페이지
                </Button>
              </Link>
            </div>

            {/* Mobile Menu */}
            <Sheet open={showMobileMenu} onOpenChange={setShowMobileMenu}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon" className="text-gray-700">
                  <Menu className="w-6 h-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72">
                <div className="flex flex-col gap-4 mt-8">
                  <h3 className="font-semibold text-lg">빠른 메뉴</h3>
                  <Button
                    onClick={handleRefresh}
                    variant="outline"
                    className="w-full justify-start bg-transparent"
                    disabled={refreshing}
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
                    새로고침
                  </Button>
                  <Link href="/admin" onClick={() => setShowMobileMenu(false)}>
                    <Button className="w-full justify-start bg-blue-600 hover:bg-blue-700">관리자 페이지</Button>
                  </Link>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="max-w-2xl mx-auto">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="MSDS명, 용도, 장소, 관련법으로 검색..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setCurrentPage(1)
              }}
              className="pl-12 pr-4 py-3 h-12 text-base border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <AlertTriangle className="w-4 h-4 text-blue-600" />
          <span className="font-medium">
            페이지 {currentPage} / {totalPages}
          </span>
          <span className="text-gray-400">|</span>
          <span>
            총 {totalItems}개 문서 (페이지당 {itemsPerPage}개)
          </span>
        </div>
      </div>

      {/* DB Status Alert */}
      {dbStatus === "restoring" && (
        <div className="container mx-auto px-4 mb-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-amber-600" />
            <span className="text-amber-700 text-sm">데이터베이스 복원 중입니다. 잠시 후 새로고침해주세요.</span>
          </div>
        </div>
      )}

      <main className="container mx-auto px-4 pb-8 flex-1">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {paginatedData.length > 0 ? (
            paginatedData.map((item) => (
              <Card
                key={item.id}
                className="group cursor-pointer hover:shadow-lg transition-all duration-200 bg-white border border-gray-200 overflow-hidden relative"
                onClick={(e) => handleCardClick(item, e)}
              >
                <div className={`absolute top-3 right-3 w-3 h-3 rounded-full ${getStatusColor(item.usage)}`} />

                <CardContent className="p-4">
                  {/* 물질명 */}
                  <h3 className="font-bold text-gray-900 text-base mb-2 pr-6">{item.name}</h3>

                  <Badge className={`mb-3 text-xs font-medium ${getUsageColor(item.usage)}`}>{item.usage}</Badge>

                  {item.pdfFileName && (
                    <div className="flex gap-2 mb-3">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-gray-500 hover:text-blue-600 hover:bg-blue-50"
                        onClick={(e) => {
                          e.stopPropagation()
                          window.open(item.pdfUrl || `/pdfs/${item.pdfFileName}`, "_blank")
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-gray-500 hover:text-blue-600 hover:bg-blue-50"
                        onClick={(e) => handlePdfDownload(item, e)}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  )}

                  {/* 경고 표지 */}
                  <div className="mb-3">
                    <p className="text-xs text-gray-500 mb-1.5 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      경고 표지
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {item.warningSymbolsData && item.warningSymbolsData.length > 0 ? (
                        item.warningSymbolsData.map((symbol) => (
                          <Badge
                            key={symbol.id}
                            variant="outline"
                            className="text-xs bg-gray-100 text-gray-700 border-gray-300"
                          >
                            {symbol.name.substring(0, 1)}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </div>
                  </div>

                  {/* 보호 장구 */}
                  <div className="mb-3">
                    <p className="text-xs text-gray-500 mb-1.5 flex items-center gap-1">
                      <Shield className="w-3 h-3" />
                      보호 장구
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {item.protectiveEquipmentData && item.protectiveEquipmentData.length > 0 ? (
                        item.protectiveEquipmentData.map((equipment) => (
                          <Badge
                            key={equipment.id}
                            variant="outline"
                            className="text-xs bg-gray-100 text-gray-700 border-gray-300"
                          >
                            {equipment.name.substring(0, 1)}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </div>
                  </div>

                  <div className="mb-3">
                    <p className="text-xs text-gray-500 mb-1.5">사용 장소</p>
                    <div className="flex flex-wrap gap-1">
                      {item.reception && item.reception.length > 0 ? (
                        <>
                          {item.reception.slice(0, 2).map((rec, idx) => (
                            <Badge key={idx} className="text-xs bg-emerald-500 text-white hover:bg-emerald-600">
                              {rec}
                            </Badge>
                          ))}
                          {item.reception.length > 2 && (
                            <Badge className="text-xs bg-emerald-400 text-white">
                              +{item.reception.length - 2}개 더
                            </Badge>
                          )}
                        </>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500 mb-1.5">관련 법규</p>
                    <div className="flex flex-wrap gap-1">
                      {item.laws && item.laws.length > 0 ? (
                        item.laws.map((law, idx) => (
                          <Badge
                            key={idx}
                            className={`text-xs text-white ${
                              law.includes("화학물질")
                                ? "bg-red-500 hover:bg-red-600"
                                : "bg-orange-500 hover:bg-orange-600"
                            }`}
                          >
                            {law}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">검색 결과가 없습니다.</p>
            </div>
          )}
        </div>
      </main>

      {totalPages > 1 && (
        <div className="container mx-auto px-4 py-6 border-t border-gray-200 bg-white">
          <div className="flex flex-col items-center gap-4">
            <p className="text-sm text-gray-600">
              페이지 {currentPage} / {totalPages} · 총 {totalItems}개 항목
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="text-gray-600"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                이전
              </Button>

              {getPageNumbers().map((page) => (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePageChange(page)}
                  className={currentPage === page ? "bg-blue-600 hover:bg-blue-700" : "text-gray-600"}
                >
                  {page}
                </Button>
              ))}

              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="text-gray-600"
              >
                다음
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(totalPages)}
                disabled={currentPage === totalPages}
                className="text-gray-600"
              >
                마지막
              </Button>
            </div>
          </div>
        </div>
      )}

      <footer className="bg-gray-800 text-white py-6">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Shield className="w-5 h-5" />
            <span className="font-semibold">MSDS 안전관리시스템</span>
          </div>
          <p className="text-sm text-gray-400 mb-1">Copyright © GS EPS Digital Transformation Team</p>
          <p className="text-xs text-gray-500">Material Safety Data Sheet Management System</p>
        </div>
      </footer>
    </div>
  )
}

export default MsdsDashboard
