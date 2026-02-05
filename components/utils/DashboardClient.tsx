"use client";

import React, { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  Globe, 
  Briefcase, 
  FileText, 
  CreditCard, 
  LogOut,
  Menu,
  X,
  Users,
  Bell,
  Search,
  ChevronLeft,
  ChevronRight,
  Home,
  Settings
} from 'lucide-react';

// Shadcn Components
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { ModeToggle } from './mode-toggle';

// Define navigation items
const navItems = [
  { 
    name: 'Dashboard', 
    icon: LayoutDashboard, 
    path: '/dashboard',
    badge: null
  },
  { 
    name: 'Domains', 
    icon: Globe, 
    path: '/domains',
  },
  { 
    name: 'Internships', 
    icon: Briefcase, 
    path: '/internships',
  },
  { 
    name: 'Jobs', 
    icon: FileText, 
    path: '/jobs',
  },
  { 
    name: 'Payments', 
    icon: CreditCard, 
    path: '/payments',
  },
  { 
    name: 'Users', 
    icon: Users, 
    path: '/users',
    badge: null
  },
  { 
    name: 'Settings', 
    icon: Settings, 
    path: '/settings',
    badge: null
  },
];

export default function DashboardClient({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleNavigation = (path: string) => {
    router.push(path);
    setMobileMenuOpen(false);
  };

  const handleLogout = () => {
    // Implement logout logic
    console.log('Logging out...');
    router.push('/');
  };

  // Mobile sidebar content
  const MobileSidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo Section */}
      <div className="flex items-center justify-between p-6 border-b">
        <div className="flex items-center gap-3">
          <div className="bg-primary p-2 rounded-lg">
            <Briefcase className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-bold">ADMIN INTERNROCK</h1>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileMenuOpen(false)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-4 py-6">
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path || pathname.startsWith(item.path + '/');
            
            return (
              <Button
                key={item.name}
                variant={isActive ? "secondary" : "ghost"}
                className="w-full justify-start mb-1"
                onClick={() => handleNavigation(item.path)}
              >
                <Icon className="mr-2 h-4 w-4" />
                {item.name}
                {item.badge && (
                  <Badge variant="secondary" className="ml-auto">
                    {item.badge}
                  </Badge>
                )}
              </Button>
            );
          })}
        </nav>
      </ScrollArea>

      {/* Logout Section */}
      <div className="p-4 border-t">
        <Button
          variant="ghost"
          className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background">
      {/* Mobile Sidebar Sheet */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="w-[280px] p-0">
          <MobileSidebarContent />
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar */}
      <aside className={`
        hidden lg:flex flex-col
        fixed h-screen
        bg-card border-r
        transition-all duration-300 ease-in-out
        ${sidebarOpen ? 'w-64' : 'w-20'}
        z-30
      `}>
        <div className="flex flex-col h-full">
          {/* Logo Section */}
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="bg-primary p-2 rounded-lg flex-shrink-0">
                  <Briefcase className="h-5 w-5 text-primary-foreground" />
                </div>
                {sidebarOpen && (
                  <h1 className="text-lg font-bold truncate">
                    ADMIN INTERNROCK
                  </h1>
                )}
              </div>
              {sidebarOpen && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleSidebar}
                  className="h-8 w-8"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              )}
            </div>
            {!sidebarOpen && (
              <div className="flex justify-center mt-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleSidebar}
                  className="h-8 w-8"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1 px-3 py-6">
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.path || pathname.startsWith(item.path + '/');
                
                return (
                  <Button
                    key={item.name}
                    variant={isActive ? "secondary" : "ghost"}
                    size={sidebarOpen ? "default" : "icon"}
                    className={`w-full justify-start mb-1 ${!sidebarOpen ? "px-3" : ""}`}
                    onClick={() => handleNavigation(item.path)}
                    title={!sidebarOpen ? item.name : undefined}
                  >
                    <Icon className="h-4 w-4" />
                    {sidebarOpen && (
                      <>
                        <span className="ml-2 truncate">{item.name}</span>
                        {item.badge && (
                          <Badge variant="secondary" className="ml-auto">
                            {item.badge}
                          </Badge>
                        )}
                      </>
                    )}
                  </Button>
                );
              })}
            </nav>
          </ScrollArea>

          {/* Logout Section - Fixed at bottom */}
          <div className="p-3 border-t">
            <Button
              variant="ghost"
              size={sidebarOpen ? "default" : "icon"}
              className={`w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 ${!sidebarOpen ? "px-3" : ""}`}
              onClick={handleLogout}
              title={!sidebarOpen ? "Logout" : undefined}
            >
              <LogOut className="h-4 w-4" />
              {sidebarOpen && <span className="ml-2">Logout</span>}
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`
        flex-1 flex flex-col
        transition-all duration-300 ease-in-out
        ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'}
        w-full
      `}>
        {/* Header */}
        <header className="sticky top-0 z-20 bg-background border-b">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-4">
              {/* Mobile Menu Button */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="lg:hidden"
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[280px] p-0">
                  <MobileSidebarContent />
                </SheetContent>
              </Sheet>

              {/* Desktop Toggle Button (when sidebar collapsed) */}
              {!sidebarOpen && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleSidebar}
                  className="hidden lg:flex"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              )}

              {/* Search Bar */}
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  className="pl-9 w-[300px]"
                />
              </div>
            </div>

            {/* Header Right Section */}
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" className="relative">
                <ModeToggle />
              </Button>
              
              <Separator orientation="vertical" className="h-6" />
              
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src="https://github.com/shadcn.png" />
                  <AvatarFallback>AI</AvatarFallback>
                </Avatar>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium">Admin User</p>
                  <p className="text-xs text-muted-foreground">Administrator</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Breadcrumb */}
        <div className="px-6 py-3 border-b bg-muted/30">
          <nav className="flex items-center gap-2 text-sm">
            <Button variant="ghost" size="sm" className="h-7 px-2" asChild>
              <Link href="/">
                <Home className="h-3 w-3 mr-1" />
                Home
              </Link>
            </Button>
            <span className="text-muted-foreground">/</span>
            <span className="font-medium text-primary">
              {navItems.find(item => 
                pathname === item.path || pathname.startsWith(item.path + '/')
              )?.name || 'Dashboard'}
            </span>
          </nav>
        </div>

        {/* Main Content Area */}
        <ScrollArea className="flex-1">
          <main className="p-6">
            <Card className="p-6">
              {children}
            </Card>
          </main>
        </ScrollArea>
      </div>
    </div>
  );
}