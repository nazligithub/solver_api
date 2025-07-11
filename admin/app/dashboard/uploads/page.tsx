"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Search, Trash2, Eye, Download, HardDrive, Calendar, User } from "lucide-react"
import { uploadsAPI } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import { tr } from "date-fns/locale"
import Image from "next/image"

interface ImageUpload {
  id: string
  user_id: string
  original_filename: string
  storage_url: string
  file_size: number
  mime_type: string
  uploaded_at: string
}

export default function ImageUploadsPage() {
  const [uploads, setUploads] = useState<ImageUpload[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [deleteUploadId, setDeleteUploadId] = useState<string | null>(null)
  const [selectedImage, setSelectedImage] = useState<ImageUpload | null>(null)
  const { toast } = useToast()
  
  useEffect(() => {
    fetchUploads()
  }, [])
  
  const fetchUploads = async () => {
    try {
      setLoading(true)
      const data = await uploadsAPI.getAll()
      setUploads(data.data.uploads)
    } catch (error) {
      toast({
        title: "Hata",
        description: "Görseller yüklenirken bir hata oluştu",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }
  
  const handleDelete = async () => {
    if (!deleteUploadId) return
    
    try {
      await uploadsAPI.delete(deleteUploadId)
      toast({
        title: "Başarılı",
        description: "Görsel silindi",
      })
      fetchUploads()
      setDeleteUploadId(null)
    } catch (error) {
      toast({
        title: "Hata",
        description: "Görsel silinirken bir hata oluştu",
        variant: "destructive",
      })
    }
  }
  
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }
  
  const getMimeTypeBadge = (mimeType: string) => {
    if (mimeType.includes('jpeg') || mimeType.includes('jpg')) {
      return <Badge className="bg-blue-100 text-blue-800">JPEG</Badge>
    } else if (mimeType.includes('png')) {
      return <Badge className="bg-green-100 text-green-800">PNG</Badge>
    } else if (mimeType.includes('webp')) {
      return <Badge className="bg-purple-100 text-purple-800">WebP</Badge>
    }
    return <Badge>{mimeType}</Badge>
  }
  
  const filteredUploads = uploads.filter(upload => {
    const matchesSearch = 
      upload.user_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      upload.original_filename.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })
  
  // Calculate stats
  const totalSize = uploads.reduce((sum, upload) => sum + upload.file_size, 0)
  const uniqueUsers = new Set(uploads.map(upload => upload.user_id)).size
  
  return (
    <div className="p-6">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Görsel Yüklemeleri</h2>
        <p className="text-gray-600 mt-2">Kullanıcılar tarafından yüklenen görselleri yönetin</p>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Toplam Görsel</p>
                <p className="text-2xl font-bold">{uploads.length}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Eye className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Toplam Boyut</p>
                <p className="text-2xl font-bold">{formatFileSize(totalSize)}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <HardDrive className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Benzersiz Kullanıcı</p>
                <p className="text-2xl font-bold">{uniqueUsers}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <User className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Yüklenen Görseller</CardTitle>
            <Badge variant="secondary">
              {filteredUploads.length} görsel
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Kullanıcı ID veya dosya adı ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          {loading ? (
            <div className="text-center py-8">Yükleniyor...</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Önizleme</TableHead>
                    <TableHead>Dosya Adı</TableHead>
                    <TableHead>Kullanıcı</TableHead>
                    <TableHead>Tür</TableHead>
                    <TableHead>Boyut</TableHead>
                    <TableHead>Yüklenme Tarihi</TableHead>
                    <TableHead>İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUploads.map((upload) => (
                    <TableRow key={upload.id}>
                      <TableCell>
                        <button
                          onClick={() => setSelectedImage(upload)}
                          className="relative w-16 h-16 overflow-hidden rounded border hover:opacity-80 transition-opacity"
                        >
                          <Image
                            src={upload.storage_url}
                            alt={upload.original_filename}
                            fill
                            className="object-cover"
                          />
                        </button>
                      </TableCell>
                      <TableCell className="font-medium">
                        {upload.original_filename}
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-xs">
                          {upload.user_id.slice(0, 12)}...
                        </span>
                      </TableCell>
                      <TableCell>{getMimeTypeBadge(upload.mime_type)}</TableCell>
                      <TableCell>{formatFileSize(upload.file_size)}</TableCell>
                      <TableCell>
                        {format(new Date(upload.uploaded_at), "dd MMM yyyy HH:mm", { locale: tr })}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedImage(upload)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <a
                            href={upload.storage_url}
                            download={upload.original_filename}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button variant="outline" size="sm">
                              <Download className="h-4 w-4" />
                            </Button>
                          </a>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDeleteUploadId(upload.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Image Preview Dialog */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{selectedImage?.original_filename}</DialogTitle>
          </DialogHeader>
          {selectedImage && (
            <div className="relative w-full h-[500px]">
              <Image
                src={selectedImage.storage_url}
                alt={selectedImage.original_filename}
                fill
                className="object-contain"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteUploadId} onOpenChange={() => setDeleteUploadId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Emin misiniz?</AlertDialogTitle>
            <AlertDialogDescription>
              Bu işlem geri alınamaz. Görsel storage'dan da silinecektir.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Sil</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}