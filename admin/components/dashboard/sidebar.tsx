"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  Home,
  Scissors,
  Palette,
  History,
  Scan,
  MessageSquare
} from "lucide-react"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Hair Styles", href: "/dashboard/styles", icon: Scissors },
  { name: "Hair Colors", href: "/dashboard/colors", icon: Palette },
  { name: "İşlem Geçmişi", href: "/dashboard/history", icon: History },
  { name: "Yüz Analizleri", href: "/dashboard/analyses", icon: Scan },
  { name: "Sohbetler", href: "/dashboard/conversations", icon: MessageSquare },
]

export default function Sidebar() {
  const pathname = usePathname()
  
  return (
    <div className="bg-gray-900 text-white w-64 space-y-6 py-7 px-2 absolute inset-y-0 left-0 transform -translate-x-full md:relative md:translate-x-0 transition duration-200 ease-in-out">
      <div className="px-6">
        <h2 className="text-2xl font-semibold">Hair Style Admin</h2>
      </div>
      
      <nav className="space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group flex items-center px-6 py-3 text-sm font-medium rounded-md transition-colors",
                isActive
                  ? "bg-gray-800 text-white"
                  : "text-gray-300 hover:bg-gray-700 hover:text-white"
              )}
            >
              <item.icon
                className={cn(
                  "mr-3 h-5 w-5",
                  isActive ? "text-white" : "text-gray-400 group-hover:text-gray-300"
                )}
              />
              {item.name}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}