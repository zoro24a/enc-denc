"use client";

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Image as ImageIcon } from 'lucide-react';

const Header = () => {
  const location = useLocation();

  return (
    <header className="w-full bg-card shadow-sm border-b border-border/50 dark:border-border/30 py-4 px-6 flex justify-center sticky top-0 z-50">
      <nav className="flex space-x-4 max-w-4xl w-full">
        <Button asChild variant={location.pathname === '/' ? 'default' : 'ghost'}>
          <Link to="/" className="flex items-center">
            <ShieldCheck className="mr-2 h-4 w-4" />
            Encryption
          </Link>
        </Button>
        <Button asChild variant={location.pathname === '/steganography' ? 'default' : 'ghost'}>
          <Link to="/steganography" className="flex items-center">
            <ImageIcon className="mr-2 h-4 w-4" />
            Steganography
          </Link>
        </Button>
      </nav>
    </header>
  );
};

export default Header;