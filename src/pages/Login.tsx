import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Home, Eye, EyeOff, Loader2, AlertCircle, Shield, User, Sparkles } from 'lucide-react';

export function LoginPage() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await signIn(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

  const quickLogin = async (userEmail: string) => {
    setEmail(userEmail);
    setPassword('demo123');
    setError('');
    setIsLoading(true);

    try {
      await signIn(userEmail, 'demo123');
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-sidebar via-sidebar to-sidebar/90 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 left-20 w-72 h-72 rounded-full bg-accent blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 rounded-full bg-accent/50 blur-3xl" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-accent/80 shadow-lg shadow-accent/20">
              <Home className="h-6 w-6 text-accent-foreground" />
            </div>
            <div>
              <h1 className="font-heading text-2xl font-bold text-white">Nebriix Homes</h1>
              <p className="text-xs text-white/50 uppercase tracking-wider">Premium Real Estate CRM</p>
            </div>
          </div>

          {/* Features */}
          <div className="space-y-8">
            <div>
              <h2 className="font-heading text-4xl font-bold text-white leading-tight">
                Manage Your<br />
                <span className="text-accent">Real Estate</span><br />
                Portfolio
              </h2>
              <p className="mt-4 text-white/60 max-w-md">
                A comprehensive CRM solution designed for Dubai's premium real estate market.
                Track properties, manage leads, and close deals efficiently.
              </p>
            </div>

            <div className="grid gap-4">
              <div className="flex items-center gap-3 text-white/80">
                <div className="h-10 w-10 rounded-lg bg-accent/20 flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="font-medium">Premium Properties</p>
                  <p className="text-sm text-white/50">Manage luxury listings with ease</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-white/80">
                <div className="h-10 w-10 rounded-lg bg-accent/20 flex items-center justify-center">
                  <User className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="font-medium">Lead Management</p>
                  <p className="text-sm text-white/50">Track and convert prospects</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-white/80">
                <div className="h-10 w-10 rounded-lg bg-accent/20 flex items-center justify-center">
                  <Shield className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="font-medium">Secure & Reliable</p>
                  <p className="text-sm text-white/50">Enterprise-grade security</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <p className="text-white/30 text-sm">
            &copy; 2024 Nebriix Homes. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Logo */}
          <div className="lg:hidden flex flex-col items-center gap-4 mb-8">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-accent/80 shadow-lg shadow-accent/20">
              <Home className="h-8 w-8 text-accent-foreground" />
            </div>
            <div className="text-center">
              <h1 className="font-heading text-2xl font-bold">Nebriix Homes</h1>
              <p className="text-sm text-muted-foreground">Premium Real Estate CRM</p>
            </div>
          </div>

          {/* Welcome Text */}
          <div className="text-center lg:text-left">
            <h2 className="text-2xl font-bold">Welcome back</h2>
            <p className="text-muted-foreground mt-1">Sign in to continue to your dashboard</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-11 bg-accent text-accent-foreground hover:bg-accent/90 font-semibold"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Quick Access</span>
            </div>
          </div>

          {/* Quick Login Options */}
          <div className="grid gap-3">
            <Button
              variant="outline"
              className="w-full h-14 justify-start hover:border-accent/50 hover:bg-accent/5 transition-all"
              onClick={() => quickLogin('admin@nebriix.com')}
              disabled={isLoading}
            >
              <div className="flex items-center gap-3 w-full">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-accent/20 to-accent/10 flex items-center justify-center border border-accent/20">
                  <Shield className="h-5 w-5 text-accent" />
                </div>
                <div className="text-left">
                  <p className="font-semibold">Admin Account</p>
                  <p className="text-xs text-muted-foreground">Full access to all features</p>
                </div>
              </div>
            </Button>
            <Button
              variant="outline"
              className="w-full h-14 justify-start hover:border-blue-500/50 hover:bg-blue-500/5 transition-all"
              onClick={() => quickLogin('user@nebriix.com')}
              disabled={isLoading}
            >
              <div className="flex items-center gap-3 w-full">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-500/10 flex items-center justify-center border border-blue-500/20">
                  <User className="h-5 w-5 text-blue-500" />
                </div>
                <div className="text-left">
                  <p className="font-semibold">User Account</p>
                  <p className="text-xs text-muted-foreground">Standard agent access</p>
                </div>
              </div>
            </Button>
          </div>

          {/* Footer Note */}
          <p className="text-xs text-center text-muted-foreground">
            Demo password: <code className="bg-muted px-1.5 py-0.5 rounded font-mono">demo123</code>
          </p>
        </div>
      </div>
    </div>
  );
}
