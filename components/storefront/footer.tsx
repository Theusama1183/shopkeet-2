import Link from "next/link";
import { Instagram, Twitter, Facebook, Youtube, ArrowRight, Heart } from "lucide-react";

interface Page {
  id: string;
  title: string;
  slug: string;
}

interface StorefrontFooterProps {
  storeName: string;
  logo?: string | null;
  description?: string | null;
  pages: Page[];
}

export function StorefrontFooter({ storeName, logo, description, pages }: StorefrontFooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-zinc-900 text-zinc-400 mt-auto">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="mb-6">
              {logo ? (
                <img src={logo} alt={storeName} className="h-10 w-auto object-contain brightness-0 invert" />
              ) : (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <span className="text-white font-bold text-lg">{storeName.charAt(0)}</span>
                  </div>
                  <span className="text-2xl font-heading font-bold text-white">{storeName}</span>
                </div>
              )}
            </div>
            {description && (
              <p className="text-zinc-400 leading-relaxed max-w-md mb-6">{description}</p>
            )}
            
            {/* Social Links */}
            <div className="flex items-center gap-3">
              {[
                { icon: Instagram, href: "#", label: "Instagram" },
                { icon: Twitter, href: "#", label: "Twitter" },
                { icon: Facebook, href: "#", label: "Facebook" },
                { icon: Youtube, href: "#", label: "YouTube" },
              ].map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  className="w-10 h-10 rounded-xl bg-zinc-800 hover:bg-violet-600 flex items-center justify-center transition-all duration-200 group"
                  aria-label={label}
                >
                  <Icon className="w-5 h-5 text-zinc-400 group-hover:text-white transition-colors" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-6">Quick Links</h4>
            <ul className="space-y-3">
              <li><Link href="/" className="text-sm hover:text-white transition-colors hover:translate-x-1 inline-block duration-200">Home</Link></li>
              {pages.slice(0, 5).map(page => (
                <li key={page.id}>
                  <Link href={`/${page.slug}`} className="text-sm hover:text-white transition-colors hover:translate-x-1 inline-block duration-200">{page.title}</Link>
                </li>
              ))}
              <li><Link href="/products" className="text-sm hover:text-white transition-colors hover:translate-x-1 inline-block duration-200">All Products</Link></li>
            </ul>
          </div>

          {/* Customer Care */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-6">Customer Care</h4>
            <ul className="space-y-3">
              <li><Link href="/contact" className="text-sm hover:text-white transition-colors hover:translate-x-1 inline-block duration-200">Contact Us</Link></li>
              <li><Link href="/faq" className="text-sm hover:text-white transition-colors hover:translate-x-1 inline-block duration-200">FAQ</Link></li>
              <li><Link href="/shipping" className="text-sm hover:text-white transition-colors hover:translate-x-1 inline-block duration-200">Shipping Info</Link></li>
              <li><Link href="/returns" className="text-sm hover:text-white transition-colors hover:translate-x-1 inline-block duration-200">Returns</Link></li>
              <li><Link href="/size-guide" className="text-sm hover:text-white transition-colors hover:translate-x-1 inline-block duration-200">Size Guide</Link></li>
              <li><Link href="/track-order" className="text-sm hover:text-white transition-colors hover:translate-x-1 inline-block duration-200">Track Order</Link></li>
            </ul>
          </div>
        </div>

        {/* Newsletter */}
        <div className="border-t border-zinc-800 mt-12 pt-12">
          <div className="max-w-2xl">
            <h3 className="text-xl font-bold text-white mb-3">Stay Updated</h3>
            <p className="text-zinc-400 mb-6">Subscribe to get special offers, free giveaways, and exclusive deals.</p>
            <div className="flex gap-3">
              <input
                type="email"
                placeholder="Enter your email address"
                className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              />
              <button className="bg-violet-600 hover:bg-violet-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors flex items-center gap-2 group">
                Subscribe
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-zinc-800 mt-12 pt-8 flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-6 text-sm text-zinc-500">
            <p>© {year} {storeName}. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <Link href="/privacy" className="hover:text-zinc-300 transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-zinc-300 transition-colors">Terms of Service</Link>
              <Link href="/cookies" className="hover:text-zinc-300 transition-colors">Cookie Policy</Link>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-zinc-500">
            <span>Made with</span>
            <Heart className="w-4 h-4 text-red-500 fill-current" />
            <span>by</span>
            <a href="https://shopkeet.com" className="text-violet-400 hover:text-violet-300 font-semibold transition-colors">ShopKeet</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
