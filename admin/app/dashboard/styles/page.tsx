"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
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
import { Plus, Pencil, Trash2, Search, RefreshCw, GripVertical } from "lucide-react"
import { stylesAPI } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import {
  useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

interface HairStyle {
  id: number
  style_name: string
  gender: string
  prompt_text: string
  description: string
  image_url: string
  is_premium: boolean
  created_at: string
  order?: number
}

export default function HairStylesPage() {
  const [styles, setStyles] = useState<HairStyle[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [genderFilter, setGenderFilter] = useState("all")
  const [selectedStyle, setSelectedStyle] = useState<HairStyle | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [deleteStyleId, setDeleteStyleId] = useState<number | null>(null)
  const [regenerateStyleId, setRegenerateStyleId] = useState<number | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isRegenerating, setIsRegenerating] = useState(false)
  const { toast } = useToast()
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )
  
  const [formData, setFormData] = useState({
    style_name: "",
    gender: "male",
    prompt_text: "",
    description: "",
    image_url: "",
    is_premium: false,
  })
  
  useEffect(() => {
    fetchStyles()
  }, [])
  
  const fetchStyles = async () => {
    try {
      setLoading(true)
      const data = await stylesAPI.getAll()
      setStyles(data.data.styles)
    } catch (error) {
      toast({
        title: "Hata",
        description: "Stiller yüklenirken bir hata oluştu",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }
  
  const handleEdit = (style: HairStyle) => {
    setSelectedStyle(style)
    setFormData({
      style_name: style.style_name,
      gender: style.gender,
      prompt_text: style.prompt_text,
      description: style.description,
      image_url: style.image_url,
      is_premium: style.is_premium,
    })
    setIsEditDialogOpen(true)
  }
  
  const handleCreate = () => {
    setFormData({
      style_name: "",
      gender: "male",
      prompt_text: "",
      description: "",
      image_url: "",
      is_premium: false,
    })
    setIsCreateDialogOpen(true)
  }
  
  const handleSubmit = async (isEdit: boolean) => {
    try {
      if (isEdit && selectedStyle) {
        await stylesAPI.update(selectedStyle.id.toString(), formData)
        toast({
          title: "Başarılı",
          description: "Stil güncellendi",
        })
      } else {
        await stylesAPI.create(formData)
        toast({
          title: "Başarılı",
          description: "Yeni stil oluşturuldu",
        })
      }
      
      fetchStyles()
      setIsEditDialogOpen(false)
      setIsCreateDialogOpen(false)
    } catch (error) {
      toast({
        title: "Hata",
        description: "İşlem sırasında bir hata oluştu",
        variant: "destructive",
      })
    }
  }
  
  const handleDelete = async () => {
    if (!deleteStyleId) return
    
    try {
      await stylesAPI.delete(deleteStyleId.toString())
      toast({
        title: "Başarılı",
        description: "Stil silindi",
      })
      fetchStyles()
      setDeleteStyleId(null)
    } catch (error) {
      toast({
        title: "Hata",
        description: "Stil silinirken bir hata oluştu",
        variant: "destructive",
      })
    }
  }
  
  const handleRegenerateImage = async () => {
    if (!regenerateStyleId || !selectedFile) return
    
    setIsRegenerating(true)
    
    try {
      // Create FormData for the API request
      const formData = new FormData()
      formData.append('image', selectedFile)
      formData.append('styleId', regenerateStyleId.toString())
      
      // Call the hair change-style API
      const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000'
      const response = await fetch(`${apiUrl}/api/hair/change-style`, {
        method: 'POST',
        body: formData,
      })
      
      if (!response.ok) {
        throw new Error('Failed to regenerate image')
      }
      
      const result = await response.json()
      
      // Update the style with the new image URL
      const style = styles.find(s => s.id === regenerateStyleId)
      if (style && result.data?.outputImage) {
        await stylesAPI.update(regenerateStyleId.toString(), {
          ...style,
          image_url: result.data.outputImage
        })
        
        toast({
          title: "Başarılı",
          description: "Görsel başarıyla yeniden oluşturuldu",
        })
        
        fetchStyles()
      }
      
      setRegenerateStyleId(null)
      setSelectedFile(null)
    } catch (error) {
      toast({
        title: "Hata",
        description: "Görsel oluşturulurken bir hata oluştu",
        variant: "destructive",
      })
    } finally {
      setIsRegenerating(false)
    }
  }
  
  
  const filteredStyles = styles.filter(style => {
    const matchesSearch = style.style_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         style.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesGender = genderFilter === "all" || style.gender === genderFilter
    return matchesSearch && matchesGender
  })
  
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    
    if (!over || active.id === over.id) {
      return
    }
    
    // Work with the full styles array, not just filtered
    const allStyles = [...styles]
    const activeItem = allStyles.find(item => item.id === active.id)
    const overItem = allStyles.find(item => item.id === over.id)
    
    if (!activeItem || !overItem) return
    
    // Get current positions in the filtered view
    const oldFilteredIndex = filteredStyles.findIndex((item) => item.id === active.id)
    const newFilteredIndex = filteredStyles.findIndex((item) => item.id === over.id)
    
    // Reorder the filtered items to get visual feedback
    const newFilteredItems = arrayMove(filteredStyles, oldFilteredIndex, newFilteredIndex)
    
    // Calculate new order values
    let newOrder: number
    if (newFilteredIndex === 0) {
      // Moving to the beginning
      const firstItem = filteredStyles[0]
      newOrder = (firstItem.order || 0) - 1
    } else if (newFilteredIndex === filteredStyles.length - 1) {
      // Moving to the end
      const lastItem = filteredStyles[filteredStyles.length - 1]
      newOrder = (lastItem.order || 0) + 1
    } else {
      // Moving between items
      const prevItem = newFilteredItems[newFilteredIndex - 1]
      const nextItem = newFilteredItems[newFilteredIndex + 1]
      newOrder = ((prevItem?.order || 0) + (nextItem?.order || 0)) / 2
    }
    
    // Update the item's order in the full array
    const updatedStyles = allStyles.map(style => 
      style.id === activeItem.id ? { ...style, order: newOrder } : style
    )
    
    // Sort by order
    updatedStyles.sort((a, b) => (a.order || 0) - (b.order || 0))
    
    // Normalize orders to prevent floating point accumulation
    const normalizedStyles = updatedStyles.map((item, index) => ({
      ...item,
      order: index
    }))
    
    setStyles(normalizedStyles)
    
    try {
      // Send all items with their new order values
      await stylesAPI.updateOrder(
        normalizedStyles.map((item) => ({
          id: item.id,
          order: item.order || 0
        }))
      )
      
      toast({
        title: "Başarılı",
        description: "Sıralama güncellendi",
      })
    } catch (error) {
      // Revert on error
      fetchStyles()
      toast({
        title: "Hata",
        description: "Sıralama güncellenirken bir hata oluştu",
        variant: "destructive",
      })
    }
  }
  
  // Sortable Row Component
  const SortableRow = ({ style }: { style: HairStyle }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: style.id })
    
    const rowStyle = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    }
    
    return (
      <TableRow
        ref={setNodeRef}
        style={rowStyle}
        className="cursor-pointer hover:bg-gray-50"
        onClick={() => handleEdit(style)}
      >
        <TableCell className="w-12" onClick={(e) => e.stopPropagation()}>
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-2"
          >
            <GripVertical className="h-4 w-4 text-gray-400" />
          </div>
        </TableCell>
        <TableCell className="font-mono text-sm">{style.id}</TableCell>
        <TableCell className="font-mono text-sm">{style.order || 0}</TableCell>
        <TableCell onClick={(e) => e.stopPropagation()}>
          {style.image_url ? (
            <img
              src={style.image_url}
              alt={style.style_name}
              className="w-16 h-16 object-cover rounded"
            />
          ) : (
            <div className="w-16 h-16 bg-gray-200 rounded" />
          )}
        </TableCell>
        <TableCell className="font-medium">{style.style_name}</TableCell>
        <TableCell>{style.gender === "male" ? "Erkek" : "Kadın"}</TableCell>
        <TableCell className="max-w-xs truncate">{style.description}</TableCell>
        <TableCell>{style.is_premium ? "Evet" : "Hayır"}</TableCell>
        <TableCell onClick={(e) => e.stopPropagation()}>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleEdit(style)}
              title="Düzenle"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRegenerateStyleId(style.id)}
              title="Görseli Yeniden Oluştur"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteStyleId(style.id)}
              title="Sil"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </TableCell>
      </TableRow>
    )
  }
  
  return (
    <div className="p-6">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Hair Styles</h2>
        <p className="text-gray-600 mt-2">Saç stillerini yönetin</p>
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Tüm Stiller</CardTitle>
            <Button onClick={handleCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Yeni Stil Ekle
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Stil ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={genderFilter} onValueChange={setGenderFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Cinsiyet filtrele" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tümü</SelectItem>
                <SelectItem value="male">Erkek</SelectItem>
                <SelectItem value="female">Kadın</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {loading ? (
            <div className="text-center py-8">Yükleniyor...</div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>ID</TableHead>
                    <TableHead>Order</TableHead>
                    <TableHead>Görsel</TableHead>
                    <TableHead>Stil Adı</TableHead>
                    <TableHead>Cinsiyet</TableHead>
                    <TableHead>Açıklama</TableHead>
                    <TableHead>Premium</TableHead>
                    <TableHead>İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <SortableContext
                    items={filteredStyles.map(s => s.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {filteredStyles.map((style) => (
                      <SortableRow key={style.id} style={style} />
                    ))}
                  </SortableContext>
                </TableBody>
              </Table>
            </DndContext>
          )}
        </CardContent>
      </Card>
      
      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Stili Düzenle</DialogTitle>
            <DialogDescription>
              Hair style bilgilerini güncelleyin ve AI ile görseli yenileyebilirsiniz
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="style_name">Stil Adı</Label>
              <Input
                id="style_name"
                value={formData.style_name}
                onChange={(e) => setFormData({ ...formData, style_name: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="gender">Cinsiyet</Label>
              <Select 
                value={formData.gender} 
                onValueChange={(value) => setFormData({ ...formData, gender: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Erkek</SelectItem>
                  <SelectItem value="female">Kadın</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Açıklama</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="prompt_text">Prompt Text</Label>
              <Textarea
                id="prompt_text"
                value={formData.prompt_text}
                onChange={(e) => setFormData({ ...formData, prompt_text: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="image_url">Görsel URL</Label>
              <Input
                id="image_url"
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              />
              {formData.image_url && (
                <img
                  src={formData.image_url}
                  alt="Mevcut görsel"
                  className="w-24 h-24 object-cover rounded mt-2"
                />
              )}
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="is_premium"
                checked={formData.is_premium}
                onCheckedChange={(checked) => setFormData({ ...formData, is_premium: checked })}
              />
              <Label htmlFor="is_premium">Premium</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              İptal
            </Button>
            <Button onClick={() => handleSubmit(true)}>Güncelle</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Yeni Stil Ekle</DialogTitle>
            <DialogDescription>
              Yeni bir hair style oluşturun
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="new_style_name">Stil Adı</Label>
              <Input
                id="new_style_name"
                value={formData.style_name}
                onChange={(e) => setFormData({ ...formData, style_name: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new_gender">Cinsiyet</Label>
              <Select 
                value={formData.gender} 
                onValueChange={(value) => setFormData({ ...formData, gender: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Erkek</SelectItem>
                  <SelectItem value="female">Kadın</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new_description">Açıklama</Label>
              <Textarea
                id="new_description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new_prompt_text">Prompt Text</Label>
              <Textarea
                id="new_prompt_text"
                value={formData.prompt_text}
                onChange={(e) => setFormData({ ...formData, prompt_text: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new_image_url">Görsel URL</Label>
              <Input
                id="new_image_url"
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="new_is_premium"
                checked={formData.is_premium}
                onCheckedChange={(checked) => setFormData({ ...formData, is_premium: checked })}
              />
              <Label htmlFor="new_is_premium">Premium</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              İptal
            </Button>
            <Button onClick={() => handleSubmit(false)}>Oluştur</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteStyleId} onOpenChange={() => setDeleteStyleId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Emin misiniz?</AlertDialogTitle>
            <AlertDialogDescription>
              Bu işlem geri alınamaz. Stil kalıcı olarak silinecektir.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Sil</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Regenerate Image Dialog */}
      <Dialog open={!!regenerateStyleId} onOpenChange={() => {
        setRegenerateStyleId(null)
        setSelectedFile(null)
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Görseli Yeniden Oluştur</DialogTitle>
            <DialogDescription>
              {styles.find(s => s.id === regenerateStyleId)?.style_name} stili için yeni bir görsel oluşturmak üzere referans fotoğraf yükleyin
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="regenerate_image">Referans Fotoğraf</Label>
              <Input
                id="regenerate_image"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    setSelectedFile(file)
                  }
                }}
              />
              {selectedFile && (
                <div className="mt-2">
                  <p className="text-sm text-gray-600 mb-2">
                    Seçilen dosya: {selectedFile.name}
                  </p>
                  <img
                    src={URL.createObjectURL(selectedFile)}
                    alt="Seçilen görsel"
                    className="w-full max-h-48 object-contain bg-gray-100 rounded"
                  />
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setRegenerateStyleId(null)
                setSelectedFile(null)
              }}
              disabled={isRegenerating}
            >
              İptal
            </Button>
            <Button 
              onClick={handleRegenerateImage}
              disabled={!selectedFile || isRegenerating}
            >
              {isRegenerating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Oluşturuluyor...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Görseli Oluştur
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}