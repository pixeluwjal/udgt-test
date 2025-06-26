"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import Image from "next/image";

export default function Navbar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`w-full fixed top-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-white/95 backdrop-blur-md shadow-lg" : "bg-white"
      }`}
    >
      <div className="max-w-7xl mx-auto flex justify-between items-center px-4 py-2 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center group">
          <Image
            src="/logo.png"
            alt="Expenzoid Logo"
            width={180}
            height={50}
            className="object-contain transition-transform group-hover:scale-105"
            priority
          />
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8">
          <Link
            href="/"
            className={`relative group text-sm font-medium transition-colors ${
              pathname === "/" ? "text-[#3E4852] font-semibold" : "text-gray-600 hover:text-[#3E4852]"
            }`}
          >
            Home
            <span
              className={`absolute -bottom-1 left-0 h-[2px] bg-[#17C1BE] transition-all duration-300 ${
                pathname === "/" ? "w-full" : "w-0 group-hover:w-full"
              }`}
            ></span>
          </Link>

          <Link
            href="#ai-expense"
            className="text-gray-600 hover:text-[#3E4852] text-sm font-medium transition-colors"
          >
            Features
          </Link>

          <Link
            href="#how-it-works"
            className="text-gray-600 hover:text-[#3E4852] text-sm font-medium transition-colors"
          >
            How it Works
          </Link>

          <Link
            href="#why-ai"
            className="text-gray-600 hover:text-[#3E4852] text-sm font-medium transition-colors"
          >
            Why Expenzoid
          </Link>

          <SignedIn>
            <Link
              href="/dashboard"
              className={`relative group text-sm font-medium transition-colors ${
                pathname === "/dashboard"
                  ? "text-[#3E4852] font-semibold"
                  : "text-gray-600 hover:text-[#3E4852]"
              }`}
            >
              Dashboard
              <span
                className={`absolute -bottom-1 left-0 h-[2px] bg-[#17C1BE] transition-all duration-300 ${
                  pathname === "/dashboard" ? "w-full" : "w-0 group-hover:w-full"
                }`}
              ></span>
            </Link>
          </SignedIn>

          <div className="flex items-center gap-4 ml-6">
            <SignedOut>
              <Link href="/sign-in">
                <Button
                  variant="ghost"
                  className="rounded-full px-6 text-[#3E4852] hover:bg-[#17C1BE]/10 hover:text-[#3E4852] transition-all"
                >
                  Login
                </Button>
              </Link>
              <Link href="/sign-up">
                <Button className="rounded-full px-6 bg-[#17C1BE] hover:bg-[#14a8a6] text-white transition-all shadow-lg hover:shadow-xl">
                  Sign Up
                </Button>
              </Link>
            </SignedOut>
            <SignedIn>
              <UserButton
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    avatarBox: "h-9 w-9 border-2 border-[#17C1BE]/20",
                    userButtonPopoverCard: "w-full shadow-xl border border-gray-100",
                    userButtonPopoverActionButtonText: "text-[#3E4852]",
                    userButtonPopoverActionButton: "hover:bg-[#17C1BE]/10",
                    userButtonPopoverFooter: "hidden",
                    userPreviewTextContainer: "text-[#3E4852]",
                    userButtonPopoverRootBox: "w-[300px]",
                    logoImage: "hidden",
                    logoBox: "hidden",
                    headerTitle: "hidden",
                    headerSubtitle: "hidden",
                  },
                }}
              />
            </SignedIn>
          </div>
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden flex items-center">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 rounded-full hover:bg-[#3E4852]/10 transition"
            aria-label="Toggle menu"
          >
            {menuOpen ? <X className="w-6 h-6 text-[#3E4852]" /> : <Menu className="w-6 h-6 text-[#3E4852]" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 shadow-xl animate-in fade-in slide-in-from-top-5">
          <div className="px-5 py-3 flex flex-col gap-1">
            <Link href="/" onClick={() => setMenuOpen(false)} className="py-3 px-4 rounded-lg text-gray-600 hover:bg-[#3E4852]/5">
              Home
            </Link>
            <Link href="#ai-expense" onClick={() => setMenuOpen(false)} className="py-3 px-4 rounded-lg text-gray-600 hover:bg-[#3E4852]/5">
              Features
            </Link>
            <Link href="#how-it-works" onClick={() => setMenuOpen(false)} className="py-3 px-4 rounded-lg text-gray-600 hover:bg-[#3E4852]/5">
              How it Works
            </Link>
            <Link href="#why-ai" onClick={() => setMenuOpen(false)} className="py-3 px-4 rounded-lg text-gray-600 hover:bg-[#3E4852]/5">
              Why Expenzoid
            </Link>

            <SignedIn>
              <Link href="/dashboard" onClick={() => setMenuOpen(false)} className="py-3 px-4 rounded-lg text-gray-600 hover:bg-[#3E4852]/5">
                Dashboard
              </Link>
            </SignedIn>

            <div className="flex flex-col gap-2 pt-2 mt-2 border-t border-gray-100">
              <SignedOut>
                <Link href="/login" onClick={() => setMenuOpen(false)}>
                  <Button variant="outline" className="w-full border-[#3E4852]/30 text-[#3E4852] hover:bg-[#17C1BE]/10 hover:border-[#17C1BE]/30">
                    Login
                  </Button>
                </Link>
                <Link href="/signup" onClick={() => setMenuOpen(false)}>
                  <Button className="w-full bg-[#17C1BE] hover:bg-[#14a8a6] text-white">
                    Sign Up
                  </Button>
                </Link>
              </SignedOut>
              <SignedIn>
                <div className="flex flex-col gap-2">
                  <Link href="/profile" onClick={() => setMenuOpen(false)}>
                    <Button variant="outline" className="w-full border-[#3E4852]/30 text-[#3E4852] hover:bg-[#17C1BE]/10 hover:border-[#17C1BE]/30">
                      My Profile
                    </Button>
                  </Link>
                  <Link href="/sign-out" onClick={() => setMenuOpen(false)}>
                    <Button className="w-full bg-[#17C1BE] hover:bg-[#14a8a6] text-white">
                      Sign Out
                    </Button>
                  </Link>
                </div>
              </SignedIn>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
