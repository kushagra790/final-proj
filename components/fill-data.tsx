"use client"

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "./ui/card";
import { Button } from "./ui/button";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Plus, Activity, Heart, ChartLine, ClipboardCheck, Smile, ChevronRight } from "lucide-react";
import Image from "next/image";

export default function FillData() {
  const router = useRouter();
  
  const benefits = [
    { 
      icon: <Heart className="h-5 w-5 text-rose-500" />, 
      title: "Personalized Health Insights",
      description: "Get customized recommendations based on your health profile"
    },
    { 
      icon: <Activity className="h-5 w-5 text-indigo-500" />, 
      title: "Track Your Progress",
      description: "Monitor improvements in your health metrics over time"
    },
    { 
      icon: <ChartLine className="h-5 w-5 text-amber-500" />, 
      title: "Data-Driven Goals",
      description: "Set achievable targets based on your current health status"
    },
  ];

  return (
    <div className="container max-w-6xl mx-auto py-10 px-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="overflow-hidden border-none shadow-xl bg-gradient-to-br from-background via-background to-background/90">
          <CardHeader className="pb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                >
                  <CardTitle className="text-3xl md:text-4xl font-bold bg-gradient-to-br from-primary to-primary/70 bg-clip-text text-transparent">
                    Complete Your Health Profile
                  </CardTitle>
                </motion.div>
                <CardDescription className="text-base mt-2">
                  We need some information to create your personalized health dashboard
                </CardDescription>
              </div>
              
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  size="lg"
                  onClick={() => router.push("/initial-health-form")}
                  className="bg-primary hover:bg-primary/90 text-white font-medium gap-2 px-6 h-12 text-base shadow-lg shadow-primary/20"
                >
                  <Plus className="h-5 w-5" />
                  Start Health Profile
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </motion.div>
            </div>
          </CardHeader>
          
          <CardContent className="pb-8">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <div className="relative bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl overflow-hidden p-6 h-full">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
                  <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -ml-10 -mb-10"></div>
                  
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4, duration: 0.8 }}
                    className="relative z-10"
                  >
                    <h3 className="text-xl font-semibold mb-4 flex items-center">
                      <ClipboardCheck className="mr-2 h-5 w-5 text-primary" />
                      Why Complete Your Profile?
                    </h3>
                    
                    <ul className="space-y-4">
                      {benefits.map((benefit, i) => (
                        <motion.li 
                          key={i}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.5 + (i * 0.1), duration: 0.5 }}
                          className="flex gap-3"
                        >
                          <div className="mt-1 bg-background rounded-full p-1.5 shadow-sm">
                            {benefit.icon}
                          </div>
                          <div>
                            <h4 className="font-medium text-foreground">{benefit.title}</h4>
                            <p className="text-muted-foreground text-sm">{benefit.description}</p>
                          </div>
                        </motion.li>
                      ))}
                    </ul>
                    
                    <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="bg-green-500/10 text-green-500 p-1 rounded-full">
                        <Smile className="h-4 w-4" />
                      </div>
                      <span>Takes less than 5 minutes to complete</span>
                    </div>
                  </motion.div>
                </div>
              </div>
              
              <div className="hidden md:block relative h-full">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3, duration: 0.6 }}
                  className="relative h-[340px] w-full rounded-2xl overflow-hidden shadow-2xl"
                >
                  {/* Replace with your own image or illustration */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center">
                    <div className="text-center text-white">
                      <div className="flex justify-center mb-4">
                        <div className="relative">
                          <Heart className="h-16 w-16" />
                          <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                            className="absolute inset-0 flex items-center justify-center"
                          >
                            <Heart className="h-16 w-16 text-white/20" />
                          </motion.div>
                        </div>
                      </div>
                      <h3 className="text-2xl font-bold mb-2">Your Health Journey</h3>
                      <p className="max-w-xs mx-auto">
                        Track, analyze, and improve your wellbeing with our comprehensive health dashboard
                      </p>
                    </div>
                  </div>
                </motion.div>
                
                <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-primary/20 blur-3xl rounded-full z-[-1]"></div>
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="border-t pt-6 pb-8 flex flex-col sm:flex-row justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex -space-x-3">
                {[...Array(4)].map((_, i) => (
                  <div 
                    key={i} 
                    className="w-8 h-8 rounded-full border-2 border-background bg-primary/10 flex items-center justify-center"
                  >
                    <span className="w-2 h-2 rounded-full bg-primary"></span>
                  </div>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                Join <span className="font-medium text-foreground">2,546</span> users who have completed their health profile
              </p>
            </div>
            
            <Button
              variant="outline"
              onClick={() => router.push("/learn-more")}
              className="sm:self-end"
            >
              Learn More
            </Button>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
