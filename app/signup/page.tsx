"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { AtSign, Lock, User, ArrowRight, AlertCircle, Loader2, CheckCircle, Home } from "lucide-react"
import Image from "next/image"
import { motion } from "framer-motion"
import { signIn } from "next-auth/react"

export default function SignupPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState(0)
  const router = useRouter()

  const updateFormData = (key: keyof typeof formData, value: string) => {
    setFormData({ ...formData, [key]: value })
    
    if (key === "password") {
      // Simple password strength indicator
      let strength = 0
      if (value.length >= 8) strength += 1
      if (/[A-Z]/.test(value)) strength += 1
      if (/[0-9]/.test(value)) strength += 1
      if (/[^A-Za-z0-9]/.test(value)) strength += 1
      setPasswordStrength(strength)
    }
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.")
      return
    }
    
    setIsLoading(true)

    try {
      // Register the user
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to register');
      }

      // Sign in the user
      const result = await signIn('credentials', {
        redirect: false,
        email: formData.email,
        password: formData.password,
      });

      if (result?.error) {
        throw new Error('Failed to sign in after registration');
      }

      // Redirect to the initial health form
      router.push('/initial-health-form');
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred. Please try again later.")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col">
      <div className="h-screen flex flex-col">
        <main className="flex-grow flex bg-background overflow-hidden">
          {/* Home icon navigation */}
          <Link 
            href="/" 
            className="absolute top-6 left-6 z-50 p-2 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors"
            aria-label="Back to home"
          >
            <Home className="h-5 w-5 text-primary md:text-white" />
          </Link>

          {/* Left panel - Illustration/Branding */}
          <motion.div 
            className="hidden md:flex md:w-1/2 bg-gradient-to-tr from-primary/90 to-primary items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
          >
            <div className="max-w-lg p-10 text-center">
              <div className="relative h-64 w-64 mx-auto mb-8">
                <Image 
                  src="/wellness-journey.svg" 
                  alt="Start your wellness journey" 
                  fill 
                  className="object-contain"
                  priority
                />
              </div>
              <h2 className="text-2xl font-bold text-white mb-4">Begin Your Wellness Journey</h2>
              <p className="text-white/80 mb-6">
                Join thousands of users improving their health and wellbeing with personalized tracking and insights.
              </p>
              <div className="flex justify-center space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className={`h-2 w-2 rounded-full ${i === 2 ? 'bg-white' : 'bg-white/50'}`} />
                ))}
              </div>
            </div>
          </motion.div>
          
          {/* Right panel - Form */}
          <motion.div 
            className="w-full md:w-1/2 flex items-center justify-center p-6 lg:p-10 overflow-y-auto"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="max-w-md w-full py-10 space-y-8">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-extrabold tracking-tight text-primary">Create Account</h1>
                <p className="mt-2 text-muted-foreground">Start tracking your wellness journey today</p>
              </div>
              
              <form onSubmit={handleSignup} className="space-y-5">
                <div className="space-y-4">
                  <div className="relative">
                    <Label htmlFor="name" className="text-sm font-medium block mb-1.5">
                      Full Name
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        id="name"
                        type="text"
                        placeholder="John Doe"
                        value={formData.name}
                        onChange={(e) => updateFormData("name", e.target.value)}
                        className="pl-10 h-11"
                        required
                      />
                    </div>
                  </div>
                  
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
                        value={formData.email}
                        onChange={(e) => updateFormData("email", e.target.value)}
                        className="pl-10 h-11"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="relative">
                    <Label htmlFor="password" className="text-sm font-medium block mb-1.5">
                      Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="Create a secure password"
                        value={formData.password}
                        onChange={(e) => updateFormData("password", e.target.value)}
                        className="pl-10 h-11"
                        required
                      />
                    </div>
                    {formData.password && (
                      <div className="mt-2">
                        <div className="flex gap-1.5 mb-1">
                          {[...Array(4)].map((_, i) => (
                            <div 
                              key={i} 
                              className={`h-1.5 flex-1 rounded-full ${
                                i < passwordStrength ? 
                                  passwordStrength >= 3 ? 'bg-green-500' : 
                                  passwordStrength >= 2 ? 'bg-yellow-500' : 'bg-red-500'
                                : 'bg-gray-200'
                              }`}
                            />
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {passwordStrength < 2 ? 'Use 8+ characters with numbers and symbols' : 
                           passwordStrength < 3 ? 'Getting better, add a symbol' : 
                           'Strong password'}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="relative">
                    <Label htmlFor="confirmPassword" className="text-sm font-medium block mb-1.5">
                      Confirm Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="Confirm your password"
                        value={formData.confirmPassword}
                        onChange={(e) => updateFormData("confirmPassword", e.target.value)}
                        className="pl-10 h-11"
                        required
                      />
                      {formData.password && formData.confirmPassword && (
                        formData.password === formData.confirmPassword ? (
                          <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500 h-4 w-4" />
                        ) : (
                          <AlertCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-500 h-4 w-4" />
                        )
                      )}
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
                      Create Account
                      <ArrowRight className="ml-2 h-4 w-4 inline transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </Button>
                
                {/* Add divider for social logins */}
                <div className="relative flex items-center justify-center my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300 dark:border-gray-700"></div>
                  </div>
                  <div className="relative px-4 bg-background text-sm text-muted-foreground">Or continue with</div>
                </div>
                
                {/* Add social login buttons */}
                <div className="grid grid-cols-2 gap-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="h-11"
                    onClick={() => signIn('google', { callbackUrl: '/initial-health-form' })}
                  >
                    <Image src="/google-logo.svg" alt="Google" width={18} height={18} className="mr-2" />
                    Google
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="h-11"
                    onClick={() => signIn('github', { callbackUrl: '/initial-health-form' })}
                  >
                    <Image src="/github-logo.svg" alt="GitHub" width={18} height={18} className="mr-2" />
                    GitHub
                  </Button>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    Already have an account?{" "}
                    <Link href="/login" className="text-primary font-medium hover:underline">
                      Sign in
                    </Link>
                  </p>
                </div>
              </form>
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  )
}

