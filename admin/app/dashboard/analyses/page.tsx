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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { Badge } from "@/components/ui/badge"
import { Search, Eye, Trash2, User, Clock, Cpu } from "lucide-react"
import { analysesAPI } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import { tr } from "date-fns/locale"

interface FaceAnalysis {
  id: string
  user_id: string
  input_image_id: string
  face_shape: string
  analysis_result: any
  recommendations: any
  processing_time_ms: number
  status: string
  error_message: string | null
  created_at: string
  completed_at: string | null
}

export default function FaceAnalysesPage() {
  const [analyses, setAnalyses] = useState<FaceAnalysis[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [faceShapeFilter, setFaceShapeFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedAnalysis, setSelectedAnalysis] = useState<FaceAnalysis | null>(null)
  const [deleteAnalysisId, setDeleteAnalysisId] = useState<string | null>(null)
  const { toast } = useToast()
  
  useEffect(() => {
    fetchAnalyses()
  }, [faceShapeFilter, statusFilter])
  
  const fetchAnalyses = async () => {
    try {
      setLoading(true)
      const params: any = {}
      if (faceShapeFilter !== "all") params.face_shape = faceShapeFilter
      if (statusFilter !== "all") params.status = statusFilter
      
      const data = await analysesAPI.getAll(params)
      setAnalyses(data.data.analyses)
    } catch (error) {
      toast({
        title: "Hata",
        description: "Yüz analizleri yüklenirken bir hata oluştu",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }
  
  const handleDelete = async () => {
    if (!deleteAnalysisId) return
    
    try {
      await analysesAPI.delete(deleteAnalysisId)
      toast({
        title: "Başarılı",
        description: "Yüz analizi silindi",
      })
      fetchAnalyses()
      setDeleteAnalysisId(null)
    } catch (error) {
      toast({
        title: "Hata",
        description: "Yüz analizi silinirken bir hata oluştu",
        variant: "destructive",
      })
    }
  }
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800">Tamamlandı</Badge>
      case "processing":
        return <Badge className="bg-blue-100 text-blue-800">İşleniyor</Badge>
      case "failed":
        return <Badge className="bg-red-100 text-red-800">Başarısız</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }
  
  const getFaceShapeBadge = (shape: string) => {
    const shapeColors: Record<string, string> = {
      "Oval": "bg-purple-100 text-purple-800",
      "Yuvarlak": "bg-pink-100 text-pink-800",
      "Kare": "bg-indigo-100 text-indigo-800",
      "Kalp": "bg-red-100 text-red-800",
      "Üçgen": "bg-yellow-100 text-yellow-800",
      "Dikdörtgen": "bg-green-100 text-green-800",
      "Elmas": "bg-blue-100 text-blue-800"
    }
    return <Badge className={shapeColors[shape] || ""}>{shape}</Badge>
  }
  
  const filteredAnalyses = analyses.filter(item => {
    const matchesSearch = String(item.user_id).toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })
  
  return (
    <div className="p-6">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Yüz Analizleri</h2>
        <p className="text-gray-600 mt-2">AI ile yapılan yüz şekli analizlerini görüntüleyin</p>
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Analiz Kayıtları</CardTitle>
            <Badge variant="secondary">
              Toplam: {filteredAnalyses.length} analiz
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Kullanıcı ID ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={faceShapeFilter} onValueChange={setFaceShapeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Yüz şekli" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Şekiller</SelectItem>
                <SelectItem value="Oval">Oval</SelectItem>
                <SelectItem value="Yuvarlak">Yuvarlak</SelectItem>
                <SelectItem value="Kare">Kare</SelectItem>
                <SelectItem value="Kalp">Kalp</SelectItem>
                <SelectItem value="Üçgen">Üçgen</SelectItem>
                <SelectItem value="Dikdörtgen">Dikdörtgen</SelectItem>
                <SelectItem value="Elmas">Elmas</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Durum" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Durumlar</SelectItem>
                <SelectItem value="completed">Tamamlandı</SelectItem>
                <SelectItem value="processing">İşleniyor</SelectItem>
                <SelectItem value="failed">Başarısız</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {loading ? (
            <div className="text-center py-8">Yükleniyor...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Kullanıcı</TableHead>
                  <TableHead>Yüz Şekli</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead>İşlem Süresi</TableHead>
                  <TableHead>Tarih</TableHead>
                  <TableHead>İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAnalyses.map((analysis) => (
                  <TableRow key={analysis.id}>
                    <TableCell className="font-mono text-xs">
                      {String(analysis.id).slice(0, 8)}...
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        <span className="font-mono text-xs">
                          {String(analysis.user_id).slice(0, 12)}...
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{getFaceShapeBadge(analysis.face_shape)}</TableCell>
                    <TableCell>{getStatusBadge(analysis.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {analysis.processing_time_ms}ms
                      </div>
                    </TableCell>
                    <TableCell>
                      {format(new Date(analysis.created_at), "dd MMM yyyy HH:mm", { locale: tr })}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedAnalysis(analysis)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDeleteAnalysisId(analysis.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
      {/* View Details Dialog */}
      <Dialog open={!!selectedAnalysis} onOpenChange={() => setSelectedAnalysis(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Yüz Analizi Detayları</DialogTitle>
            <DialogDescription>
              AI tarafından yapılan yüz analizi sonuçları
            </DialogDescription>
          </DialogHeader>
          {selectedAnalysis && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">Kullanıcı ID</p>
                  <p className="font-mono text-sm">{String(selectedAnalysis.user_id)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Yüz Şekli</p>
                  <div className="mt-1">{getFaceShapeBadge(selectedAnalysis.face_shape)}</div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Durum</p>
                  <div className="mt-1">{getStatusBadge(selectedAnalysis.status)}</div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">İşlem Süresi</p>
                  <p className="flex items-center gap-1">
                    <Cpu className="h-4 w-4" />
                    {selectedAnalysis.processing_time_ms}ms
                  </p>
                </div>
              </div>
              
              {selectedAnalysis.analysis_result && (
                <div>
                  <h3 className="font-semibold mb-2">Analiz Sonucu</h3>
                  <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto text-xs">
                    {JSON.stringify(selectedAnalysis.analysis_result, null, 2)}
                  </pre>
                </div>
              )}
              
              {selectedAnalysis.recommendations && (
                <div>
                  <h3 className="font-semibold mb-2">Öneriler</h3>
                  <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto text-xs">
                    {JSON.stringify(selectedAnalysis.recommendations, null, 2)}
                  </pre>
                </div>
              )}
              
              {selectedAnalysis.error_message && (
                <div>
                  <h3 className="font-semibold mb-2 text-red-600">Hata Mesajı</h3>
                  <p className="bg-red-50 p-4 rounded-lg text-red-800">
                    {selectedAnalysis.error_message}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteAnalysisId} onOpenChange={() => setDeleteAnalysisId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Emin misiniz?</AlertDialogTitle>
            <AlertDialogDescription>
              Bu işlem geri alınamaz. Yüz analizi kalıcı olarak silinecektir.
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