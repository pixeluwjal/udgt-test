// components/Footer.tsx
export default function Footer() {
  return (
    <footer className="w-full bg-[#f8fafc] border-t border-gray-200 py-8 mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
        
        {/* Brand */}
        <div className="flex items-center gap-2">
          <div className="text-2xl font-bold text-[#00C4C6]">Expenzoid</div>
          <span className="text-sm text-gray-500">© {new Date().getFullYear()} All rights reserved</span>
        </div>

        {/* Links */}
        <div className="flex flex-wrap gap-6 text-sm text-gray-600">
          <a href="/" className="hover:text-[#00C4C6] transition">Home</a>
          <a href="/#ai-expense" className="hover:text-[#00C4C6] transition">Features</a>
          <a href="/#how-it-works" className="hover:text-[#00C4C6] transition">How it Works</a>
          <a href="/#why-ai" className="hover:text-[#00C4C6] transition">Why Expenzoid</a>
        </div>
      </div>
    </footer>
  );
}
