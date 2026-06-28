import {
  Search, Plus, Trash2, Folder, FileText, Star, Share, Filter, Download,
  Upload, RefreshCw, Settings, Check, Inbox, Calendar, BarChart3, User, Bell,
  Home, Mail, Lock, Cloud, Image, Play, Pencil, Copy, Link, Info, TriangleAlert,
  Heart, LayoutGrid, List, ArrowRight, MoreHorizontal, Clock, Globe, Tag,
  Bookmark, Flag, type LucideIcon,
} from "lucide-react";
import type { IconName } from "../schema";

// Maps the closed icon vocabulary -> a Lucide glyph. The agent only ever names
// an icon from this whitelist; anything off-list is impossible to render.
const MAP: Record<IconName, LucideIcon> = {
  search: Search, plus: Plus, trash: Trash2, folder: Folder, document: FileText,
  star: Star, share: Share, filter: Filter, download: Download, upload: Upload,
  refresh: RefreshCw, settings: Settings, check: Check, inbox: Inbox,
  calendar: Calendar, chart: BarChart3, user: User, bell: Bell, home: Home,
  mail: Mail, lock: Lock, cloud: Cloud, image: Image, play: Play, edit: Pencil,
  copy: Copy, link: Link, info: Info, warning: TriangleAlert, heart: Heart,
  grid: LayoutGrid, list: List, "arrow-right": ArrowRight, more: MoreHorizontal,
  clock: Clock, globe: Globe, tag: Tag, bookmark: Bookmark, flag: Flag,
};

export function Icon({ name, size = 16 }: { name?: IconName; size?: number }) {
  if (!name) return null;
  const Glyph = MAP[name];
  if (!Glyph) return null;
  return <Glyph size={size} strokeWidth={1.75} aria-hidden />;
}
