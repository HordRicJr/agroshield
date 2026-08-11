import {
  FileUp,
  KeyRound,
  MessageSquareWarning,
  Share2,
  Smartphone,
  UserRoundCog,
  type LucideIcon,
} from 'lucide-react'
import type { AlertIcon } from './alerts-data'

export const ALERT_ICONS: Record<AlertIcon, LucideIcon> = {
  export: FileUp,
  login: KeyRound,
  phishing: MessageSquareWarning,
  share: Share2,
  device: Smartphone,
  rights: UserRoundCog,
}
