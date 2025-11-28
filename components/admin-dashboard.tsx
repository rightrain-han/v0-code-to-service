"use client"

import Link from "next/link"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import ImageUpload from "./image-upload"
import ExcelUpload from "./excel-upload"
import { Trash2, Plus, QrCode, Upload, Edit, FileText, ChevronLeft, ChevronRight, AlertTriangle } from "lucide-react"
import { GenerateDocumentsDialog } from "./generate-documents-dialog"

import type { MsdsItem, WarningSymbol, ProtectiveEquipment } from "@/types/msds"
import { QRPrintModal } from "@/components/qr-print-modal"

const WARNING_SYMBOL_ICONS: Record<string, React.ReactNode> = {
  "1": <QrCode className="w-8 h-8 text-amber-600" />,
  "2": <FileText className="w-8 h-8 text-red-600" />,
  "3": <Upload className="w-8 h-8 text-orange-600" />,
  "4": <Edit className="w-8 h-8 text-blue-600" />,
  "5": <Trash2 className="w-8 h-8 text-purple-600" />,
  "6": <Plus className="w-8 h-8 text-gray-800" />,
  "7": <ChevronLeft className="w-8 h-8 text-yellow-600" />,
  "8": <ChevronRight className="w-8 h-8 text-red-800" />,
  "9": <ChevronLeft className="w-8 h-8 text-green-600" />,
}

const PROTECTIVE_EQUIPMENT_ICONS: Record<string, React.ReactNode> = {
  "1": <ChevronRight className="w-8 h-8 text-blue-600" />,
  "2": <Trash2 className="w-8 h-8 text-blue-600" />,
  "3": <Edit className="w-8 h-8 text-gray-600" />,
  "4": <Upload className="w-8 h-8 text-gray-400" />,
  "5": <FileText className="w-8 h-8 text-green-600" />,
  "6": <Plus className="w-8 h-8 text-orange-600" />,
  "7": <QrCode className="w-8 h-8 text-blue-600" />,
  "8": <ChevronLeft className="w-8 h-8 text-gray-600" />,
}

interface FormData {
  id?: number
  name: string
  pdfFileName: string
  pdfUrl: string
  hazards: string[]
  usage: string
  reception: string[]
  laws: string[]
  warningSymbols: string[]
}

const initialFormData: FormData = {
  name: "",
  pdfFileName: "",
  pdfUrl: "",
  hazards: [],
  usage: "",
  reception: [],
  laws: [],
  warningSymbols: [],
}

