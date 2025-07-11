"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
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
import { Badge } from "@/components/ui/badge"
import { Search, Filter, Calendar, Image as ImageIcon, Clock } from "lucide-react"
import { historyAPI } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import { tr } from "date-fns/locale"

interface ProcessingHistory {
  id: string
  user_id: string
  input_image_id: string
  output_image_url: string
  process_type: string
  style_id: number | null
  color_id: number | null
  custom_color: string | null
  processing_time_ms: number
  status: string
  error_message: string | null
  created_at: string
  completed_at: string | null
  hair_styles?: { style_name: string }
  hair_colors?: { color_name: string }
}

export default function ProcessingHistoryPage() {
  const [history, setHistory] = useState<ProcessingHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [processTypeFilter, setProcessTypeFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const { toast } = useToast()
  
  useEffect(() => {
    fetchHistory()
  }, [processTypeFilter, statusFilter])
  
  const fetchHistory = async () => {
    try {
      setLoading(true)
      const params: any = {}
      if (processTypeFilter !== "all") params.process_type = processTypeFilter
      if (statusFilter !== "all") params.status = statusFilter
      
      const data = await historyAPI.getAll(params)
      setHistory(data.data.history)
    } catch (error) {
      toast({
        title: "Hata",
        description: "İşlem geçmişi yüklenirken bir hata oluştu",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
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
  
  const getProcessTypeBadge = (type: string) => {
    switch (type) {
      case "style_change":
        return <Badge variant="outline">Stil Değişimi</Badge>
      case "color_change":
        return <Badge variant="outline">Renk Değişimi</Badge>
      default:
        return <Badge variant="outline">{type}</Badge>
    }
  }
  
  const filteredHistory = history.filter(item => {
    const matchesSearch = 
      String(item.user_id).toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.hair_styles?.style_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.hair_colors?.color_name || "").toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })
  
  return (
    <div className="p-6">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">İşlem Geçmişi</h2>
        <p className="text-gray-600 mt-2">Tüm saç değiştirme işlemlerini görüntüleyin</p>
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>İşlem Kayıtları</CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                Toplam: {filteredHistory.length} kayıt
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Kullanıcı ID, stil veya renk ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={processTypeFilter} onValueChange={setProcessTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="İşlem tipi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm İşlemler</SelectItem>
                <SelectItem value="style_change">Stil Değişimi</SelectItem>
                <SelectItem value="color_change">Renk Değişimi</SelectItem>
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
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Kullanıcı</TableHead>
                    <TableHead>İşlem Tipi</TableHead>
                    <TableHead>Stil/Renk</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead>İşlem Süresi</TableHead>
                    <TableHead>Tarih</TableHead>
                    <TableHead>Çıktı</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredHistory.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono text-xs">
                        {String(item.id).slice(0, 8)}...
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {String(item.user_id).slice(0, 12)}...
                      </TableCell>
                      <TableCell>{getProcessTypeBadge(item.process_type)}</TableCell>
                      <TableCell>
                        {item.process_type === "style_change" 
                          ? item.hair_styles?.style_name || "N/A"
                          : item.hair_colors?.color_name || item.custom_color || "N/A"
                        }
                      </TableCell>
                      <TableCell>{getStatusBadge(item.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {item.processing_time_ms ? `${item.processing_time_ms}ms` : "-"}
                        </div>
                      </TableCell>
                      <TableCell>
                        {format(new Date(item.created_at), "dd MMM yyyy HH:mm", { locale: tr })}
                      </TableCell>
                      <TableCell>
                        {item.output_image_url ? (
                          <a 
                            href={item.output_image_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-blue-600 hover:underline"
                          >
                            <ImageIcon className="h-3 w-3" />
                            Görüntüle
                          </a>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}