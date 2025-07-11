"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, Scissors, Palette, Activity, TrendingUp, Clock, Image as ImageIcon } from "lucide-react"
import { dashboardAPI } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import { tr } from "date-fns/locale"

interface DashboardStats {
  totalStyles: number
  totalColors: number
  totalProcessing: number
  activeUsers: number
  recentProcessing: any[]
  popularStyles: any[]
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  
  useEffect(() => {
    fetchDashboardStats()
  }, [])
  
  const fetchDashboardStats = async () => {
    try {
      setLoading(true)
      const data = await dashboardAPI.getStats()
      setStats(data.data.stats)
    } catch (error) {
      toast({
        title: "Hata",
        description: "Dashboard verileri yüklenirken bir hata oluştu",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }
  
  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">Dashboard yükleniyor...</p>
          </div>
        </div>
      </div>
    )
  }
  
  const statCards = [
    {
      title: "Toplam İşlem",
      value: stats?.totalProcessing || 0,
      icon: Activity,
      change: "+12%",
      changeType: "positive" as const,
      color: "bg-blue-100 text-blue-600"
    },
    {
      title: "Hair Styles",
      value: stats?.totalStyles || 0,
      icon: Scissors,
      change: "+2",
      changeType: "positive" as const,
      color: "bg-green-100 text-green-600"
    },
    {
      title: "Hair Colors",
      value: stats?.totalColors || 0,
      icon: Palette,
      change: "+3",
      changeType: "positive" as const,
      color: "bg-purple-100 text-purple-600"
    },
    {
      title: "Aktif Kullanıcı",
      value: stats?.activeUsers || 0,
      icon: Users,
      change: "+18%",
      changeType: "positive" as const,
      color: "bg-orange-100 text-orange-600"
    },
  ]
  
  return (
    <div className="p-6">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
        <p className="text-gray-600 mt-2">Hair Style platformunuzun genel görünümü</p>
      </div>
      
      <div className="grid gap-6 mb-8 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-full ${stat.color}`}>
                <stat.icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value.toLocaleString('tr-TR')}</div>
              <p className={`text-xs flex items-center gap-1 ${
                stat.changeType === "positive" ? "text-green-600" : "text-red-600"
              }`}>
                <TrendingUp className="h-3 w-3" />
                {stat.change} geçen aya göre
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Son İşlemler</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.recentProcessing?.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">
                      {item.process_type === "style_change" ? "Saç Stili" : "Saç Rengi"} Değişimi
                    </p>
                    <p className="text-sm text-gray-600">
                      {item.process_type === "style_change" 
                        ? item.hair_styles?.style_name 
                        : item.hair_colors?.color_name || item.custom_color}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      User: {item.user_id.slice(0, 8)}...
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant={item.status === "completed" ? "default" : "secondary"}>
                      {item.status === "completed" ? "Tamamlandı" : "İşleniyor"}
                    </Badge>
                    <p className="text-xs text-gray-500 mt-1">
                      <Clock className="inline h-3 w-3 mr-1" />
                      {format(new Date(item.created_at), "HH:mm", { locale: tr })}
                    </p>
                  </div>
                </div>
              ))}
              
              {(!stats?.recentProcessing || stats.recentProcessing.length === 0) && (
                <p className="text-center text-gray-500 py-8">Henüz işlem yok</p>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Popüler Stiller</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.popularStyles?.map((style, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                      <ImageIcon className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-medium">{style.name}</p>
                      <p className="text-sm text-gray-600">
                        {style.gender === "male" ? "Erkek" : "Kadın"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-medium">{style.count} kullanım</span>
                    <div className="w-24 bg-gray-200 rounded-full h-2 mt-1">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ 
                          width: `${Math.min((style.count / (stats.popularStyles[0]?.count || 1)) * 100, 100)}%` 
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
              
              {(!stats?.popularStyles || stats.popularStyles.length === 0) && (
                <p className="text-center text-gray-500 py-8">Henüz veri yok</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}