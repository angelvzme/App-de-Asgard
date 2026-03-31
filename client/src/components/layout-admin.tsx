import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { LayoutDashboard, Users, LogOut, Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import gymLogo from "@assets/asgard-logo.png";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { logout, user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const navigation = [
    { name: "Panel de Control", href: "/admin", icon: LayoutDashboard },
    { name: "Miembros", href: "/admin/members", icon: Users },
  ];

  const NavLinks = () => (
    <>
      {navigation.map((item) => {
        const isActive = location === item.href;
        return (
          <Link key={item.name} href={item.href}>
            <div
              onClick={() => setIsOpen(false)}
              className={`
                group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 cursor-pointer
                ${isActive
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                  : "text-muted-foreground hover:bg-secondary hover:text-white"
                }
              `}
            >
              <item.icon className={`mr-3 h-5 w-5 ${isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-white"}`} />
              {item.name}
            </div>
          </Link>
        );
      })}
    </>
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col fixed inset-y-0 z-50 bg-card border-r border-border/50">
        <div className="flex flex-col flex-grow pt-5 overflow-y-auto">
          <div className="flex items-center flex-shrink-0 px-6 mb-8">
            <img
              src={gymLogo}
              alt="Asgard Gym"
              className="h-10 w-auto mr-3 drop-shadow-[0_0_8px_rgba(220,38,38,0.5)]"
            />
            <span className="font-display text-2xl font-bold tracking-tighter text-foreground">
              ASGARD
            </span>
          </div>

          <div className="flex-1 flex flex-col px-4 space-y-2">
            <NavLinks />
          </div>

          <div className="p-4 mt-auto border-t border-border/50">
            <div className="flex items-center mb-4 px-2">
              <div className="h-9 w-9 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
                <span className="text-primary font-bold text-sm">
                  {user?.firstName?.[0]?.toUpperCase() || "A"}
                </span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-white">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-muted-foreground">ID: {user?.memberId}</p>
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full justify-start text-muted-foreground hover:text-white hover:bg-secondary border-border/50"
              onClick={() => logout()}
            >
              <LogOut className="mr-3 h-4 w-4" />
              Cerrar sesión
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-card/80 backdrop-blur-md border-b border-border h-16 flex items-center justify-between px-4">
        <div className="flex items-center">
          <img
            src={gymLogo}
            alt="Asgard Gym"
            className="h-8 w-auto mr-2 drop-shadow-[0_0_6px_rgba(220,38,38,0.5)]"
          />
          <span className="font-display text-lg font-bold">ASGARD</span>
        </div>
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 bg-card border-r border-border p-0">
            <div className="flex flex-col h-full pt-5">
              <div className="px-6 mb-8 flex items-center justify-between">
                <div className="flex items-center">
                  <img src={gymLogo} alt="Asgard Gym" className="h-8 w-auto mr-2 drop-shadow-[0_0_6px_rgba(220,38,38,0.5)]" />
                  <span className="font-display text-xl font-bold">ASGARD</span>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <div className="flex-1 px-4 space-y-2">
                <NavLinks />
              </div>
              <div className="p-4 border-t border-border mt-auto">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-900/10"
                  onClick={() => logout()}
                >
                  <LogOut className="mr-3 h-4 w-4" />
                  Cerrar sesión
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col md:pl-64 pt-16 md:pt-0">
        <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
