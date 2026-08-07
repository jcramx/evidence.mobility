import React from 'react';

export default function Footer() {
  return (
    <footer className="border-t border-gray-800/80 py-6 px-6 mt-auto bg-[#070c1f]">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-gray-400">
        <p>© {new Date().getFullYear()} evidence.mobility. Todos los derechos reservados.</p>
        <p className="font-mono tracking-wide text-gray-500">
          Powered by <span className="text-[#F4D35E]">evidence.sys</span>
        </p>
      </div>
    </footer>
  );
}