import {
  Eye,
  FileUp,
  KeyRound,
  LogIn,
  PencilLine,
  ScanSearch,
  Share2,
  Download,
  type LucideIcon,
} from 'lucide-react'
import type { AuditAction } from './audit-data'

export const ACTION_ICONS: Record<AuditAction, LucideIcon> = {
  connexion: LogIn,
  export: Download,
  modification: PencilLine,
  analyse: ScanSearch,
  import: FileUp,
  partage: Share2,
  consultation: Eye,
  droits: KeyRound,
}
