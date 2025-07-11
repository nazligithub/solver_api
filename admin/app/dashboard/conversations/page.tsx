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
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Search, MessageSquare, Trash2, User, Bot, Calendar, Eye } from "lucide-react"
import { conversationsAPI } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import { tr } from "date-fns/locale"

interface Conversation {
  id: string
  user_id: string
  title: string
  last_message: string
  is_active: boolean
  created_at: string
  updated_at: string
}

interface Message {
  id: string
  conversation_id: string
  role: string
  content: string
  created_at: string
}

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [deleteConversationId, setDeleteConversationId] = useState<string | null>(null)
  const { toast } = useToast()
  
  useEffect(() => {
    fetchConversations()
  }, [])
  
  const fetchConversations = async () => {
    try {
      setLoading(true)
      const data = await conversationsAPI.getAll()
      setConversations(data.data.conversations)
    } catch (error) {
      toast({
        title: "Hata",
        description: "Konuşmalar yüklenirken bir hata oluştu",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }
  
  const fetchConversationDetails = async (conversation: Conversation) => {
    try {
      setLoadingMessages(true)
      setSelectedConversation(conversation)
      const data = await conversationsAPI.getOne(conversation.id)
      setMessages(data.data.messages)
    } catch (error) {
      toast({
        title: "Hata",
        description: "Mesajlar yüklenirken bir hata oluştu",
        variant: "destructive",
      })
    } finally {
      setLoadingMessages(false)
    }
  }
  
  const handleDelete = async () => {
    if (!deleteConversationId) return
    
    try {
      await conversationsAPI.delete(deleteConversationId)
      toast({
        title: "Başarılı",
        description: "Konuşma silindi",
      })
      fetchConversations()
      setDeleteConversationId(null)
      if (selectedConversation?.id === deleteConversationId) {
        setSelectedConversation(null)
        setMessages([])
      }
    } catch (error) {
      toast({
        title: "Hata",
        description: "Konuşma silinirken bir hata oluştu",
        variant: "destructive",
      })
    }
  }
  
  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = 
      String(conv.user_id).toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.last_message.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })
  
  return (
    <div className="p-6">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Sohbetler</h2>
        <p className="text-gray-600 mt-2">Kullanıcıların Hair GPT sohbetlerini görüntüleyin</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Conversations List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Konuşmalar</CardTitle>
              <Badge variant="secondary">
                Toplam: {filteredConversations.length} sohbet
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Kullanıcı, başlık veya mesaj ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            {loading ? (
              <div className="text-center py-8">Yükleniyor...</div>
            ) : (
              <ScrollArea className="h-[600px]">
                <div className="space-y-2">
                  {filteredConversations.map((conversation) => (
                    <div
                      key={conversation.id}
                      className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                        selectedConversation?.id === conversation.id
                          ? "bg-blue-50 border-blue-300"
                          : "hover:bg-gray-50"
                      }`}
                      onClick={() => fetchConversationDetails(conversation)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium">{conversation.title}</h4>
                            <Badge variant={conversation.is_active ? "default" : "secondary"} className="text-xs">
                              {conversation.is_active ? "Aktif" : "Pasif"}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {conversation.last_message}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {String(conversation.user_id).slice(0, 8)}...
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(conversation.updated_at), "dd MMM HH:mm", { locale: tr })}
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            setDeleteConversationId(conversation.id)
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
        
        {/* Messages View */}
        <Card>
          <CardHeader>
            <CardTitle>Mesajlar</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedConversation ? (
              loadingMessages ? (
                <div className="text-center py-8">Mesajlar yükleniyor...</div>
              ) : (
                <ScrollArea className="h-[600px]">
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div key={message.id} className="flex gap-3">
                        <div className={`flex-shrink-0 ${
                          message.role === "user" ? "bg-blue-500" : "bg-gray-500"
                        } rounded-full p-2`}>
                          {message.role === "user" ? (
                            <User className="h-4 w-4 text-white" />
                          ) : (
                            <Bot className="h-4 w-4 text-white" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">
                              {message.role === "user" ? "Kullanıcı" : "Hair GPT"}
                            </span>
                            <span className="text-xs text-gray-500">
                              {format(new Date(message.created_at), "HH:mm", { locale: tr })}
                            </span>
                          </div>
                          <div className="bg-gray-100 rounded-lg p-3">
                            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )
            ) : (
              <div className="text-center py-16 text-gray-500">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Mesajları görüntülemek için bir konuşma seçin</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConversationId} onOpenChange={() => setDeleteConversationId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Emin misiniz?</AlertDialogTitle>
            <AlertDialogDescription>
              Bu işlem geri alınamaz. Konuşma ve tüm mesajlar kalıcı olarak silinecektir.
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