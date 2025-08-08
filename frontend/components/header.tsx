'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Trophy, LogOut, User, Shield, Menu, X } from 'lucide-react';

export function Header() {
  const { data: session, status } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    // Clear any stored tokens
    localStorage.removeItem('token');
    signOut({ callbackUrl: '/' });
    setMobileMenuOpen(false);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <header className="text-white shadow-lg sticky top-0 z-50" style={{ background: 'linear-gradient(135deg, rgb(98, 181, 229) 0%, rgb(49, 91, 115) 100%)' }}>
      <div className="container mx-auto px-4 py-4 md:py-5">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 md:space-x-3 group" onClick={closeMobileMenu}>
            <div className="bg-white/20 p-1.5 md:p-2 rounded-lg group-hover:bg-white/30 transition-colors">
              <Trophy className="h-6 w-6 md:h-8 md:w-8" />
            </div>
            <div>
              <span className="text-xl md:text-2xl font-bold block">COV</span>
              <span className="text-xs md:text-sm opacity-90">Tweet League</span>
            </div>
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="/leaderboard" className="hover:text-sky-200 transition-colors">
              Leaderboard
            </Link>
            <Link href="/how-it-works" className="hover:text-sky-200 transition-colors">
              How It Works
            </Link>
            {status === 'loading' ? (
              <span className="text-sm">Loading...</span>
            ) : session ? (
              <>
                <Link href="/predictions" className="hover:text-sky-200 transition-colors">
                  My Predictions
                </Link>
                <Link href="/profile" className="hover:text-sky-200 transition-colors flex items-center">
                  <User className="h-5 w-5 mr-1" />
                  <span className="max-w-[100px] truncate">
                    {session.user?.name || session.user?.email?.split('@')[0]}
                  </span>
                </Link>
                {session.user?.isAdmin && (
                  <Link href="/admin" className="hover:text-sky-200 transition-colors flex items-center">
                    <Shield className="h-5 w-5 mr-1" />
                    Admin
                  </Link>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="text-white hover:text-sky-200 hover:bg-white/10"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <Link href="/auth">
                <Button variant="default" size="sm" className="bg-white text-[rgb(98,181,229)] hover:bg-gray-100">
                  Sign In / Sign Up
                </Button>
              </Link>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="md:hidden mt-4 pb-4 border-t border-white/20 pt-4">
            <div className="flex flex-col space-y-3">
              <Link 
                href="/leaderboard" 
                className="py-2 px-3 rounded hover:bg-white/10 transition-colors"
                onClick={closeMobileMenu}
              >
                Leaderboard
              </Link>
              <Link 
                href="/how-it-works" 
                className="py-2 px-3 rounded hover:bg-white/10 transition-colors"
                onClick={closeMobileMenu}
              >
                How It Works
              </Link>
              
              {status === 'loading' ? (
                <span className="text-sm py-2 px-3">Loading...</span>
              ) : session ? (
                <>
                  <Link 
                    href="/predictions" 
                    className="py-2 px-3 rounded hover:bg-white/10 transition-colors"
                    onClick={closeMobileMenu}
                  >
                    My Predictions
                  </Link>
                  <Link 
                    href="/profile" 
                    className="py-2 px-3 rounded hover:bg-white/10 transition-colors flex items-center"
                    onClick={closeMobileMenu}
                  >
                    <User className="h-5 w-5 mr-2" />
                    {session.user?.name || session.user?.email?.split('@')[0]}
                  </Link>
                  {session.user?.isAdmin && (
                    <Link 
                      href="/admin" 
                      className="py-2 px-3 rounded hover:bg-white/10 transition-colors flex items-center"
                      onClick={closeMobileMenu}
                    >
                      <Shield className="h-5 w-5 mr-2" />
                      Admin
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="py-2 px-3 rounded hover:bg-white/10 transition-colors flex items-center text-left"
                  >
                    <LogOut className="h-5 w-5 mr-2" />
                    Sign Out
                  </button>
                </>
              ) : (
                <div className="flex flex-col space-y-2 pt-2">
                  <Link href="/auth" onClick={closeMobileMenu}>
                    <Button variant="default" className="w-full bg-white text-[rgb(98,181,229)] hover:bg-gray-100">
                      Sign In / Sign Up
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}