export default function AdminDashboard() {
  const [msdsItems, setMsdsItems] = useState<MsdsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [editingItem, setEditingItem] = useState<MsdsItem | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  // QR코드 관리 상태
  const [showQRModal, setShowQRModal] = useState(false)
  const [selectedQRItem, setSelectedQRItem] = useState<MsdsItem | null>(null)

  // 관리 데이터 상태
  const [warningSymbols, setWarningSymbols] = useState<WarningSymbol[]>([])
  const [protectiveEquipment, setProtectiveEquipment] = useState<ProtectiveEquipment[]>([])

  const [editingSymbol, setEditingSymbol] = useState<WarningSymbol | null>(null)
  const [isSymbolDialogOpen, setIsSymbolDialogOpen] = useState(false)
  const [symbolFormData, setSymbolFormData] = useState({
    id: "",
    name: "",
    description: "",
    category: "physical", // This state is now unused in the updates, will be removed conceptually.
    imageUrl: "",
  })

  const [editingEquipment, setEditingEquipment] = useState<ProtectiveEquipment | null>(null)
  const [isEquipmentDialogOpen, setIsEquipmentDialogOpen] = useState(false)
  const [equipmentFormData, setEquipmentFormData] = useState({
    id: "",
    name: "",
    description: "",
    category: "respiratory", // This state is now unused in the updates, will be removed conceptually.
    imageUrl: "",
  })

  const [uploadingPdf, setUploadingPdf] = useState(false)
  const [editMsdsPdfFile, setEditMsdsPdfFile] = useState<File | null>(null)
  const [editWarningLabelFile, setEditWarningLabelFile] = useState<File | null>(null)
  const [editGuidelinesFile, setEditGuidelinesFile] = useState<File | null>(null)

  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showGenerateDialog, setShowGenerateDialog] = useState(false)
  const [selectedGenerateItem, setSelectedGenerateItem] = useState<MsdsItem | null>(null)

  const receptionOptions = Array.from(new Set(msdsItems.flatMap((item) => item.reception || []))).sort()

  const lawsOptions = Array.from(new Set(msdsItems.flatMap((item) => item.laws || []))).sort()

  useEffect(() => {
    loadAllData()
  }, [])

  const loadAllData = async () => {
    await Promise.all([loadMsdsItems(), loadWarningSymbols(), loadProtectiveEquipment()])
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadAllData()
    setRefreshing(false)
    showMessage("success", "데이터가 새로고침되었습니다.")
  }

  const loadMsdsItems = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/msds", { cache: "no-store" })
      if (res.ok) {
        const data = await res.json()
        const items = data.items || data
        setMsdsItems(Array.isArray(items) ? items : [])
      }
    } catch (error) {
      console.error("Error loading MSDS items:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadWarningSymbols = async () => {
    try {
      const response = await fetch("/api/warning-symbols", { cache: "no-store" })
      if (response.ok) {
        const data = await response.json()
        const symbols = data.symbols || data
        setWarningSymbols(Array.isArray(symbols) ? symbols : [])
      }
    } catch (error) {
      console.error("Error loading warning symbols:", error)
    }
  }

  const loadProtectiveEquipment = async () => {
    try {
      const response = await fetch("/api/protective-equipment", { cache: "no-store" })
      if (response.ok) {
        const data = await response.json()
        const equipment = data.equipment || data
        setProtectiveEquipment(Array.isArray(equipment) ? equipment : [])
      }
    } catch (error) {
      console.error("Error loading protective equipment:", error)
    }
  }

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 5000)
  }

  const filteredItems = msdsItems.filter((item) => {
    if (!searchTerm) return true
    const search = searchTerm.toLowerCase()
    return (
      item.name?.toLowerCase().includes(search) ||
      item.usage?.toLowerCase().includes(search) ||
      item.reception?.some((r) => r.toLowerCase().includes(search)) ||
      item.laws?.some((l) => l.toLowerCase().includes(search))
    )
  })

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentItems = filteredItems.slice(startIndex, endIndex)

  const handleUploadMsdsPdf = async () => {
    if (!editMsdsPdfFile || !editingItem) return

    try {
      setUploadingPdf(true)
      const formData = new FormData()
      formData.append("file", editMsdsPdfFile)
      formData.append("msdsId", editingItem.id.toString())
      formData.append("msdsName", editingItem.name)

      const response = await fetch("/api/upload/pdf", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) throw new Error("PDF 업로드 실패")

      const data = await response.json()
      setEditingItem({
        ...editingItem,
        pdfFileName: data.fileName,
        pdfUrl: data.url,
      })
      setEditMsdsPdfFile(null)
      showMessage("success", "MSDS PDF가 업로드되었습니다.")
    } catch (error) {
      console.error("PDF 업로드 오류:", error)
      showMessage("error", "PDF 업로드 중 오류가 발생했습니다.")
    } finally {
      setUploadingPdf(false)
    }
  }

  const handleUploadWarningLabel = async () => {
    if (!editWarningLabelFile || !editingItem) return

    try {
      setUploadingPdf(true)
      const formData = new FormData()
      formData.append("file", editWarningLabelFile)
      formData.append("msdsId", editingItem.id.toString())
      formData.append("msdsName", editingItem.name)

      const response = await fetch("/api/upload/warning-label", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) throw new Error("경고표지 업로드 실패")

      const data = await response.json()
      setEditingItem({
        ...editingItem,
        warningLabelPdfUrl: data.url,
        warningLabelPdfName: data.fileName,
      })
      setEditWarningLabelFile(null)
      showMessage("success", "경고표지 PDF가 업로드되었습니다.")
    } catch (error) {
      console.error("경고표지 업로드 오류:", error)
      showMessage("error", "경고표지 업로드 중 오류가 발생했습니다.")
    } finally {
      setUploadingPdf(false)
    }
  }

  const handleUploadGuidelines = async () => {
    if (!editGuidelinesFile || !editingItem) return

    try {
      setUploadingPdf(true)
      const formData = new FormData()
      formData.append("file", editGuidelinesFile)
      formData.append("msdsId", editingItem.id.toString())
      formData.append("msdsName", editingItem.name)

      const response = await fetch("/api/upload/management-guidelines", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) throw new Error("관리요령 업로드 실패")

      const data = await response.json()
      setEditingItem({
        ...editingItem,
        managementGuidelinesPdfUrl: data.url,
        managementGuidelinesPdfName: data.fileName,
      })
      setEditGuidelinesFile(null)
      showMessage("success", "관리요령 PDF가 업로드되었습니다.")
    } catch (error) {
      console.error("관리요령 업로드 오류:", error)
      showMessage("error", "관리요령 업로드 중 오류가 발생했습니다.")
    } finally {
      setUploadingPdf(false)
    }
  }

  const handleEdit = (item: MsdsItem) => {
    setEditingItem(item)
    setEditMsdsPdfFile(null)
    setEditWarningLabelFile(null)
    setEditGuidelinesFile(null)
    setShowEditDialog(true)
  }

  const handleSaveEdit = async () => {
    if (!editingItem) return

    try {
      setSubmitting(true)
      const response = await fetch(`/api/msds/${editingItem.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editingItem.name,
          warningSymbols: editingItem.warningSymbols || [],
          hazards: editingItem.hazards || [],
          reception: editingItem.reception || [],
          laws: editingItem.laws || [],
          pdfFileName: editingItem.pdfFileName,
          pdfUrl: editingItem.pdfUrl,
          warningLabelPdfUrl: editingItem.warningLabelPdfUrl,
          warningLabelPdfName: editingItem.warningLabelPdfName,
          managementGuidelinesPdfUrl: editingItem.managementGuidelinesPdfUrl,
          managementGuidelinesPdfName: editingItem.managementGuidelinesPdfName,
        }),
      })

      if (!response.ok) throw new Error("저장 실패")

      await loadMsdsItems()
      setShowEditDialog(false)
      setEditingItem(null)
      setEditMsdsPdfFile(null)
      setEditWarningLabelFile(null)
      setEditGuidelinesFile(null)
      showMessage("success", "MSDS 항목이 수정되었습니다.")
    } catch (error) {
      console.error("저장 오류:", error)
      showMessage("error", "저장 중 오류가 발생했습니다.")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("정말로 이 MSDS 항목을 삭제하시겠습니까?")) return
    try {
      const response = await fetch(`/api/msds/${id}`, { method: "DELETE" })
      if (!response.ok) throw new Error("삭제 실패")
      await loadMsdsItems()
      showMessage("success", "MSDS 항목이 삭제되었습니다.")
    } catch (error) {
      console.error("삭제 오류:", error)
      showMessage("error", "삭제 중 오류가 발생했습니다.")
    }
  }

  const handleShowQR = (item: MsdsItem) => {
    setSelectedQRItem(item)
    setShowQRModal(true)
  }

  const handleGenerate = (item: MsdsItem) => {
    setSelectedGenerateItem(item)
    setShowGenerateDialog(true)
  }

  const handleEditSymbol = (symbol: WarningSymbol) => {
    setEditingSymbol(symbol)
    setSymbolFormData({
      id: symbol.id,
      name: symbol.name,
      description: symbol.description || "",
      category: symbol.category || "physical", // This state is now unused in the updates, will be removed conceptually.
      imageUrl: symbol.imageUrl || "",
    })
    setIsSymbolDialogOpen(true)
  }

  const handleAddSymbol = () => {
    // Remove this function as it's not used in the new structure
    setEditingSymbol(null)
    setSymbolFormData({
      id: "",
      name: "",
      description: "",
      category: "physical",
      imageUrl: "",
    })
    setIsSymbolDialogOpen(true)
  }

  const handleSaveSymbol = async () => {
    if (!symbolFormData.id) return

    try {
      const response = await fetch(`/api/warning-symbols/${symbolFormData.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(symbolFormData),
      })

      if (response.ok) {
        await loadWarningSymbols()
        setEditingSymbol(null)
        setIsSymbolDialogOpen(false)
        showMessage("success", "경고 표지가 저장되었습니다.")
      } else {
        const error = await response.json()
        showMessage("error", `저장 실패: ${error.error || "알 수 없는 오류"}`)
      }
    } catch (error) {
      console.error("Failed to save warning symbol:", error)
      showMessage("error", "저장 중 오류가 발생했습니다.")
    }
  }

  const handleDeleteSymbol = async (id: string) => {
    if (!confirm("정말로 이 경고 표지를 삭제하시겠습니까?")) return
    try {
      const response = await fetch(`/api/warning-symbols/${id}`, { method: "DELETE" })
      if (!response.ok) throw new Error("삭제 실패")
      await loadWarningSymbols()
      showMessage("success", "경고 표지가 삭제되었습니다.")
    } catch (error) {
      console.error("Error deleting symbol:", error)
      showMessage("error", "경고 표지 삭제 중 오류가 발생했습니다.")
    }
  }

  const handleEditEquipment = (equipment: ProtectiveEquipment) => {
    setEditingEquipment(equipment)
    setEquipmentFormData({
      id: equipment.id,
      name: equipment.name,
      description: equipment.description || "",
      category: equipment.category || "respiratory", // This state is now unused in the updates, will be removed conceptually.
      imageUrl: equipment.imageUrl || "",
    })
    setIsEquipmentDialogOpen(true)
  }

  const handleAddEquipment = () => {
    // Remove this function as it's not used in the new structure
    setEditingEquipment(null)
    setEquipmentFormData({
      id: "",
      name: "",
      description: "",
      category: "respiratory",
      imageUrl: "",
    })
    setIsEquipmentDialogOpen(true)
  }

  const handleSaveEquipment = async () => {
    if (!equipmentFormData.id) return

    try {
      const response = await fetch(`/api/protective-equipment/${equipmentFormData.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(equipmentFormData),
      })

      if (response.ok) {
        await loadProtectiveEquipment()
        setEditingEquipment(null)
        setIsEquipmentDialogOpen(false)
        showMessage("success", "보호 장구가 저장되었습니다.")
      } else {
        const error = await response.json()
        showMessage("error", `저장 실패: ${error.error || "알 수 없는 오류"}`)
      }
    } catch (error) {
      console.error("Failed to save equipment:", error)
      showMessage("error", "저장 중 오류가 발생했습니다.")
    }
  }

  const handleDeleteEquipment = async (id: string) => {
    if (!confirm("정말로 이 보호 장구를 삭제하시겠습니까?")) return
    try {
      const response = await fetch(`/api/protective-equipment/${id}`, { method: "DELETE" })
      if (!response.ok) throw new Error("삭제 실패")
      await loadProtectiveEquipment()
      showMessage("success", "보호 장구가 삭제되었습니다.")
    } catch (error) {
      console.error("Error deleting equipment:", error)
      showMessage("error", "보호 장구 삭제 중 오류가 발생했습니다.")
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-"
    const date = new Date(dateString)
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">MSDS 관리자</h1>
              <p className="text-sm text-muted-foreground">물질안전보건자료 관리 시스템</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
                <QrCode className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
                새로고침
              </Button>
              <Link href="/">
                <Button variant="outline" size="sm">
                  사용자 화면
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Message */}
      {message && (
        <div
          className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
            message.type === "success" ? "bg-green-500 text-white" : "bg-red-500 text-white"
          }`}
        >
          {message.text}
        </div>
      )}

      <main className="container mx-auto px-4 py-6">
        <Tabs defaultValue="msds" className="space-y-6">
          <TabsList>
            <TabsTrigger value="msds">MSDS 관리</TabsTrigger>
            <TabsTrigger value="symbols">그림문자</TabsTrigger>
            <TabsTrigger value="equipment">보호구</TabsTrigger>
            <TabsTrigger value="upload">엑셀 업로드</TabsTrigger>
          </TabsList>

          <TabsContent value="msds" className="space-y-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 max-w-md">
                <Input
                  type="text"
                  placeholder="물질명, 용도, 장소로 검색..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="w-full"
                />
              </div>
              <div className="text-sm text-muted-foreground">총 {filteredItems.length}개 항목</div>
            </div>

            {loading ? (
              <div className="text-center py-12">데이터를 불러오는 중...</div>
            ) : (
              <div className="space-y-4">
                {currentItems.map((item) => (
                  <Card key={item.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-3">
                          {/* 제목 및 용도 */}
                          <div className="flex items-center gap-3">
                            <h3 className="text-lg font-semibold">{item.name}</h3>
                            {/* Removed unused 'usage' logic, replaced with a placeholder or direct display if available */}
                            <Badge className="bg-blue-500 text-white">{item.usage || "순수시약"}</Badge>
                          </div>

                          {item.updatedAt && (
                            <div className="text-sm text-muted-foreground">
                              최근 수정일: {formatDate(item.updatedAt)}
                            </div>
                          )}

                          <div className="flex items-center gap-4 text-sm">
                            {item.pdfFileName && (
                              <div className="flex items-center gap-1 text-green-600">
                                <FileText className="w-4 h-4" />
                                <span>MSDS</span>
                              </div>
                            )}
                            {item.warningLabelPdfName && (
                              <div className="flex items-center gap-1 text-orange-600">
                                <AlertTriangle className="w-4 h-4" />
                                <span>경고표지</span>
                              </div>
                            )}
                            {item.managementGuidelinesPdfName && (
                              <div className="flex items-center gap-1 text-blue-600">
                                <FileText className="w-4 h-4" />
                                <span>관리요령</span>
                              </div>
                            )}
                          </div>

                          {/* 경고표지 및 보호장구 개수 */}
                          <div className="flex items-center gap-4 text-sm">
                            {/* Added display for warningSymbolsData and protectiveEquipmentData counts */}
                            <Badge variant="outline">그림문자: {item.warningSymbolsData?.length || 0}개</Badge>
                            <Badge variant="outline">보호구: {item.protectiveEquipmentData?.length || 0}개</Badge>
                          </div>

                          {/* 장소 */}
                          {item.reception && item.reception.length > 0 && (
                            <div className="text-sm">
                              <span className="font-medium text-gray-700">장소:</span>{" "}
                              <span className="text-gray-600">{item.reception.join(", ")}</span>
                            </div>
                          )}

                          {/* 관련법규 */}
                          {item.laws && item.laws.length > 0 && (
                            <div className="text-sm">
                              <span className="font-medium text-gray-700">관련법규:</span>{" "}
                              <span className="text-gray-600">{item.laws.join(", ")}</span>
                            </div>
                          )}
                        </div>

                        {/* 액션 버튼들 */}
                        <div className="flex items-center gap-2 ml-4">
                          <Button variant="outline" size="sm" onClick={() => handleShowQR(item)}>
                            <QrCode className="w-4 h-4 mr-1" />
                            QR코드
                          </Button>

                          <Button variant="outline" size="sm" onClick={() => handleGenerate(item)}>
                            <FileText className="w-4 h-4 mr-1" />
                            생성
                          </Button>

                          <Button variant="outline" size="sm" onClick={() => handleEdit(item)}>
                            <Edit className="w-4 h-4 mr-1" />
                            수정
                          </Button>

                          <Button variant="destructive" size="sm" onClick={() => handleDelete(item.id)}>
                            <Trash2 className="w-4 h-4 mr-1" />
                            삭제
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
            {/* Pagination UI */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-6 border-t">
                <div className="text-sm text-muted-foreground">
                  {startIndex + 1}-{Math.min(endIndex, filteredItems.length)} / {filteredItems.length}개 항목
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    이전
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum
                      if (totalPages <= 5) {
                        pageNum = i + 1
                      } else if (currentPage <= 3) {
                        pageNum = i + 1
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i
                      } else {
                        pageNum = currentPage - 2 + i
                      }
                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(pageNum)}
                          className="w-10"
                        >
                          {pageNum}
                        </Button>
                      )
                    })}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    다음
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          {/* 경고 표지 탭 */}
          <TabsContent value="symbols" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">그림문자 관리 ({warningSymbols.length}개)</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {warningSymbols.map((symbol) => (
                <Card key={symbol.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      {symbol.imageUrl && (
                        <img
                          src={symbol.imageUrl || "/placeholder.svg"}
                          alt={symbol.name}
                          className="w-16 h-16 object-contain"
                        />
                      )}
                      <div className="flex-1">
                        <h3 className="font-semibold">{symbol.name}</h3>
                        <p className="text-sm text-muted-foreground">{symbol.description}</p>
                        <div className="flex gap-2 mt-2">
                          <Button size="sm" variant="outline" onClick={() => handleEditSymbol(symbol)}>
                            수정
                          </Button>
                          {/* Removed Delete button */}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* 보호 장구 탭 */}
          <TabsContent value="equipment" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">보호구 관리 ({protectiveEquipment.length}개)</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {protectiveEquipment.map((equipment) => (
                <Card key={equipment.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      {equipment.imageUrl && (
                        <img
                          src={equipment.imageUrl || "/placeholder.svg"}
                          alt={equipment.name}
                          className="w-16 h-16 object-contain"
                        />
                      )}
                      <div className="flex-1">
                        <h3 className="font-semibold">{equipment.name}</h3>
                        <p className="text-sm text-muted-foreground">{equipment.description}</p>
                        <div className="flex gap-2 mt-2">
                          <Button size="sm" variant="outline" onClick={() => handleEditEquipment(equipment)}>
                            수정
                          </Button>
                          {/* Removed Delete button */}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* 엑셀 업로드 탭 */}
          <TabsContent value="upload">
            {/* Renamed prop onUploadSuccess to onUploadComplete */}
            <ExcelUpload onUploadComplete={loadMsdsItems} />
          </TabsContent>
        </Tabs>
      </main>

      {/* QR 모달 */}
      {showQRModal && selectedQRItem && <QRPrintModal item={selectedQRItem} onClose={() => setShowQRModal(false)} />}

      {/* 수정 다이얼로그 */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>MSDS 항목 수정</DialogTitle>
          </DialogHeader>
          {editingItem && (
            <div className="space-y-4">
              <div>
                <Label>제품명</Label>
                <Input
                  value={editingItem.name}
                  onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                />
              </div>

              <div className="space-y-4 border-t pt-4">
                <h3 className="font-semibold">PDF 파일 업로드</h3>

                {/* MSDS PDF */}
                <div>
                  <Label>MSDS (PDF)</Label>
                  <div className="space-y-2 mt-2">
                    {editingItem.pdfFileName && (
                      <div className="flex items-center gap-2 p-2 bg-muted rounded">
                        <FileText className="h-4 w-4 text-green-600" />
                        <span className="text-sm flex-1">{editingItem.pdfFileName}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingItem({ ...editingItem, pdfFileName: "", pdfUrl: "" })}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Input
                        type="file"
                        accept=".pdf"
                        onChange={(e) => setEditMsdsPdfFile(e.target.files?.[0] || null)}
                        className="flex-1"
                      />
                      <Button onClick={handleUploadMsdsPdf} disabled={!editMsdsPdfFile || uploadingPdf} size="sm">
                        {uploadingPdf ? "업로드 중..." : "업로드"}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Warning Label PDF */}
                <div>
                  <Label>경고표지 (PDF)</Label>
                  <div className="space-y-2 mt-2">
                    {editingItem.warningLabelPdfName && (
                      <div className="flex items-center gap-2 p-2 bg-muted rounded">
                        <AlertTriangle className="h-4 w-4 text-orange-600" />
                        <span className="text-sm flex-1">{editingItem.warningLabelPdfName}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            setEditingItem({ ...editingItem, warningLabelPdfName: "", warningLabelPdfUrl: "" })
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Input
                        type="file"
                        accept=".pdf"
                        onChange={(e) => setEditWarningLabelFile(e.target.files?.[0] || null)}
                        className="flex-1"
                      />
                      <Button
                        onClick={handleUploadWarningLabel}
                        disabled={!editWarningLabelFile || uploadingPdf}
                        size="sm"
                      >
                        {uploadingPdf ? "업로드 중..." : "업로드"}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Management Guidelines PDF */}
                <div>
                  <Label>화학물질 작업공정별 관리요령 (PDF)</Label>
                  <div className="space-y-2 mt-2">
                    {editingItem.managementGuidelinesPdfName && (
                      <div className="flex items-center gap-2 p-2 bg-muted rounded">
                        <FileText className="h-4 w-4 text-blue-600" />
                        <span className="text-sm flex-1">{editingItem.managementGuidelinesPdfName}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            setEditingItem({
                              ...editingItem,
                              managementGuidelinesPdfName: "",
                              managementGuidelinesPdfUrl: "",
                            })
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Input
                        type="file"
                        accept=".pdf"
                        onChange={(e) => setEditGuidelinesFile(e.target.files?.[0] || null)}
                        className="flex-1"
                      />
                      <Button onClick={handleUploadGuidelines} disabled={!editGuidelinesFile || uploadingPdf} size="sm">
                        {uploadingPdf ? "업로드 중..." : "업로드"}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* 경고표지 선택 */}
              <div>
                <Label>그림문자</Label>
                <div className="grid grid-cols-2 gap-2 mt-2 max-h-40 overflow-y-auto p-2 border rounded">
                  {warningSymbols.map((symbol) => (
                    <div key={symbol.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`edit-symbol-${symbol.id}`}
                        checked={editingItem.warningSymbols?.includes(symbol.id)}
                        onCheckedChange={(checked) => {
                          const current = editingItem.warningSymbols || []
                          if (checked) {
                            setEditingItem({ ...editingItem, warningSymbols: [...current, symbol.id] })
                          } else {
                            setEditingItem({
                              ...editingItem,
                              warningSymbols: current.filter((id) => id !== symbol.id),
                            })
                          }
                        }}
                      />
                      <label htmlFor={`edit-symbol-${symbol.id}`} className="text-sm cursor-pointer">
                        {symbol.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* 보호장구 선택 */}
              <div>
                <Label>보호구</Label>
                <div className="grid grid-cols-2 gap-2 mt-2 max-h-40 overflow-y-auto p-2 border rounded">
                  {protectiveEquipment.map((equipment) => (
                    <div key={equipment.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`edit-equipment-${equipment.id}`}
                        checked={editingItem.hazards?.includes(equipment.id)}
                        onCheckedChange={(checked) => {
                          const current = editingItem.hazards || []
                          if (checked) {
                            setEditingItem({ ...editingItem, hazards: [...current, equipment.id] })
                          } else {
                            setEditingItem({
                              ...editingItem,
                              hazards: current.filter((id) => id !== equipment.id),
                            })
                          }
                        }}
                      />
                      <label htmlFor={`edit-equipment-${equipment.id}`} className="text-sm cursor-pointer">
                        {equipment.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label>사용 장소</Label>
                <div className="grid grid-cols-2 gap-2 mt-2 max-h-40 overflow-y-auto p-2 border rounded">
                  {receptionOptions.map((option) => (
                    <div key={option} className="flex items-center space-x-2">
                      <Checkbox
                        id={`edit-reception-${option}`}
                        checked={editingItem.reception?.includes(option)}
                        onCheckedChange={(checked) => {
                          const current = editingItem.reception || []
                          if (checked) {
                            setEditingItem({ ...editingItem, reception: [...current, option] })
                          } else {
                            setEditingItem({
                              ...editingItem,
                              reception: current.filter((r) => r !== option),
                            })
                          }
                        }}
                      />
                      <label htmlFor={`edit-reception-${option}`} className="text-sm cursor-pointer">
                        {option}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label>관련 법규</Label>
                <div className="grid grid-cols-2 gap-2 mt-2 max-h-40 overflow-y-auto p-2 border rounded">
                  {lawsOptions.map((option) => (
                    <div key={option} className="flex items-center space-x-2">
                      <Checkbox
                        id={`edit-laws-${option}`}
                        checked={editingItem.laws?.includes(option)}
                        onCheckedChange={(checked) => {
                          const current = editingItem.laws || []
                          if (checked) {
                            setEditingItem({ ...editingItem, laws: [...current, option] })
                          } else {
                            setEditingItem({
                              ...editingItem,
                              laws: current.filter((l) => l !== option),
                            })
                          }
                        }}
                      />
                      <label htmlFor={`edit-laws-${option}`} className="text-sm cursor-pointer">
                        {option}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                  취소
                </Button>
                <Button onClick={handleSaveEdit} disabled={submitting}>
                  {submitting ? "저장 중..." : "저장"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 경고 표지 수정 다이얼로그 */}
      <Dialog open={isSymbolDialogOpen} onOpenChange={setIsSymbolDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>그림문자 수정</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>이름</Label>
              <Input
                value={symbolFormData.name}
                onChange={(e) => setSymbolFormData({ ...symbolFormData, name: e.target.value })}
              />
            </div>
            <div>
              <Label>설명</Label>
              <Input
                value={symbolFormData.description}
                onChange={(e) => setSymbolFormData({ ...symbolFormData, description: e.target.value })}
              />
            </div>
            <div>
              <Label>이미지</Label>
              <ImageUpload
                currentImageUrl={symbolFormData.imageUrl}
                // Renamed prop onImageChange to onImageUploaded
                onImageUploaded={(url) => setSymbolFormData({ ...symbolFormData, imageUrl: url })}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsSymbolDialogOpen(false)}>
                취소
              </Button>
              <Button onClick={handleSaveSymbol}>저장</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 보호 장구 수정 다이얼로그 */}
      <Dialog open={isEquipmentDialogOpen} onOpenChange={setIsEquipmentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>보호구 수정</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>이름</Label>
              <Input
                value={equipmentFormData.name}
                onChange={(e) => setEquipmentFormData({ ...equipmentFormData, name: e.target.value })}
              />
            </div>
            <div>
              <Label>설명</Label>
              <Input
                value={equipmentFormData.description}
                onChange={(e) => setEquipmentFormData({ ...equipmentFormData, description: e.target.value })}
              />
            </div>
            <div>
              <Label>이미지</Label>
              <ImageUpload
                currentImageUrl={equipmentFormData.imageUrl}
                // Renamed prop onImageChange to onImageUploaded
                onImageUploaded={(url) => setEquipmentFormData({ ...equipmentFormData, imageUrl: url })}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEquipmentDialogOpen(false)}>
                취소
              </Button>
              <Button onClick={handleSaveEquipment}>저장</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 생성 문서 다이얼로그 */}
      {showGenerateDialog && selectedGenerateItem && (
        <GenerateDocumentsDialog
          item={selectedGenerateItem}
          open={showGenerateDialog}
          onClose={() => {
            setShowGenerateDialog(false)
            setSelectedGenerateItem(null)
          }}
        />
      )}
    </div>
  )
}
