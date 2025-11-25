"use client"

import type React from "react"
import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Upload, X, Loader2 } from "lucide-react"

interface ImageUploadProps {
  currentImageUrl?: string
  onImageChange: (imageUrl: string) => void
  category: "symbols" | "protective"
  className?: string
}

export function ImageUpload({ currentImageUrl, onImageChange, category, className = "" }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null)
  const [uploadedFilePath, setUploadedFilePath] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    const file = files[0]

    // 파일 유효성 검사
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp", "image/svg+xml"]
    if (!allowedTypes.includes(file.type)) {
      alert("이미지 파일만 업로드 가능합니다 (JPEG, PNG, GIF, WebP, SVG)")
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("파일 크기는 5MB 이하여야 합니다")
      return
    }

    setUploading(true)

    try {
      // 미리보기 생성
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string)
      }
      reader.readAsDataURL(file)

      // 파일 업로드
      const formData = new FormData()
      formData.append("file", file)
      formData.append("category", category)

      const response = await fetch("/api/upload/image", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Upload failed")
      }

      const result = await response.json()

      // 업로드된 이미지 URL을 부모 컴포넌트에 전달
      onImageChange(result.fileUrl)
      setUploadedFilePath(result.filePath)
    } catch (error) {
      console.error("Upload error:", error)
      alert(`이미지 업로드 실패: ${error instanceof Error ? error.message : "알 수 없는 오류"}`)
      setPreviewUrl(currentImageUrl || null)
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleRemoveImage = async () => {
    if (uploadedFilePath) {
      try {
        await fetch(`/api/upload/image/delete?filePath=${encodeURIComponent(uploadedFilePath)}`, {
          method: "DELETE",
        })
      } catch (error) {
        console.warn("Error deleting image from server:", error)
      }
    }

    setPreviewUrl(null)
    setUploadedFilePath(null)
    onImageChange("")

    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleUrlChange = (url: string) => {
    setPreviewUrl(url)
    onImageChange(url)
    setUploadedFilePath(null)
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 이미지 미리보기 */}
      {previewUrl && (
        <div className="relative inline-block">
          <div className="w-24 h-24 border rounded-lg overflow-hidden bg-muted">
            <img
              src={previewUrl || "/placeholder.svg"}
              alt="Preview"
              className="w-full h-full object-contain"
              onError={(e) => {
                const img = e.currentTarget as HTMLImageElement
                img.src = "/abstract-colorful-swirls.png"
              }}
            />
          </div>
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
            onClick={handleRemoveImage}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* 파일 업로드 */}
      <div className="space-y-2">
        <span className="text-sm text-muted-foreground">이미지 파일 업로드</span>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex-1"
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                업로드 중...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                파일 선택
              </>
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">지원 형식: JPEG, PNG, GIF, WebP, SVG (최대 5MB)</p>
      </div>

      {/* 또는 구분선 */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">또는</span>
        </div>
      </div>

      {/* URL 입력 */}
      <div className="space-y-2">
        <span className="text-sm text-muted-foreground">이미지 URL 입력</span>
        <Input
          placeholder="https://example.com/image.png"
          value={previewUrl || ""}
          onChange={(e) => handleUrlChange(e.target.value)}
          disabled={uploading}
        />
        <p className="text-xs text-muted-foreground">외부 이미지 URL을 직접 입력할 수 있습니다</p>
      </div>
    </div>
  )
}
