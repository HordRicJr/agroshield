import { useContext } from 'react'
import { SidebarContext } from '@/app/providers/sidebar-context'

export function useSidebar() {
  const context = useContext(SidebarContext)
  if (!context) {
    throw new Error("useSidebar doit être utilisé à l'intérieur d'un SidebarProvider")
  }
  return context
}
