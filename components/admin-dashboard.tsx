"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  RefreshCw,
  Plus,
  Edit,
  Trash2,
  QrCode,
  ArrowLeft,
  Search,
  AlertTriangle,
  Shield,
  FileSpreadsheet,
} from "lucide-react"
import Link from "next/link"
import type { MsdsItem, WarningSymbol, ProtectiveEquipment, ConfigOption } from "@/types/msds"
import { DEFAULT_WARNING_SYMBOLS, DEFAULT_PROTECTIVE_EQUIPMENT } from "@/types/msds"
import { QRPrintModal } from "./qr-print-modal"
import { ExcelUpload } from "./excel-upload"

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

const fallbackConfigOptions: ConfigOption[] = [
  { id: 1, type: "usage", value: "pure_reagent", label: "순수시약", is_active: true },
  { id: 2, type: "usage", value: "nox_reduction", label: "NOx저감", is_active: true },
  { id: 3, type: "reception", value: "lng_3_cpp", label: "LNG 3호기 CPP", is_active: true },
  { id: 4, type: "reception", value: "water_treatment", label: "수처리동", is_active: true },
  { id: 5, type: "laws", value: "chemical_safety", label: "화학물질안전법", is_active: true },
  { id: 6, type: "laws", value: "industrial_safety", label: "산업안전보건법", is_active: true },
]

