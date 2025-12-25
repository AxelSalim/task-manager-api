'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Sidebar as ShadcnSidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import { SidebarSeparator } from '@/components/ui/sidebar';
import Image from 'next/image';
import {
  CheckSquare,
  Calendar,
  User,
  Inbox,
  ChevronRight,
  Plus,
  Check,
  Trash2,
  Tag,
} from 'lucide-react';

const mainNavigation = [
  { name: 'Tout', href: '/tasks', icon: CheckSquare, count: 189 },
  { name: "Aujourd'hui", href: '/tasks?filter=today', icon: CheckSquare, count: 9 },
  { name: 'Demain', href: '/tasks?filter=tomorrow', icon: CheckSquare, count: 6 },
  { name: 'Calendrier', href: '/calendar', icon: Calendar, count: null },
  { name: 'Tags', href: '/tags', icon: Tag, count: null },
  { name: 'Assigné à moi', href: '/tasks?filter=assigned', icon: User, count: 12 },
  { name: 'Boîte de réception', href: '/inbox', icon: Inbox, count: 36 },
];

const folders = [
  {
    name: 'Personnel',
    items: [],
    collapsed: true,
  },
  {
    name: 'Travail',
    items: [
      { name: 'Équipe Design', count: 24 },
      { name: 'Équipe Produit', count: 18 },
      { name: 'Toutes les tâches', count: 42 },
    ],
    collapsed: false,
  },
  {
    name: 'Voyage',
    items: [
      { name: 'Voyage d\'affaires à Paris', count: null },
    ],
    collapsed: true,
  },
  {
    name: 'Liste fermée',
    items: [],
    collapsed: true,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({
    'Travail': false,
  });

  const toggleFolder = (folderName: string) => {
    setOpenFolders((prev) => ({
      ...prev,
      [folderName]: !prev[folderName],
    }));
  };

  return (
    <ShadcnSidebar className="border-r-0" collapsible="icon">
      <SidebarHeader className="border-b border-primary/20 px-4">
        <div className="flex items-center justify-between group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:relative">
          <div className="flex items-center gap-3 group-data-[collapsible=icon]:gap-0">
            <div className="relative h-12 w-12 shrink-0 group-data-[collapsible=icon]:h-10 group-data-[collapsible=icon]:w-10">
              <Image
                src="/logo_SPARK.png"
                alt="Spark Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
            <span className="font-semibold text-2xl text-white group-data-[collapsible=icon]:hidden">SPARK</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="overflow-x-hidden overflow-y-auto">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavigation.map((item) => {
                const isActive = pathname === item.href || pathname?.startsWith(item.href.split('?')[0] + '/');
                const Icon = item.icon;

                return (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      className={cn(
                        'text-white/80 hover:bg-white/10 hover:text-white',
                        isActive && 'bg-white/20 text-white'
                      )}
                    >
                      <Link href={item.href} className="flex items-center w-full min-w-0">
                        <Icon className="h-6 w-6 shrink-0" />
                        <span className="truncate">{item.name}</span>
                        {item.count !== null && (
                          <SidebarMenuBadge className="bg-white/20 text-white">
                            {item.count}
                          </SidebarMenuBadge>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator className="bg-white/10" />

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {folders.map((folder) => {
                const isOpen = openFolders[folder.name] || !folder.collapsed;

                return (
                  <SidebarMenuItem key={folder.name}>
                    <SidebarMenuButton
                      onClick={() => toggleFolder(folder.name)}
                      className="text-white/80 hover:bg-white/10 hover:text-white"
                    >
                      <div className="flex items-center gap-2 w-full min-w-0">
                        <ChevronRight
                          className={cn(
                            'h-6 w-6 transition-transform shrink-0',
                            isOpen && 'rotate-90'
                          )}
                        />
                        <span className="truncate">{folder.name}</span>
                      </div>
                    </SidebarMenuButton>
                    {isOpen && folder.items.length > 0 && (
                      <SidebarMenuSub>
                        {folder.items.map((item) => (
                          <SidebarMenuSubItem key={item.name}>
                            <SidebarMenuSubButton asChild>
                              <Link
                                href={`/tasks?folder=${encodeURIComponent(item.name)}`}
                                className="flex items-center justify-between w-full min-w-0 text-white/90 hover:text-white"
                              >
                                <span className="truncate">{item.name}</span>
                                {item.count !== null && (
                                  <span className="text-xs text-white/50 shrink-0 ml-2">{item.count}</span>
                                )}
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    )}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton className="text-white hover:bg-white/10">
                  <Plus className="h-6 w-6 mr-2" />
                  <span>Ajouter une liste</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator className="bg-white/10" />

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname?.includes('completed')}
                  className={cn(
                    'text-white hover:bg-white/10',
                    pathname?.includes('completed') && 'bg-white/20 text-white'
                  )}
                >
                  <Link href="/tasks?filter=completed" className="flex items-center w-full min-w-0">
                    <Check className="h-6 w-6 mr-2 shrink-0" />
                    <span className="truncate">Terminé</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname?.includes('trash')}
                  className={cn(
                    'text-white hover:bg-white/10',
                    pathname?.includes('trash') && 'bg-white/20 text-white'
                  )}
                >
                  <Link href="/tasks?filter=trash" className="flex items-center w-full min-w-0">
                    <Trash2 className="h-6 w-6 mr-2 shrink-0" />
                    <span className="truncate">Corbeille</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

    </ShadcnSidebar>
  );
}
