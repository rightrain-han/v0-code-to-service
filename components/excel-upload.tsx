"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Upload, FileSpreadsheet, CheckCircle, XCircle, Download, Loader2 } from "lucide-react"
import * as XLSX from "xlsx"

interface ExcelRow {
  물질명: string
  PDF파일명?: string
  유해성?: string
  용도?: string
  수령장소?: string
  법규?: string
  경고표지?: string
}

interface ParsedMsdsData {
  name: string
  pdfFileName: string
  hazards: string[]
  usage: string
  reception: string[]
  laws: string[]
  warningSymbols: string[]
}

interface UploadResult {
  success: boolean
  name: string
  error?: string
}

export function ExcelUpload({ onUploadComplete }: { onUploadComplete?: () => void }) {
  const [parsedData, setParsedData] = useState<ParsedMsdsData[]>([])
  const [uploadResults, setUploadResults] = useState<UploadResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isParsing, setIsParsing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const parseExcelFile = async (file: File) => {
    setIsParsing(true)
    setError(null)
    setParsedData([])
    setUploadResults([])

    try {
      const buffer = await file.arrayBuffer()
      const workbook = XLSX.read(buffer, { type: "array" })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      const jsonData = XLSX.utils.sheet_to_json<ExcelRow>(worksheet)

      if (jsonData.length === 0) {
        setError("엑셀 파일에 데이터가 없습니다.")
        setIsParsing(false)
        return
      }

      const parsed: ParsedMsdsData[] = jsonData.map((row) => ({
        name: row.물질명 || "",
        pdfFileName: row.PDF파일명 || "",
        hazards: row.유해성 ? row.유해성.split(",").map((s) => s.trim()) : [],
        usage: row.용도 || "",
        reception: row.수령장소 ? row.수령장소.split(",").map((s) => s.trim()) : [],
        laws: row.법규 ? row.법규.split(",").map((s) => s.trim()) : [],
        warningSymbols: row.경고표지 ? row.경고표지.split(",").map((s) => s.trim()) : [],
      }))

      // Filter out rows without a name
      const validData = parsed.filter((item) => item.name.trim() !== "")

      if (validData.length === 0) {
        setError("유효한 데이터가 없습니다. '물질명' 컬럼을 확인해주세요.")
        setIsParsing(false)
        return
      }

      setParsedData(validData)
    } catch (err) {
      setError("엑셀 파일을 읽는 중 오류가 발생했습니다: " + (err as Error).message)
    } finally {
      setIsParsing(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      parseExcelFile(file)
    }
  }

  const handleUploadToDb = async () => {
    if (parsedData.length === 0) return

    setIsLoading(true)
    setUploadResults([])
    const results: UploadResult[] = []

    for (const item of parsedData) {
      try {
        const response = await fetch("/api/msds", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(item),
        })

        if (response.ok) {
          results.push({ success: true, name: item.name })
        } else {
          const errorData = await response.json()
          results.push({ success: false, name: item.name, error: errorData.error || "업로드 실패" })
        }
      } catch (err) {
        results.push({ success: false, name: item.name, error: (err as Error).message })
      }
    }

    setUploadResults(results)
    setIsLoading(false)

    const successCount = results.filter((r) => r.success).length
    if (successCount > 0 && onUploadComplete) {
      onUploadComplete()
    }
  }

  const downloadTemplate = () => {
    const templateData = [
      {
        물질명: "예시 화학물질",
        PDF파일명: "example.pdf",
        유해성: "인화성,독성",
        용도: "순수시약",
        수령장소: "LNG 3호기 CPP,수처리동",
        법규: "화학물질안전법,산업안전보건법",
        경고표지: "flammable,toxic",
      },
    ]

    const worksheet = XLSX.utils.json_to_sheet(templateData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "MSDS 데이터")

    // Set column widths
    worksheet["!cols"] = [
      { wch: 20 }, // 물질명
      { wch: 15 }, // PDF파일명
      { wch: 15 }, // 유해성
      { wch: 15 }, // 용도
      { wch: 25 }, // 수령장소
      { wch: 25 }, // 법규
      { wch: 20 }, // 경고표지
    ]

    XLSX.writeFile(workbook, "msds_template.xlsx")
  }

  const successCount = uploadResults.filter((r) => r.success).length
  const failCount = uploadResults.filter((r) => !r.success).length

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5" />
          엑셀 파일로 MSDS 일괄 등록
        </CardTitle>
        <CardDescription>엑셀 파일을 업로드하여 여러 MSDS 데이터를 한 번에 등록할 수 있습니다.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Template Download */}
        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
          <div>
            <p className="font-medium">템플릿 다운로드</p>
            <p className="text-sm text-muted-foreground">먼저 템플릿 파일을 다운로드하여 형식을 확인하세요.</p>
          </div>
          <Button variant="outline" onClick={downloadTemplate}>
            <Download className="h-4 w-4 mr-2" />
            템플릿 다운로드
          </Button>
        </div>

        {/* File Upload */}
        <div className="border-2 border-dashed rounded-lg p-8 text-center">
          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".xlsx,.xls" className="hidden" />
          <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
          <p className="text-lg font-medium mb-2">엑셀 파일을 선택하세요</p>
          <p className="text-sm text-muted-foreground mb-4">.xlsx 또는 .xls 파일만 지원됩니다.</p>
          <Button onClick={() => fileInputRef.current?.click()} disabled={isParsing}>
            {isParsing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                파일 분석 중...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                파일 선택
              </>
            )}
          </Button>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Parsed Data Preview */}
        {parsedData.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">미리보기 ({parsedData.length}개 항목)</h3>
              <Button onClick={handleUploadToDb} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    업로드 중...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    DB에 일괄 등록
                  </>
                )}
              </Button>
            </div>

            <div className="border rounded-lg overflow-auto max-h-80">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="sticky top-0 bg-background">물질명</TableHead>
                    <TableHead className="sticky top-0 bg-background">PDF파일명</TableHead>
                    <TableHead className="sticky top-0 bg-background">유해성</TableHead>
                    <TableHead className="sticky top-0 bg-background">용도</TableHead>
                    <TableHead className="sticky top-0 bg-background">수령장소</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedData.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{item.pdfFileName || "-"}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {item.hazards.map((h, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {h}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>{item.usage || "-"}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {item.reception.map((r, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {r}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* Upload Results */}
        {uploadResults.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <h3 className="font-medium">업로드 결과</h3>
              <Badge variant="default" className="bg-green-500">
                <CheckCircle className="h-3 w-3 mr-1" />
                성공: {successCount}
              </Badge>
              {failCount > 0 && (
                <Badge variant="destructive">
                  <XCircle className="h-3 w-3 mr-1" />
                  실패: {failCount}
                </Badge>
              )}
            </div>

            {failCount > 0 && (
              <div className="border rounded-lg p-4 bg-destructive/10">
                <p className="font-medium text-destructive mb-2">실패한 항목:</p>
                <ul className="text-sm space-y-1">
                  {uploadResults
                    .filter((r) => !r.success)
                    .map((r, i) => (
                      <li key={i}>
                        <span className="font-medium">{r.name}</span>: {r.error}
                      </li>
                    ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Column Guide */}
        <div className="p-4 bg-muted rounded-lg">
          <p className="font-medium mb-2">엑셀 컬럼 가이드</p>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>
              <strong>물질명</strong> (필수): MSDS 물질 이름
            </li>
            <li>
              <strong>PDF파일명</strong>: PDF 파일 이름
            </li>
            <li>
              <strong>유해성</strong>: 쉼표로 구분 (예: 인화성,독성)
            </li>
            <li>
              <strong>용도</strong>: 사용 용도
            </li>
            <li>
              <strong>수령장소</strong>: 쉼표로 구분 (예: LNG 3호기 CPP,수처리동)
            </li>
            <li>
              <strong>법규</strong>: 쉼표로 구분 (예: 화학물질안전법,산업안전보건법)
            </li>
            <li>
              <strong>경고표지</strong>: 쉼표로 구분된 ID (예: flammable,toxic,corrosive)
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