export default function AdminDashboard() {
  const [msdsItems, setMsdsItems] = useState<MsdsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [editingItem, setEditingItem] = useState<MsdsItem | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  const [showQRModal, setShowQRModal] = useState(false)
  const [selectedQRItem, setSelectedQRItem] = useState<MsdsItem | null>(null)

  const [warningSymbols, setWarningSymbols] = useState<WarningSymbol[]>(DEFAULT_WARNING_SYMBOLS)
  const [protectiveEquipment, setProtectiveEquipment] = useState<ProtectiveEquipment[]>(DEFAULT_PROTECTIVE_EQUIPMENT)
  const [configOptions, setConfigOptions] = useState<ConfigOption[]>(fallbackConfigOptions)

  useEffect(() => {
    loadAllData()
  }, [])

  const loadAllData = async () => {
    await Promise.all([loadMsdsItems(), loadWarningSymbols(), loadProtectiveEquipment(), loadConfigOptions()])
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
        const json = await res.json()
        setMsdsItems(json)
      }
    } catch (err) {
      console.error("Error loading MSDS items:", err)
    } finally {
      setLoading(false)
    }
  }

  const loadWarningSymbols = async () => {
    try {
      const response = await fetch("/api/warning-symbols", { cache: "no-store" })
      if (response.ok) {
        const data = await response.json()
        setWarningSymbols(data)
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
        setProtectiveEquipment(data)
      }
    } catch (error) {
      console.error("Error loading protective equipment:", error)
    }
  }

  const loadConfigOptions = async () => {
    try {
      const response = await fetch("/api/config-options", { cache: "no-store" })
      if (response.ok) {
        const data = await response.json()
        setConfigOptions(data)
      }
    } catch (error) {
      console.error("Error loading config options:", error)
      setConfigOptions(fallbackConfigOptions)
    }
  }

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 5000)
  }

  const handleShowQR = (item: MsdsItem) => {
    setSelectedQRItem(item)
    setShowQRModal(true)
  }

  const handleEdit = (item: MsdsItem) => {
    setEditingItem(item)
    setFormData({
      id: item.id,
      name: item.name,
      pdfFileName: item.pdfFileName || "",
      pdfUrl: item.pdfUrl || "",
      hazards: item.hazards,
      usage: item.usage,
      reception: item.reception,
      laws: item.laws,
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

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "저장 실패")
      }

      await loadMsdsItems()
      setShowAddForm(false)
      setEditingItem(null)
      setFormData(initialFormData)
      showMessage("success", editingItem ? "MSDS 항목이 수정되었습니다." : "MSDS 항목이 추가되었습니다.")
    } catch (error) {
      console.error("저장 오류:", error)
      showMessage("error", `저장 실패: ${error instanceof Error ? error.message : "알 수 없는 오류"}`)
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

  const handleCancel = () => {
    setShowAddForm(false)
    setEditingItem(null)
    setFormData(initialFormData)
  }

  const filteredItems = msdsItems.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.usage.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const usageOptions = configOptions.filter((c) => c.type === "usage")
  const receptionOptions = configOptions.filter((c) => c.type === "reception")
  const lawsOptions = configOptions.filter((c) => c.type === "laws")

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground">데이터를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-background border-b sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">관리자 대시보드</h1>
                  <p className="text-xs text-muted-foreground">MSDS 안전관리시스템</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button onClick={handleRefresh} variant="outline" size="sm" disabled={refreshing}>
                <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
                새로고침
              </Button>
              <Button onClick={handleAdd} size="sm">
                <Plus className="w-4 h-4 mr-2" />새 MSDS 추가
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Message Banner */}
      {message && (
        <div
          className={`px-4 py-3 text-center text-sm font-medium ${message.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
        >
          {message.text}
        </div>
      )}

      <main className="container mx-auto px-4 py-6">
        <Tabs defaultValue="msds" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 max-w-lg">
            <TabsTrigger value="msds">MSDS 관리</TabsTrigger>
            <TabsTrigger value="excel">
              <FileSpreadsheet className="w-4 h-4 mr-1" />
              엑셀 업로드
            </TabsTrigger>
            <TabsTrigger value="symbols">경고 표지</TabsTrigger>
            <TabsTrigger value="equipment">보호 장구</TabsTrigger>
          </TabsList>

          {/* MSDS Management Tab */}
          <TabsContent value="msds" className="space-y-6">
            {/* Search */}
            <div className="flex gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="MSDS명 또는 용도로 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Badge variant="secondary" className="h-10 px-4 flex items-center">
                총 {filteredItems.length}개
              </Badge>
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
                      <Label htmlFor="name">MSDS명 *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="예: 염산 35%"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="usage">용도</Label>
                      <Select
                        value={formData.usage}
                        onValueChange={(value) => setFormData({ ...formData, usage: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="용도 선택" />
                        </SelectTrigger>
                        <SelectContent>
                          {usageOptions.map((option) => (
                            <SelectItem key={option.id} value={option.label}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="pdfFileName">PDF 파일명</Label>
                      <Input
                        id="pdfFileName"
                        value={formData.pdfFileName}
                        onChange={(e) => setFormData({ ...formData, pdfFileName: e.target.value })}
                        placeholder="예: HYDROCHLORIC_ACID.pdf"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pdfUrl">PDF URL</Label>
                      <Input
                        id="pdfUrl"
                        value={formData.pdfUrl}
                        onChange={(e) => setFormData({ ...formData, pdfUrl: e.target.value })}
                        placeholder="예: /pdfs/HYDROCHLORIC_ACID.pdf"
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

                  {/* Reception Locations */}
                  <div className="space-y-2">
                    <Label>장소</Label>
                    <div className="flex flex-wrap gap-2">
                      {receptionOptions.map((option) => (
                        <div key={option.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`reception-${option.id}`}
                            checked={formData.reception.includes(option.label)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setFormData({ ...formData, reception: [...formData.reception, option.label] })
                              } else {
                                setFormData({
                                  ...formData,
                                  reception: formData.reception.filter((r) => r !== option.label),
                                })
                              }
                            }}
                          />
                          <label htmlFor={`reception-${option.id}`} className="text-sm cursor-pointer">
                            {option.label}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Laws */}
                  <div className="space-y-2">
                    <Label>관련법</Label>
                    <div className="flex flex-wrap gap-2">
                      {lawsOptions.map((option) => (
                        <div key={option.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`law-${option.id}`}
                            checked={formData.laws.includes(option.label)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setFormData({ ...formData, laws: [...formData.laws, option.label] })
                              } else {
                                setFormData({
                                  ...formData,
                                  laws: formData.laws.filter((l) => l !== option.label),
                                })
                              }
                            }}
                          />
                          <label htmlFor={`law-${option.id}`} className="text-sm cursor-pointer">
                            {option.label}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button onClick={handleSave} disabled={submitting}>
                      {submitting ? "저장 중..." : editingItem ? "수정" : "추가"}
                    </Button>
                    <Button variant="outline" onClick={handleCancel}>
                      취소
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* MSDS List */}
            <div className="grid gap-4">
              {filteredItems.map((item) => (
                <Card key={item.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg">{item.name}</h3>
                          <Badge variant="outline">{item.usage}</Badge>
                        </div>

                        <div className="flex flex-wrap gap-2 text-sm text-muted-foreground mb-2">
                          {item.reception?.length > 0 && <span>장소: {item.reception.join(", ")}</span>}
                        </div>

                        <div className="flex flex-wrap gap-1">
                          {item.warningSymbols?.map((symbolId) => {
                            const symbol = warningSymbols.find((s) => s.id === symbolId)
                            return symbol ? (
                              <Badge key={symbolId} variant="secondary" className="text-xs bg-amber-100 text-amber-800">
                                {symbol.name}
                              </Badge>
                            ) : null
                          })}
                          {item.laws?.map((law, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {law}
                            </Badge>
                          ))}
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

              {filteredItems.length === 0 && (
                <div className="text-center py-12">
                  <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">MSDS 항목이 없습니다.</p>
                  <Button onClick={handleAdd} className="mt-4">
                    <Plus className="w-4 h-4 mr-2" />새 MSDS 추가
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Excel Upload Tab */}
          <TabsContent value="excel" className="space-y-6">
            <ExcelUpload onUploadComplete={loadMsdsItems} />
          </TabsContent>

          {/* Warning Symbols Tab */}
          <TabsContent value="symbols" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>경고 표지 목록</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {warningSymbols.map((symbol) => (
                    <div key={symbol.id} className="border rounded-lg p-4 text-center">
                      <div className="w-16 h-16 mx-auto mb-2 bg-amber-50 border-2 border-amber-400 rounded-lg flex items-center justify-center">
                        <img
                          src={symbol.imageUrl || "/placeholder.svg"}
                          alt={symbol.name}
                          className="w-12 h-12 object-contain"
                          onError={(e) => {
                            ;(e.target as HTMLImageElement).src = "/placeholder.svg"
                          }}
                        />
                      </div>
                      <h4 className="font-medium">{symbol.name}</h4>
                      <p className="text-xs text-muted-foreground mt-1">{symbol.description}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Protective Equipment Tab */}
          <TabsContent value="equipment" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>보호 장구 목록</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {protectiveEquipment.map((equipment) => (
                    <div key={equipment.id} className="border rounded-lg p-4 text-center">
                      <div className="w-16 h-16 mx-auto mb-2 bg-blue-50 border border-blue-300 rounded-full flex items-center justify-center">
                        <img
                          src={equipment.imageUrl || "/placeholder.svg"}
                          alt={equipment.name}
                          className="w-10 h-10 object-contain"
                          onError={(e) => {
                            ;(e.target as HTMLImageElement).src = "/placeholder.svg"
                          }}
                        />
                      </div>
                      <h4 className="font-medium">{equipment.name}</h4>
                      <p className="text-xs text-muted-foreground mt-1">{equipment.description}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* QR Code Modal */}
      <QRPrintModal isOpen={showQRModal} onClose={() => setShowQRModal(false)} msdsItem={selectedQRItem} />
    </div>
  )
}
