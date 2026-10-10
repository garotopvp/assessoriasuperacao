import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Search, ShoppingBag, Menu, X, User, Shield } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useAuthContext } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, CreditCard, BarChart3 } from "lucide-react";

const navLinks = [
  { href: "/", label: "INÍCIO" },
  { href: "/#historia", label: "SOBRE" },
  { href: "/#servicos", label: "SERVIÇOS" },
  { href: "/nova-regata", label: "REGATA 🔥", isHighlight: true },
  { href: "/roupas", label: "LOJA" },
  { href: "/clube", label: "CLUBE" },
  { href: "/#contato", label: "CONTATO" },
];

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { cartCount, toggleCart } = useCart();
  const { user, isTeacher, isAdmin, signOut } = useAuthContext();
  const location = useLocation();

  const isActive = (href: string) => {
    const hasHash = href.includes("#");
    const [pathPart, hashPart] = href.split("#");
    const path = pathPart || "/";

    if (hasHash) {
      const targetHash = `#${hashPart}`;
      return location.pathname === path && location.hash === targetHash;
    }

    if (path === "/") {
      return location.pathname === "/" && !location.hash;
    }

    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-black/10 text-black shadow-sm">
      <div className="container px-4 md:px-8 flex items-center justify-between h-20 mx-auto">
        {/* Logo */}
        <Link to="/" className="flex items-center">
          <img src="/images/logo-new.png" alt="Superação Assessoria Esportiva" className="h-16 w-auto object-contain" />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-6 xl:gap-8">
          {navLinks.map((link) => {
            const isHash = link.href.includes("#");
            const Component = isHash ? "a" : Link;
            return (
              <Component
                key={link.href}
                {...(isHash ? { href: link.href } : { to: link.href })}
                className={cn(
                  "text-sm xl:text-base font-bold uppercase tracking-wider xl:tracking-widest transition-colors relative flex items-center h-full",
                  link.isHighlight
                    ? "text-orange-600 hover:text-orange-500 font-extrabold"
                    : isActive(link.href)
                    ? "text-primary border-b-2 border-primary"
                    : "text-black hover:text-primary"
                )}
              >
                {link.label}
              </Component>
            );
          })}
          <Link
            to="/#contato"
            className="ml-2 bg-primary text-white text-xs font-bold tracking-wider uppercase px-6 py-2.5 rounded-full hover:bg-primary/90 transition-colors"
          >
            Começar Agora
          </Link>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Menu do Usuário */}
          <div className="hidden sm:flex items-center">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="p-2 text-neutral-600 hover:text-black transition-colors focus:outline-none"
                    aria-label="Menu do Usuário"
                  >
                    <User className="w-5 h-5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/perfil" className="cursor-pointer w-full flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      <span>Meu Perfil</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/feedback" className="cursor-pointer w-full flex items-center">
                      <BarChart3 className="mr-2 h-4 w-4" />
                      <span>Feedback Semanal</span>
                    </Link>
                  </DropdownMenuItem>
                  {isTeacher && (
                    <DropdownMenuItem asChild>
                      <Link
                        to="/professor"
                        className="cursor-pointer w-full flex items-center text-orange-600 font-semibold focus:text-orange-600"
                      >
                        <BarChart3 className="mr-2 h-4 w-4" />
                        <span>Painel Professor</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  {isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link
                        to="/admin"
                        className="cursor-pointer w-full flex items-center text-primary font-semibold focus:text-primary"
                      >
                        <Shield className="mr-2 h-4 w-4" />
                        <span>Painel Admin</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem asChild>
                    <Link
                      to="/minha-assinatura"
                      className="cursor-pointer w-full flex items-center"
                    >
                      <CreditCard className="mr-2 h-4 w-4" />
                      <span>Minha Assinatura</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => signOut()}
                    className="cursor-pointer text-destructive focus:text-destructive"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sair</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link
                to="/login"
                className="p-2 text-neutral-600 hover:text-black transition-colors"
                aria-label="Login"
              >
                <User className="w-5 h-5" />
              </Link>
            )}
          </div>

          <button
            onClick={() => toggleCart()}
            className="relative p-2 text-neutral-600 hover:text-black transition-colors"
            aria-label="Carrinho"
          >
            <ShoppingBag className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 text-[10px] font-bold bg-primary text-white rounded-full flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 text-black"
            aria-label="Menu"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <nav className="lg:hidden bg-background border-t border-border">
          <div className="container py-4 flex flex-col gap-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={cn(
                  "text-sm font-medium tracking-wide py-2 flex items-center justify-between",
                  link.isHighlight
                    ? "text-orange-500 font-bold bg-orange-500/10 px-3 rounded-lg border border-orange-500/20"
                    : isActive(link.href)
                    ? "text-primary font-bold"
                    : "text-foreground hover:text-primary"
                )}
              >
                <span>{link.label}</span>
                {link.isHighlight && (
                  <span className="text-[10px] bg-orange-500 text-black font-extrabold px-2 py-0.5 rounded-full">
                    NOVO
                  </span>
                )}
              </Link>
            ))}
            <div className="pt-4 mt-2 border-t border-border flex flex-col gap-2">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1 mb-1">
                Minha Conta
              </span>
              {user ? (
                <>
                  <Link
                    to="/perfil"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-sm font-semibold text-foreground hover:text-primary py-2 flex items-center gap-3 transition-colors px-1"
                  >
                    <User className="w-4 h-4 text-primary" /> MEU PERFIL
                  </Link>
                  <Link
                    to="/feedback"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-sm font-semibold text-foreground hover:text-primary py-2 flex items-center gap-3 transition-colors px-1"
                  >
                    <BarChart3 className="w-4 h-4 text-primary" /> FEEDBACK SEMANAL
                  </Link>
                  {isTeacher && (
                    <Link
                      to="/professor"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="text-sm font-bold text-orange-600 hover:text-orange-700 py-3 flex items-center gap-3 transition-colors px-3 bg-orange-50 dark:bg-orange-500/10 rounded-lg"
                    >
                      <BarChart3 className="w-4 h-4" /> PAINEL PROFESSOR
                    </Link>
                  )}
                  {isAdmin && (
                    <Link
                      to="/admin"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="text-sm font-bold text-primary hover:text-primary/80 py-3 flex items-center gap-3 transition-colors px-3 bg-primary/5 rounded-lg"
                    >
                      <Shield className="w-4 h-4" /> PAINEL ADMIN
                    </Link>
                  )}
                  <Link
                    to="/minha-assinatura"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-sm font-semibold text-foreground hover:text-primary py-2 flex items-center gap-3 transition-colors px-1"
                  >
                    <CreditCard className="w-4 h-4 text-primary" /> MINHA ASSINATURA
                  </Link>
                  <button
                    onClick={() => {
                      signOut();
                      setIsMobileMenuOpen(false);
                    }}
                    className="mt-2 text-sm font-semibold text-destructive hover:bg-destructive/5 py-2 flex items-center gap-3 transition-colors px-1 text-left w-full"
                  >
                    <LogOut className="w-4 h-4" /> SAIR DA CONTA
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-sm font-bold text-primary py-3 flex items-center gap-3 px-3 bg-primary/5 rounded-lg"
                >
                  <User className="w-4 h-4" /> ENTRAR NO SISTEMA
                </Link>
              )}
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}
