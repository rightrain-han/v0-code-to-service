"use client"

import type React from "react"
import { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { X, Loader2, ImageIcon } from "lucide-react"

interface ImageUploadProps {
  currentImageUrl?: string
  onImageChange: (imageUrl: string) => void
  itemType: "ghs" | "prgear"
  className?: string
}

export function ImageUpload({ currentImageUrl, onImageChange, itemType, className = "" }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null)
  const [uploadedFilePath, setUploadedFilePath] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = async (file: File) => {
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
      formData.append("itemType", itemType)

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

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return
    await handleFileUpload(files[0])
  }

  // 드래그 앤 드롭 핸들러
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)

      const files = e.dataTransfer.files
      if (files && files.length > 0) {
        await handleFileUpload(files[0])
      }
    },
    [itemType],
  )

  const handleRemoveImage = async () => {
    if (uploadedFilePath) {
      try {
        await fetch(`/api/upload/image?filePath=${encodeURIComponent(uploadedFilePath)}`, {
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
      {/* 드래그 앤 드롭 영역 + 이미지 미리보기 */}
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-6 text-center transition-colors
          ${isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"}
          ${uploading ? "opacity-50 pointer-events-none" : "cursor-pointer"}
        `}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => !uploading && fileInputRef.current?.click()}
      >
        {previewUrl ? (
          <div className="relative inline-block">
            <div className="w-32 h-32 mx-auto border rounded-lg overflow-hidden bg-muted">
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
              onClick={(e) => {
                e.stopPropagation()
                handleRemoveImage()
              }}
            >
              <X className="h-3 w-3" />
            </Button>
            <p className="mt-2 text-sm text-muted-foreground">클릭하거나 새 이미지를 드롭하여 교체</p>
          </div>
        ) : (
          <div className="space-y-2">
            {uploading ? (
              <>
                <Loader2 className="h-10 w-10 mx-auto text-muted-foreground animate-spin" />
                <p className="text-sm text-muted-foreground">업로드 중...</p>
              </>
            ) : (
              <>
                <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                  <ImageIcon className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">이미지를 드래그하여 놓거나 클릭하여 선택</p>
                  <p className="text-xs text-muted-foreground mt-1">JPEG, PNG, GIF, WebP, SVG (최대 5MB)</p>
                </div>
              </>
            )}
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileSelect}
          disabled={uploading}
        />
      </div>

      {/* 또는 구분선 */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">또는 URL 직접 입력</span>
        </div>
      </div>

      {/* URL 입력 */}
      <div className="space-y-2">
        <Input
          placeholder="https://example.com/image.png"
          value={previewUrl || ""}
          onChange={(e) => handleUrlChange(e.target.value)}
          disabled={uploading}
        />
      </div>
    </div>
  )
}

export default ImageUpload
