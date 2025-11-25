"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  RefreshCw,
  Plus,
  Edit,
  Trash2,
  Search,
  QrCode,
  AlertTriangle,
  Flame,
  Skull,
  Biohazard,
  Zap,
  Droplets,
  Wind,
  Shield,
  Eye,
  Hand,
  Footprints,
  Shirt,
  HardHat,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import Link from "next/link"
import type { MsdsItem, WarningSymbol, ProtectiveEquipment } from "@/types/msds"
import { QRPrintModal } from "@/components/qr-print-modal"
import { ExcelUpload } from "@/components/excel-upload"

const WARNING_SYMBOL_ICONS: Record<string, React.ReactNode> = {
  "1": <Zap className="w-8 h-8 text-amber-600" />,
  "2": <Flame className="w-8 h-8 text-red-600" />,
  "3": <Wind className="w-8 h-8 text-orange-600" />,
  "4": <Droplets className="w-8 h-8 text-blue-600" />,
  "5": <Droplets className="w-8 h-8 text-purple-600" />,
  "6": <Skull className="w-8 h-8 text-gray-800" />,
  "7": <AlertTriangle className="w-8 h-8 text-yellow-600" />,
  "8": <Biohazard className="w-8 h-8 text-red-800" />,
  "9": <Biohazard className="w-8 h-8 text-green-600" />,
}

