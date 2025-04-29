"use client"

import type React from "react"
import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { AtSign, Lock, ArrowRight, AlertCircle, Loader2, Home } from "lucide-react"
import Image from "next/image"
import { motion } from "framer-motion"
import { signIn, useSession } from "next-auth/react"

// Component to handle search params
function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session, status } = useSession()
  
  // If user is already logged in, redirect to dashboard
  useEffect(() => {
    if (status === "authenticated") {
      router.push("/dashboard")
    }
  }, [status, router])
  
  // Check for error from URL (e.g., from NextAuth)
  useEffect(() => {
    const errorFromUrl = searchParams.get("error")
    if (errorFromUrl) {
      if (errorFromUrl === "CredentialsSignin") {
        setError("Invalid email or password")
      } else {
        setError(`Authentication error: ${errorFromUrl}`)
      }
    }
  }, [searchParams])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
      })

      if (result?.error) {
        setError("Invalid email or password")
      } else {
        // Successfully signed in
        router.push("/dashboard")
        router.refresh() // Force a refresh to update session state
      }
    } catch (err) {
      console.error("Login error:", err)
      setError("An unexpected error occurred. Please try again later.")
    } finally {
      setIsLoading(false)
    }
  }

  // If still checking authentication status, show loading
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="max-w-md w-full py-10 space-y-8">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-extrabold tracking-tight text-primary">Welcome Back</h1>
        <p className="mt-2 text-muted-foreground">Sign in to your WellTrack account</p>
      </div>
      
      <form onSubmit={handleLogin} className="space-y-4">
        <div className="space-y-4">
          <div className="relative">
            <Label htmlFor="email" className="text-sm font-medium block mb-1.5">
              Email address
            </Label>
            <div className="relative">
              <AtSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 h-11 transition-all"
                required
              />
            </div>
          </div>
          
          <div className="relative">
            <div className="flex justify-between items-center mb-1.5">
              <Label htmlFor="password" className="text-sm font-medium">
                Password
              </Label>
              <Link href="/forgot-password" className="text-xs text-primary hover:underline">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 h-11 transition-all"
                required
              />
            </div>
          </div>
        </div>
        
        {error && (
          <div className="bg-red-50 text-red-800 p-3 rounded-md flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}
        
        <Button 
          className="w-full h-11 text-base relative group"
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              Sign in
              <ArrowRight className="ml-2 h-4 w-4 inline transition-transform group-hover:translate-x-1" />
            </>
          )}
        </Button>
        
        <div className="relative flex items-center justify-center my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300 dark:border-gray-700"></div>
          </div>
          <div className="relative px-4 bg-background text-sm text-muted-foreground">Or continue with</div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <Button 
            type="button" 
            variant="outline" 
            className="h-11"
            onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
          >
            <Image src="/google-logo.svg" alt="Google" width={18} height={18} className="mr-2" />
            Google
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            className="h-11"
            onClick={() => signIn('github', { callbackUrl: '/dashboard' })}
          >
            <Image src="/github-logo.svg" alt="GitHub" width={18} height={18} className="mr-2" />
            GitHub
          </Button>
        </div>
        
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link href="/signup" className="text-primary font-medium hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </form>
    </div>
  )
}

// Loading fallback for the suspense boundary
function LoginFormFallback() {
  return (
    <div className="max-w-md w-full py-10 space-y-8 flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex">
      {/* Home icon navigation */}
      <Link 
        href="/" 
        className="absolute top-6 left-6 z-50 p-2 rounded-full bg-foreground/10 backdrop-blur-sm hover:bg-foreground/20 transition-colors"
        aria-label="Back to home"
      >
        <Home className="h-5 w-5 text-primary md:text-primary" />
      </Link>

      {/* Left panel - Form */}
      <motion.div 
        className="w-full md:w-1/2 flex items-center justify-center p-6 lg:p-10 overflow-y-auto"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Suspense fallback={<LoginFormFallback />}>
          <LoginForm />
        </Suspense>
      </motion.div>
      
      {/* Right panel - Illustration/Branding */}
      <motion.div
        className="hidden md:flex md:w-1/2 bg-gradient-to-tr from-primary/90 to-primary items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <div className="max-w-lg p-10 text-center">
          <div className="relative h-64 w-64 mx-auto mb-8">
            <Image 
              src="/health-illustration.svg" 
              alt="Health tracking illustration" 
              fill 
              className="object-contain"
              priority
            />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">Track Your Health Journey</h2>
          <p className="text-white/80 mb-6">
            Monitor your progress, set goals, and improve your wellbeing with personalized insights.
          </p>
          <div className="flex justify-center space-x-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-2 w-2 rounded-full bg-white/50" />
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  )
}

