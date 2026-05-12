"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ShoppingCart, Search, Menu, X, ChevronDown, User, Heart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Page {
  id: string;
  title: string;
  slug: string;
}

interface StorefrontHeaderProps {
  storeName: string;
  logo?: string | null;
  pages: Page[];
  subdomain: string;
}

export function StorefrontHeader({ storeName, logo, pages }: StorefrontHeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navPages = pages.filter(p => !["home", "index"].includes(p.slug)).slice(0, 6);

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-white/95 backdrop-blur-xl shadow-lg" : "bg-white"} border-b border-zinc-200`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 flex-shrink-0 group">
              {logo ? (
                <img src={logo} alt={storeName} className="h-9 w-auto object-contain group-hover:scale-105 transition-transform" />
              ) : (
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">{storeName.charAt(0)}</span>
                  </div>
                  <span className="text-xl font-heading font-bold text-zinc-900 group-hover:text-violet-600 transition-colors">{storeName}</span>
                </div>
              )}
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-1">
              <Link href="/" className="px-4 py-2 text-sm font-medium text-zinc-600 hover:text-violet-600 hover:bg-violet-50 rounded-xl transition-all duration-200">
                Home
              </Link>
              {navPages.map(page => (
                <Link
                  key={page.id}
                  href={`/${page.slug}`}
                  className="px-4 py-2 text-sm font-medium text-zinc-600 hover:text-violet-600 hover:bg-violet-50 rounded-xl transition-all duration-200"
                >
                  {page.title}
                </Link>
              ))}
              <Link href="/products" className="px-4 py-2 text-sm font-medium text-zinc-600 hover:text-violet-600 hover:bg-violet-50 rounded-xl transition-all duration-200">
                Products
              </Link>
              <div className="relative group">
                <button className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-zinc-600 hover:text-violet-600 hover:bg-violet-50 rounded-xl transition-all duration-200">
                  More
                  <ChevronDown className="w-4 h-4" />
                </button>
                <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-zinc-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  <div className="p-2">
                    <Link href="/about" className="block px-3 py-2 text-sm text-zinc-600 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors">About Us</Link>
                    <Link href="/contact" className="block px-3 py-2 text-sm text-zinc-600 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors">Contact</Link>
                    <Link href="/faq" className="block px-3 py-2 text-sm text-zinc-600 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors">FAQ</Link>
                  </div>
                </div>
              </div>
            </nav>

            {/* Right Actions */}
            <div className="flex items-center gap-2">
              {/* Search */}
              <button 
                onClick={() => setSearchOpen(!searchOpen)}
                className="p-2.5 text-zinc-500 hover:text-violet-600 hover:bg-violet-50 rounded-xl transition-all duration-200"
              >
                <Search className="w-5 h-5" />
              </button>
              
              {/* Wishlist */}
              <button className="hidden sm:flex p-2.5 text-zinc-500 hover:text-violet-600 hover:bg-violet-50 rounded-xl transition-all duration-200 relative">
                <Heart className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">3</span>
              </button>

              {/* Cart */}
              <button className="relative p-2.5 text-zinc-500 hover:text-violet-600 hover:bg-violet-50 rounded-xl transition-all duration-200 group">
                <ShoppingCart className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-violet-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">2</span>
              </button>

              {/* Account */}
              <button className="hidden sm:flex p-2.5 text-zinc-500 hover:text-violet-600 hover:bg-violet-50 rounded-xl transition-all duration-200">
                <User className="w-5 h-5" />
              </button>

              {/* Mobile Menu Toggle */}
              <button
                className="lg:hidden p-2.5 text-zinc-500 hover:text-violet-600 hover:bg-violet-50 rounded-xl transition-all duration-200"
                onClick={() => setMobileOpen(!mobileOpen)}
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <AnimatePresence>
          {searchOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="border-t border-zinc-200 bg-white"
            >
              <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                  <input
                    type="text"
                    placeholder="Search products..."
                    className="w-full pl-12 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                    autoFocus
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="fixed top-16 left-0 right-0 z-40 bg-white border-b border-zinc-200 shadow-xl lg:hidden"
          >
            <nav className="max-w-7xl mx-auto px-4 py-6 space-y-1">
              <Link href="/" onClick={() => setMobileOpen(false)} className="block px-4 py-3 text-sm font-medium text-zinc-700 hover:text-violet-600 hover:bg-violet-50 rounded-xl transition-colors">Home</Link>
              {navPages.map(page => (
                <Link key={page.id} href={`/${page.slug}`} onClick={() => setMobileOpen(false)} className="block px-4 py-3 text-sm font-medium text-zinc-700 hover:text-violet-600 hover:bg-violet-50 rounded-xl transition-colors">
                  {page.title}
                </Link>
              ))}
              <Link href="/products" onClick={() => setMobileOpen(false)} className="block px-4 py-3 text-sm font-medium text-zinc-700 hover:text-violet-600 hover:bg-violet-50 rounded-xl transition-colors">Products</Link>
              <div className="border-t border-zinc-100 pt-4 mt-4">
                <Link href="/about" onClick={() => setMobileOpen(false)} className="block px-4 py-3 text-sm text-zinc-600 hover:text-violet-600 hover:bg-violet-50 rounded-xl transition-colors">About Us</Link>
                <Link href="/contact" onClick={() => setMobileOpen(false)} className="block px-4 py-3 text-sm text-zinc-600 hover:text-violet-600 hover:bg-violet-50 rounded-xl transition-colors">Contact</Link>
                <Link href="/account" onClick={() => setMobileOpen(false)} className="block px-4 py-3 text-sm text-zinc-600 hover:text-violet-600 hover:bg-violet-50 rounded-xl transition-colors">My Account</Link>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Spacer for fixed header */}
      <div className="h-16" />
    </>
  );
}