const PROTECTIVE_EQUIPMENT_ICONS: Record<string, React.ReactNode> = {
  "1": <Eye className="w-8 h-8 text-blue-600" />,
  "2": <HardHat className="w-8 h-8 text-blue-600" />,
  "3": <Wind className="w-8 h-8 text-gray-600" />,
  "4": <Wind className="w-8 h-8 text-gray-400" />,
  "5": <Hand className="w-8 h-8 text-green-600" />,
  "6": <Hand className="w-8 h-8 text-orange-600" />,
  "7": <Shirt className="w-8 h-8 text-blue-600" />,
  "8": <Footprints className="w-8 h-8 text-gray-600" />,
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
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState<FormData>(initialFormData)
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
  const [showSymbolForm, setShowSymbolForm] = useState(false)
  const [symbolFormData, setSymbolFormData] = useState({
    id: "",
    name: "",
    description: "",
    category: "physical",
    imageUrl: "",
  })

  const [editingEquipment, setEditingEquipment] = useState<ProtectiveEquipment | null>(null)
  const [showEquipmentForm, setShowEquipmentForm] = useState(false)
  const [equipmentFormData, setEquipmentFormData] = useState({
    id: "",
    name: "",
    description: "",
    category: "respiratory",
    imageUrl: "",
  })

  useEffect(() => {
    loadAllData()
  }, [])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm])

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
        setMsdsItems(Array.isArray(data) ? data : [])
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
        setWarningSymbols(Array.isArray(data) ? data : [])
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
        setProtectiveEquipment(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error("Error loading protective equipment:", error)
    }
  }

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 5000)
  }

  // 필터링된 아이템
  const filteredItems = msdsItems.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.pdfFileName?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentItems = filteredItems.slice(startIndex, endIndex)

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

  // MSDS 관리 함수들
  const handleEdit = (item: MsdsItem) => {
    setEditingItem(item)
    setFormData({
      id: item.id,
      name: item.name,
      pdfFileName: item.pdfFileName || "",
      pdfUrl: item.pdfUrl || "",
      hazards: item.hazards || [],
      usage: item.usage || "",
      reception: item.reception || [],
      laws: item.laws || [],
      warningSymbols: item.warningSymbols || [],
    })
    setShowAddForm(false)
  }

  const handleAdd = () => {
    setShowAddForm(true)
    setEditingItem(null)
    setFormData(initialFormData)
  }

  const handleSave = async () => {
    try {
      setSubmitting(true)
      if (!formData.name.trim()) {
        showMessage("error", "MSDS명을 입력해주세요.")
        return
      }

      const submitData = {
        name: formData.name,
        pdfFileName: formData.pdfFileName,
        pdfUrl: formData.pdfUrl,
        hazards: formData.hazards,
        usage: formData.usage,
        reception: formData.reception,
        laws: formData.laws,
        warningSymbols: formData.warningSymbols,
      }

      let response
      if (editingItem) {
        response = await fetch(`/api/msds/${editingItem.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(submitData),
        })
      } else {
        response = await fetch("/api/msds", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(submitData),
        })
      }

      if (!response.ok) throw new Error("저장 실패")

      await loadMsdsItems()
      setShowAddForm(false)
      setEditingItem(null)
      setFormData(initialFormData)
      showMessage("success", editingItem ? "MSDS 항목이 수정되었습니다." : "MSDS 항목이 추가되었습니다.")
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

  const handleEditSymbol = (symbol: WarningSymbol) => {
    setEditingSymbol(symbol)
    setSymbolFormData({
      id: symbol.id,
      name: symbol.name,
      description: symbol.description || "",
      category: symbol.category || "physical",
      imageUrl: symbol.imageUrl || "",
    })
    setShowSymbolForm(true)
  }

  const handleAddSymbol = () => {
    setEditingSymbol(null)
    setSymbolFormData({
      id: "",
      name: "",
      description: "",
      category: "physical",
      imageUrl: "",
    })
    setShowSymbolForm(true)
  }

  const handleSaveSymbol = async () => {
    try {
      if (!symbolFormData.name.trim()) {
        showMessage("error", "경고 표지 이름을 입력해주세요.")
        return
      }

      const submitData = {
        id: symbolFormData.id || `symbol_${Date.now()}`,
        name: symbolFormData.name,
        description: symbolFormData.description,
        imageUrl: symbolFormData.imageUrl || "/placeholder.svg",
        category: symbolFormData.category,
        isActive: true,
      }

      let response
      if (editingSymbol) {
        response = await fetch(`/api/warning-symbols/${editingSymbol.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(submitData),
        })
      } else {
        response = await fetch("/api/warning-symbols", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(submitData),
        })
      }

      if (!response.ok) throw new Error("저장 실패")

      await loadWarningSymbols()
      setShowSymbolForm(false)
      setEditingSymbol(null)
      showMessage("success", editingSymbol ? "경고 표지가 수정되었습니다." : "경고 표지가 추가되었습니다.")
    } catch (error) {
      console.error("Error saving symbol:", error)
      showMessage("error", "경고 표지 저장 중 오류가 발생했습니다.")
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
      category: equipment.category || "respiratory",
      imageUrl: equipment.imageUrl || "",
    })
    setShowEquipmentForm(true)
  }

  const handleAddEquipment = () => {
    setEditingEquipment(null)
    setEquipmentFormData({
      id: "",
      name: "",
      description: "",
      category: "respiratory",
      imageUrl: "",
    })
    setShowEquipmentForm(true)
  }

  const handleSaveEquipment = async () => {
    try {
      if (!equipmentFormData.name.trim()) {
        showMessage("error", "보호 장구 이름을 입력해주세요.")
        return
      }

      const submitData = {
        id: equipmentFormData.id || `equipment_${Date.now()}`,
        name: equipmentFormData.name,
        description: equipmentFormData.description,
        imageUrl: equipmentFormData.imageUrl || "/placeholder.svg",
        category: equipmentFormData.category,
        isActive: true,
      }

      let response
      if (editingEquipment) {
        response = await fetch(`/api/protective-equipment/${editingEquipment.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(submitData),
        })
      } else {
        response = await fetch("/api/protective-equipment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(submitData),
        })
      }

      if (!response.ok) throw new Error("저장 실패")

      await loadProtectiveEquipment()
      setShowEquipmentForm(false)
      setEditingEquipment(null)
      showMessage("success", editingEquipment ? "보호 장구가 수정되었습니다." : "보호 장구가 추가되었습니다.")
    } catch (error) {
      console.error("Error saving equipment:", error)
      showMessage("error", "보호 장구 저장 중 오류가 발생했습니다.")
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
                <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
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
            <TabsTrigger value="symbols">경고 표지</TabsTrigger>
            <TabsTrigger value="equipment">보호 장구</TabsTrigger>
            <TabsTrigger value="upload">엑셀 업로드</TabsTrigger>
          </TabsList>

          {/* MSDS Tab */}
          <TabsContent value="msds" className="space-y-6">
            {/* Search and Add */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-80">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="MSDS 검색..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Badge variant="secondary">총 {filteredItems.length}개</Badge>
              </div>
              <Button onClick={handleAdd}>
                <Plus className="w-4 h-4 mr-2" />새 MSDS 추가
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">페이지당:</span>
              <Select
                value={itemsPerPage.toString()}
                onValueChange={(v) => {
                  setItemsPerPage(Number(v))
                  setCurrentPage(1)
                }}
              >
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-sm text-muted-foreground ml-4">
                {startIndex + 1}-{Math.min(endIndex, filteredItems.length)} / {filteredItems.length}
              </span>
            </div>

            {/* Add/Edit Form */}
            {(showAddForm || editingItem) && (
              <Card>
                <CardHeader>
                  <CardTitle>{editingItem ? "MSDS 수정" : "새 MSDS 추가"}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>MSDS명 *</Label>
                      <Input
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="물질명을 입력하세요"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>PDF 파일명</Label>
                      <Input
                        value={formData.pdfFileName}
                        onChange={(e) => setFormData({ ...formData, pdfFileName: e.target.value })}
                        placeholder="PDF 파일명"
                      />
                    </div>
                  </div>

                  {/* Warning Symbols */}
                  <div className="space-y-2">
                    <Label>경고 표지</Label>
                    <div className="flex flex-wrap gap-2">
                      {warningSymbols.map((symbol) => (
                        <div key={symbol.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`symbol-${symbol.id}`}
                            checked={formData.warningSymbols.includes(symbol.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setFormData({ ...formData, warningSymbols: [...formData.warningSymbols, symbol.id] })
                              } else {
                                setFormData({
                                  ...formData,
                                  warningSymbols: formData.warningSymbols.filter((id) => id !== symbol.id),
                                })
                              }
                            }}
                          />
                          <label htmlFor={`symbol-${symbol.id}`} className="text-sm cursor-pointer">
                            {symbol.name}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Protective Equipment */}
                  <div className="space-y-2">
                    <Label>보호 장구</Label>
                    <div className="flex flex-wrap gap-2">
                      {protectiveEquipment.map((equipment) => (
                        <div key={equipment.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`equipment-${equipment.id}`}
                            checked={formData.hazards.includes(equipment.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setFormData({ ...formData, hazards: [...formData.hazards, equipment.id] })
                              } else {
                                setFormData({
                                  ...formData,
                                  hazards: formData.hazards.filter((id) => id !== equipment.id),
                                })
                              }
                            }}
                          />
                          <label htmlFor={`equipment-${equipment.id}`} className="text-sm cursor-pointer">
                            {equipment.name}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={handleSave} disabled={submitting}>
                      {submitting ? "저장 중..." : "저장"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowAddForm(false)
                        setEditingItem(null)
                        setFormData(initialFormData)
                      }}
                    >
                      취소
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* MSDS List */}
            {loading ? (
              <div className="text-center py-8">로딩 중...</div>
            ) : (
              <div className="grid gap-4">
                {currentItems.map((item) => (
                  <Card key={item.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold">{item.name}</h3>
                          <p className="text-sm text-muted-foreground">{item.pdfFileName}</p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {item.warningSymbols?.map((symbolId) => {
                              const symbol = warningSymbols.find((s) => s.id === symbolId)
                              return symbol ? (
                                <Badge key={symbolId} variant="outline" className="text-xs">
                                  {symbol.name}
                                </Badge>
                              ) : null
                            })}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleShowQR(item)} title="QR코드">
                            <QrCode className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(item)} title="수정">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(item.id)}
                            title="삭제"
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                {getPageNumbers().map((page) => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="symbols" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>경고 표지 목록</CardTitle>
                <Button onClick={handleAddSymbol}>
                  <Plus className="w-4 h-4 mr-2" />새 경고 표지 추가
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {warningSymbols.map((symbol) => (
                    <div
                      key={symbol.id}
                      className="border rounded-lg p-4 text-center hover:shadow-md transition-shadow group relative"
                    >
                      <div className="w-16 h-16 mx-auto mb-2 bg-amber-50 border-2 border-amber-400 rounded-lg flex items-center justify-center">
                        {WARNING_SYMBOL_ICONS[symbol.id] || <AlertTriangle className="w-8 h-8 text-amber-600" />}
                      </div>
                      <h4 className="font-medium">{symbol.name}</h4>
                      <p className="text-xs text-muted-foreground mt-1">{symbol.description}</p>
                      {/* 편집/삭제 버튼 */}
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleEditSymbol(symbol)}
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => handleDeleteSymbol(symbol.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="equipment" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>보호 장구 목록</CardTitle>
                <Button onClick={handleAddEquipment}>
                  <Plus className="w-4 h-4 mr-2" />새 보호 장구 추가
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {protectiveEquipment.map((equipment) => (
                    <div
                      key={equipment.id}
                      className="border rounded-lg p-4 text-center hover:shadow-md transition-shadow group relative"
                    >
                      <div className="w-16 h-16 mx-auto mb-2 bg-blue-50 border border-blue-300 rounded-full flex items-center justify-center">
                        {PROTECTIVE_EQUIPMENT_ICONS[equipment.id] || <Shield className="w-8 h-8 text-blue-600" />}
                      </div>
                      <h4 className="font-medium">{equipment.name}</h4>
                      <p className="text-xs text-muted-foreground mt-1">{equipment.description}</p>
                      {/* 편집/삭제 버튼 */}
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleEditEquipment(equipment)}
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => handleDeleteEquipment(equipment.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Excel Upload Tab */}
          <TabsContent value="upload" className="space-y-6">
            <ExcelUpload onUploadSuccess={loadMsdsItems} />
          </TabsContent>
        </Tabs>
      </main>

      {/* QR Code Modal */}
      <QRPrintModal isOpen={showQRModal} onClose={() => setShowQRModal(false)} msdsItem={selectedQRItem} />

      <Dialog open={showSymbolForm} onOpenChange={setShowSymbolForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSymbol ? "경고 표지 수정" : "새 경고 표지 추가"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>ID</Label>
              <Input
                value={symbolFormData.id}
                onChange={(e) => setSymbolFormData({ ...symbolFormData, id: e.target.value })}
                placeholder="고유 ID (예: 1, 2, 3...)"
                disabled={!!editingSymbol}
              />
            </div>
            <div className="space-y-2">
              <Label>이름 *</Label>
              <Input
                value={symbolFormData.name}
                onChange={(e) => setSymbolFormData({ ...symbolFormData, name: e.target.value })}
                placeholder="경고 표지 이름"
              />
            </div>
            <div className="space-y-2">
              <Label>설명</Label>
              <Input
                value={symbolFormData.description}
                onChange={(e) => setSymbolFormData({ ...symbolFormData, description: e.target.value })}
                placeholder="설명"
              />
            </div>
            <div className="space-y-2">
              <Label>카테고리</Label>
              <Select
                value={symbolFormData.category}
                onValueChange={(v) => setSymbolFormData({ ...symbolFormData, category: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="physical">물리적 위험</SelectItem>
                  <SelectItem value="health">건강 위험</SelectItem>
                  <SelectItem value="environment">환경 위험</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSaveSymbol}>저장</Button>
              <Button variant="outline" onClick={() => setShowSymbolForm(false)}>
                취소
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showEquipmentForm} onOpenChange={setShowEquipmentForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingEquipment ? "보호 장구 수정" : "새 보호 장구 추가"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>ID</Label>
              <Input
                value={equipmentFormData.id}
                onChange={(e) => setEquipmentFormData({ ...equipmentFormData, id: e.target.value })}
                placeholder="고유 ID (예: 1, 2, 3...)"
                disabled={!!editingEquipment}
              />
            </div>
            <div className="space-y-2">
              <Label>이름 *</Label>
              <Input
                value={equipmentFormData.name}
                onChange={(e) => setEquipmentFormData({ ...equipmentFormData, name: e.target.value })}
                placeholder="보호 장구 이름"
              />
            </div>
            <div className="space-y-2">
              <Label>설명</Label>
              <Input
                value={equipmentFormData.description}
                onChange={(e) => setEquipmentFormData({ ...equipmentFormData, description: e.target.value })}
                placeholder="설명"
              />
            </div>
            <div className="space-y-2">
              <Label>카테고리</Label>
              <Select
                value={equipmentFormData.category}
                onValueChange={(v) => setEquipmentFormData({ ...equipmentFormData, category: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="eye">눈 보호</SelectItem>
                  <SelectItem value="face">얼굴 보호</SelectItem>
                  <SelectItem value="respiratory">호흡 보호</SelectItem>
                  <SelectItem value="hand">손 보호</SelectItem>
                  <SelectItem value="body">신체 보호</SelectItem>
                  <SelectItem value="foot">발 보호</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSaveEquipment}>저장</Button>
              <Button variant="outline" onClick={() => setShowEquipmentForm(false)}>
                취소
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
