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
  purpose?: string // A: 용도
  area?: string // B: 구역 (수령장소)
  created?: string // C: 생성일
  updated?: string // D: 수정일
  msdsno?: string // E: MSDS 번호
  name?: string // F: 물질명
  desc?: string // G: 설명(영문명)
  ghssign?: string // H: GHS 경고표지 (쉼표 구분된 숫자)
  prgear?: string // I: 보호장구
  ishl?: string // J: 산업안전보건법
  cmml?: string // K: 화학물질관리법
  file?: string // L: PDF 파일명
}

interface ParsedMsdsData {
  name: string
  pdfFileName: string
  usage: string
  reception: string[]
  laws: string[]
  warningSymbols: string[] // 숫자 ID를 그대로 유지
  hazards: string[] // 숫자 ID를 그대로 유지
  description: string
  msdsNo: string
}

interface UploadResult {
  success: boolean
  name: string
  error?: string
}

const GHS_DISPLAY_MAP: Record<string, string> = {
  "101": "폭발성",
  "105": "인화성",
  "109": "산화성",
  "108": "고압가스",
  "103": "부식성",
  "104": "급성독성",
  "102": "경고",
  "106": "발암성/호흡기",
  "107": "수생환경유해성",
}

const PRGEAR_DISPLAY_MAP: Record<string, string> = {
  "1": "방독마스크",
  "2": "방음보호구",
  "3": "방진마스크",
  "4": "보안경",
  "5": "보호복",
  "6": "송기마스크",
  "7": "안전장갑",
  "8": "용접용보안면",
}

export function ExcelUpload({ onUploadComplete }: { onUploadComplete?: () => void }) {
  const [parsedData, setParsedData] = useState<ParsedMsdsData[]>([])
  const [uploadResults, setUploadResults] = useState<UploadResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isParsing, setIsParsing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const parseGhsSigns = (ghsSign: string | undefined): string[] => {
    if (!ghsSign) return []
    return ghsSign
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s && !isNaN(Number(s)))
      .map((s) => `10${s}`) // 단순히 앞에 "10"을 붙임
  }

  const parsePrope = (prope: string | undefined): string[] => {
    if (!prope) return []
    return prope
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s && !isNaN(Number(s)))
  }

  const parseArea = (area: string | undefined): string[] => {
    if (!area) return []
    return area
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s)
  }

  const parseLaws = (ishl: string | undefined, cmul: string | undefined): string[] => {
    const laws: string[] = []
    if (ishl && ishl.trim()) laws.push("산업안전보건법")
    if (cmul && cmul.trim()) laws.push("화학물질관리법")
    return laws
  }

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
        name: row.name || "",
        pdfFileName: row.file || "",
        usage: row.purpose || "",
        reception: parseArea(row.area),
        laws: parseLaws(row.ishl, row.cmml),
        warningSymbols: parseGhsSigns(row.ghssign),
        hazards: parsePrope(row.prgear),
        description: row.desc || "",
        msdsNo: row.msdsno || "",
      }))

      const validData = parsed.filter((item) => item.name.trim() !== "")

      if (validData.length === 0) {
        setError("유효한 데이터가 없습니다. 'name' 컬럼을 확인해주세요.")
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
          body: JSON.stringify({
            name: item.name,
            pdfFileName: item.pdfFileName,
            usage: item.usage,
            reception: item.reception,
            laws: item.laws,
            warningSymbols: item.warningSymbols,
            hazards: item.hazards,
          }),
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
        purpose: "순수처리",
        area: "19,20,17",
        created: "2021-02-17",
        updated: "2021-04-13",
        msdsno: "M0001",
        name: "염산 35%",
        desc: "HYDROCHLORIC ACID 35%",
        ghssign: "1,2,3,4",
        prgear: "1,2,3,4",
        ishl: "ㅇ",
        cmml: "",
        file: "msds/염산35_HYDROCHLORIC_ACID.pdf",
      },
    ]

    const worksheet = XLSX.utils.json_to_sheet(templateData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "MSDS 데이터")

    worksheet["!cols"] = [
      { wch: 15 }, // purpose
      { wch: 12 }, // area
      { wch: 12 }, // created
      { wch: 12 }, // updated
      { wch: 10 }, // msdsno
      { wch: 30 }, // name
      { wch: 40 }, // desc
      { wch: 15 }, // ghssign
      { wch: 10 }, // prgear
      { wch: 8 }, // ishl
      { wch: 8 }, // cmml
      { wch: 50 }, // file
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

        {error && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

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
                    <TableHead className="sticky top-0 bg-background">용도</TableHead>
                    <TableHead className="sticky top-0 bg-background">구역</TableHead>
                    <TableHead className="sticky top-0 bg-background">경고표지</TableHead>
                    <TableHead className="sticky top-0 bg-background">보호장구</TableHead>
                    <TableHead className="sticky top-0 bg-background">PDF파일</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedData.slice(0, 50).map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.name}</TableCell>
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
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {item.warningSymbols.map((s, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {GHS_DISPLAY_MAP[s] || s}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {item.hazards.map((h, i) => (
                            <Badge key={i} variant="outline" className="text-xs bg-blue-50">
                              {PRGEAR_DISPLAY_MAP[h] || h}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs max-w-40 truncate">{item.pdfFileName || "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {parsedData.length > 50 && (
              <p className="text-sm text-muted-foreground text-center">
                ... 외 {parsedData.length - 50}개 항목 (미리보기는 50개까지만 표시)
              </p>
            )}
          </div>
        )}

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
                <ul className="text-sm space-y-1 max-h-40 overflow-auto">
                  {uploadResults
                    .filter((r) => !r.success)
                    .slice(0, 20)
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

        <div className="p-4 bg-muted rounded-lg">
          <p className="font-medium mb-2">엑셀 컬럼 가이드</p>
          <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
            <div>
              <strong>purpose</strong>: 용도 (순수처리, 폐수처리 등)
            </div>
            <div>
              <strong>area</strong>: 구역/수령장소 (쉼표 구분)
            </div>
            <div>
              <strong>created</strong>: 생성일
            </div>
            <div>
              <strong>updated</strong>: 수정일
            </div>
            <div>
              <strong>msdsno</strong>: MSDS 번호 (M0001)
            </div>
            <div>
              <strong>name</strong>: 물질명 (필수)
            </div>
            <div>
              <strong>desc</strong>: 설명/영문명
            </div>
            <div>
              <strong>ghssign</strong>: GHS 경고표지 번호 (쉼표 구분)
            </div>
            <div>
              <strong>prgear</strong>: 보호장구 번호
            </div>
            <div>
              <strong>ishl</strong>: 산업안전보건법 (ㅇ 표시)
            </div>
            <div>
              <strong>cmml</strong>: 화학물질관리법 (ㅇ 표시)
            </div>
            <div>
              <strong>file</strong>: PDF 파일명
            </div>
          </div>
          <div className="mt-3 pt-3 border-t">
            <p className="font-medium mb-1">GHS 경고표지 번호:</p>
            <p className="text-xs">
              1=폭발성, 2=인화성, 3=산화성, 4=고압가스, 5=부식성, 6=급성독성, 7=경고, 8=발암성/호흡기, 9=수생환경유해성
            </p>
            <p className="font-medium mb-1 mt-2">보호장구 번호:</p>
            <p className="text-xs">
              1=방독마스크, 2=방음보호구, 3=방진마스크, 4=보안경, 5=보호복, 6=송기마스크, 7=안전장갑, 8=용접용보안면
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
