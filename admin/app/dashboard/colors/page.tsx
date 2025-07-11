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
import { Plus, Pencil, Trash2, Search, GripVertical } from "lucide-react"
import { colorsAPI } from "@/lib/api"
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

interface HairColor {
  id: number
  color_name: string
  hex_code: string | null
  gender: string
  prompt_text: string
  image_url: string
  is_premium: boolean
  created_at: string
  order?: number
}

export default function HairColorsPage() {
  const [colors, setColors] = useState<HairColor[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [genderFilter, setGenderFilter] = useState("all")
  const [selectedColor, setSelectedColor] = useState<HairColor | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [deleteColorId, setDeleteColorId] = useState<number | null>(null)
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
    color_name: "",
    hex_code: "",
    gender: "male",
    prompt_text: "",
    image_url: "",
    is_premium: false,
  })
  
  useEffect(() => {
    fetchColors()
  }, [])
  
  const fetchColors = async () => {
    try {
      setLoading(true)
      const data = await colorsAPI.getAll()
      setColors(data.data.colors)
    } catch (error) {
      toast({
        title: "Hata",
        description: "Renkler yüklenirken bir hata oluştu",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }
  
  const handleEdit = (color: HairColor) => {
    setSelectedColor(color)
    setFormData({
      color_name: color.color_name,
      hex_code: color.hex_code || "",
      gender: color.gender,
      prompt_text: color.prompt_text,
      image_url: color.image_url,
      is_premium: color.is_premium,
    })
    setIsEditDialogOpen(true)
  }
  
  const handleCreate = () => {
    setFormData({
      color_name: "",
      hex_code: "",
      gender: "male",
      prompt_text: "",
      image_url: "",
      is_premium: false,
    })
    setIsCreateDialogOpen(true)
  }
  
  const handleSubmit = async (isEdit: boolean) => {
    try {
      const submitData = {
        ...formData,
        hex_code: formData.hex_code || null,
      }
      
      if (isEdit && selectedColor) {
        await colorsAPI.update(selectedColor.id.toString(), submitData)
        toast({
          title: "Başarılı",
          description: "Renk güncellendi",
        })
      } else {
        await colorsAPI.create(submitData)
        toast({
          title: "Başarılı",
          description: "Yeni renk oluşturuldu",
        })
      }
      
      fetchColors()
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
    if (!deleteColorId) return
    
    try {
      await colorsAPI.delete(deleteColorId.toString())
      toast({
        title: "Başarılı",
        description: "Renk silindi",
      })
      fetchColors()
      setDeleteColorId(null)
    } catch (error) {
      toast({
        title: "Hata",
        description: "Renk silinirken bir hata oluştu",
        variant: "destructive",
      })
    }
  }
  
  const filteredColors = colors.filter(color => {
    const matchesSearch = color.color_name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesGender = genderFilter === "all" || color.gender === genderFilter
    return matchesSearch && matchesGender
  })
  
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    
    if (!over || active.id === over.id) {
      return
    }
    
    // Work with the full colors array, not just filtered
    const allColors = [...colors]
    const activeItem = allColors.find(item => item.id === active.id)
    const overItem = allColors.find(item => item.id === over.id)
    
    if (!activeItem || !overItem) return
    
    // Get current positions in the filtered view
    const oldFilteredIndex = filteredColors.findIndex((item) => item.id === active.id)
    const newFilteredIndex = filteredColors.findIndex((item) => item.id === over.id)
    
    // Reorder the filtered items to get visual feedback
    const newFilteredItems = arrayMove(filteredColors, oldFilteredIndex, newFilteredIndex)
    
    // Calculate new order values
    let newOrder: number
    if (newFilteredIndex === 0) {
      // Moving to the beginning
      const firstItem = filteredColors[0]
      newOrder = (firstItem.order || 0) - 1
    } else if (newFilteredIndex === filteredColors.length - 1) {
      // Moving to the end
      const lastItem = filteredColors[filteredColors.length - 1]
      newOrder = (lastItem.order || 0) + 1
    } else {
      // Moving between items
      const prevItem = newFilteredItems[newFilteredIndex - 1]
      const nextItem = newFilteredItems[newFilteredIndex + 1]
      newOrder = ((prevItem?.order || 0) + (nextItem?.order || 0)) / 2
    }
    
    // Update the item's order in the full array
    const updatedColors = allColors.map(color => 
      color.id === activeItem.id ? { ...color, order: newOrder } : color
    )
    
    // Sort by order
    updatedColors.sort((a, b) => (a.order || 0) - (b.order || 0))
    
    // Normalize orders to prevent floating point accumulation
    const normalizedColors = updatedColors.map((item, index) => ({
      ...item,
      order: index
    }))
    
    setColors(normalizedColors)
    
    try {
      // Send all items with their new order values
      await colorsAPI.updateOrder(
        normalizedColors.map((item) => ({
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
      fetchColors()
      toast({
        title: "Hata",
        description: "Sıralama güncellenirken bir hata oluştu",
        variant: "destructive",
      })
    }
  }
  
  // Sortable Row Component
  const SortableRow = ({ color }: { color: HairColor }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: color.id })
    
    const rowStyle = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    }
    
    return (
      <TableRow ref={setNodeRef} style={rowStyle} key={color.id}>
        <TableCell className="w-12">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-2"
          >
            <GripVertical className="h-4 w-4 text-gray-400" />
          </div>
        </TableCell>
        <TableCell className="font-mono text-sm">{color.id}</TableCell>
        <TableCell className="font-mono text-sm">{color.order || 0}</TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            {color.image_url ? (
              <img
                src={color.image_url}
                alt={color.color_name}
                className="w-16 h-16 object-cover rounded"
              />
            ) : (
              <div className="w-16 h-16 bg-gray-200 rounded" />
            )}
            {color.hex_code && (
              <div 
                className="w-8 h-8 rounded border border-gray-300"
                style={{ backgroundColor: color.hex_code }}
              />
            )}
          </div>
        </TableCell>
        <TableCell className="font-medium">{color.color_name}</TableCell>
        <TableCell>{color.hex_code || "-"}</TableCell>
        <TableCell>{color.gender === "male" ? "Erkek" : "Kadın"}</TableCell>
        <TableCell>{color.is_premium ? "Evet" : "Hayır"}</TableCell>
        <TableCell>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleEdit(color)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteColorId(color.id)}
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
        <h2 className="text-3xl font-bold text-gray-900">Hair Colors</h2>
        <p className="text-gray-600 mt-2">Saç renklerini yönetin</p>
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Tüm Renkler</CardTitle>
            <Button onClick={handleCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Yeni Renk Ekle
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Renk ara..."
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
                    <TableHead>Renk Adı</TableHead>
                    <TableHead>Hex Kod</TableHead>
                    <TableHead>Cinsiyet</TableHead>
                    <TableHead>Premium</TableHead>
                    <TableHead>İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <SortableContext
                    items={filteredColors.map(c => c.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {filteredColors.map((color) => (
                      <SortableRow key={color.id} color={color} />
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rengi Düzenle</DialogTitle>
            <DialogDescription>
              Hair color bilgilerini güncelleyin
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="color_name">Renk Adı</Label>
              <Input
                id="color_name"
                value={formData.color_name}
                onChange={(e) => setFormData({ ...formData, color_name: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="hex_code">Hex Kodu (Opsiyonel)</Label>
              <div className="flex gap-2">
                <Input
                  id="hex_code"
                  value={formData.hex_code}
                  onChange={(e) => setFormData({ ...formData, hex_code: e.target.value })}
                  placeholder="#000000"
                />
                {formData.hex_code && (
                  <div 
                    className="w-10 h-10 rounded border border-gray-300"
                    style={{ backgroundColor: formData.hex_code }}
                  />
                )}
              </div>
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
            <DialogTitle>Yeni Renk Ekle</DialogTitle>
            <DialogDescription>
              Yeni bir hair color oluşturun
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="new_color_name">Renk Adı</Label>
              <Input
                id="new_color_name"
                value={formData.color_name}
                onChange={(e) => setFormData({ ...formData, color_name: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new_hex_code">Hex Kodu (Opsiyonel)</Label>
              <div className="flex gap-2">
                <Input
                  id="new_hex_code"
                  value={formData.hex_code}
                  onChange={(e) => setFormData({ ...formData, hex_code: e.target.value })}
                  placeholder="#000000"
                />
                {formData.hex_code && (
                  <div 
                    className="w-10 h-10 rounded border border-gray-300"
                    style={{ backgroundColor: formData.hex_code }}
                  />
                )}
              </div>
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
      <AlertDialog open={!!deleteColorId} onOpenChange={() => setDeleteColorId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Emin misiniz?</AlertDialogTitle>
            <AlertDialogDescription>
              Bu işlem geri alınamaz. Renk kalıcı olarak silinecektir.
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