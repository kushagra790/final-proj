"use client";
import { useState, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { BellIcon, LockClosedIcon, UserIcon } from "@heroicons/react/24/solid";
import { formatDistanceToNow, formatDate } from "date-fns";

export default function ProfilePage() {
  const { data: session, update } = useSession();
  const [userName, setUserName] = useState(session?.user?.name || "User");
  const [userEmail, setUserEmail] = useState(session?.user?.email || "admin@example.com");
  const userCreatedAt = session?.userCreatedAt || "N/A";
  const sessionCreatedAt = session?.sessionCreatedAt || "N/A";

  // Add useEffect to update state when session changes
  useEffect(() => {
    if (session?.user) {
      setUserName(session.user.name || "User");
      setUserEmail(session.user.email || "admin@example.com");
    }
  }, [session]);

  const [isEditing, setIsEditing] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const formVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
  };

  const handleSaveChanges = async () => {
    try {
      setIsLoading(true);
      setError("");
      setSuccess("");
      
      const response = await fetch('/api/user/edit', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: userName,
          email: userEmail,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }

      await update({
        name: userName,
        email: userEmail,
      });
      
      setSuccess('Profile updated successfully');
      setIsEditing(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordUpdate = async () => {
    try {
      setIsLoading(true);
      setError("");
      setSuccess("");
      
      if (newPassword !== confirmPassword) {
        throw new Error('New passwords do not match');
      }
      
      const response = await fetch('/api/user/edit', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update password');
      }
      
      setSuccess('Password updated successfully');
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div 
      className="w-full max-w-5xl mx-auto py-8 px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div 
        className="space-y-2 mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h1 className="text-3xl font-bold tracking-tight">Profile Settings</h1>
        <p className="text-muted-foreground">Manage your account preferences and settings.</p>
      </motion.div>

      <div className="grid gap-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="overflow-hidden">
            <CardHeader className="bg-muted/50 pb-8">
              <div className="flex flex-col md:flex-row md:items-center gap-6">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="relative"
                >
                  <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
                    <AvatarImage src="/placeholder.svg" alt={userName} />
                    <AvatarFallback>{userName.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <Button 
                    size="sm" 
                    className="absolute -bottom-2 -right-2 rounded-full h-8 w-8 p-0"
                    onClick={() => alert("Upload avatar functionality would go here")}
                  >
                    <UserIcon className="h-4 w-4" />
                  </Button>
                </motion.div>
                <div className="space-y-1">
                  <CardTitle className="text-2xl">{userName}</CardTitle>
                  <CardDescription className="text-base">{userEmail}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <Tabs defaultValue="personal" className="w-full">
                <TabsList className="grid grid-cols-3 mb-8">
                  <TabsTrigger value="personal" className="flex items-center justify-center gap-2">
                    <UserIcon className="h-4 w-4" />
                    <span>Personal Info</span>
                  </TabsTrigger>
                  <TabsTrigger value="notifications" className="flex items-center justify-center gap-2">
                    <BellIcon className="h-4 w-4" />
                    <span>Notifications</span>
                  </TabsTrigger>
                  <TabsTrigger value="security" className="flex items-center justify-center gap-2">
                    <LockClosedIcon className="h-4 w-4" />
                    <span>Security</span>
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="personal" className="space-y-6">
                  {isEditing ? (
                    <motion.div
                      variants={formVariants}
                      initial="hidden"
                      animate="visible"
                      className="space-y-4"
                    >
                      <div className="grid gap-3">
                        <Label htmlFor="name">Full Name</Label>
                        <Input id="name" defaultValue={userName} onChange={(e) => setUserName(e.target.value)}/>
                      </div>
                      <div className="grid gap-3">
                        <Label htmlFor="email">Email Address</Label>
                        <Input id="email" type="email" defaultValue={userEmail} onChange={(e) => setUserEmail(e.target.value)}/>
                      </div>
                      <div className="flex justify-end gap-3 pt-4">
                        <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                        <Button onClick={() => handleSaveChanges()}>Save Changes</Button>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      variants={formVariants}
                      initial="hidden"
                      animate="visible"
                      className="space-y-6"
                    >
                      <dl className="grid gap-4 text-sm sm:grid-cols-2">
                        <div className="space-y-1">
                          <dt className="text-muted-foreground">Full Name</dt>
                          <dd className="font-medium">{userName}</dd>
                        </div>
                        <div className="space-y-1">
                          <dt className="text-muted-foreground">Email Address</dt>
                          <dd className="font-medium">{userEmail}</dd>
                        </div>
                        <div className="space-y-1">
                          <dt className="text-muted-foreground">Member Since</dt>
                          <dd className="font-medium">
                            {userCreatedAt !== "N/A" 
                              ? formatDate(new Date(userCreatedAt), 'MMMM dd, yyyy')
                              : "N/A"
                            }
                          </dd>
                        </div>
                        <div className="space-y-1">
                          <dt className="text-muted-foreground">Last Login</dt>
                          <dd className="font-medium">
                            {sessionCreatedAt !== "N/A" 
                              ? formatDistanceToNow(new Date(sessionCreatedAt), { addSuffix: true })
                              : "N/A"
                            }
                          </dd>
                        </div>
                      </dl>
                      <div className="flex justify-end">
                        <Button 
                          onClick={() => setIsEditing(true)}
                          className="gap-2 bg-primary text-primary-foreground"
                        >
                          <UserIcon className="h-4 w-4" /> Edit Profile
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </TabsContent>
                
                <TabsContent value="notifications">
                  <motion.div
                    variants={formVariants}
                    initial="hidden"
                    animate="visible"
                    className="space-y-6"
                  >
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Communication Preferences</h3>
                      <div className="space-y-5">
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label htmlFor="email-notifications">Email Notifications</Label>
                            <p className="text-sm text-muted-foreground">Receive appointment reminders and updates</p>
                          </div>
                          <Switch id="email-notifications" defaultChecked />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label htmlFor="sms-notifications">SMS Notifications</Label>
                            <p className="text-sm text-muted-foreground">Get text messages for important alerts</p>
                          </div>
                          <Switch id="sms-notifications" />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label htmlFor="whatsapp-notifications">WhatsApp Notifications</Label>
                            <p className="text-sm text-muted-foreground">Receive messages via WhatsApp</p>
                          </div>
                          <Switch id="whatsapp-notifications" />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </TabsContent>
                
                <TabsContent value="security">
                  <motion.div
                    variants={formVariants}
                    initial="hidden"
                    animate="visible"
                    className="space-y-6"
                  >
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Password & Security</h3>
                      <div className="grid gap-3">
                        <Label htmlFor="current-password">Current Password</Label>
                        <Input 
                          id="current-password" 
                          type="password"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                        />
                      </div>
                      <div className="grid gap-3">
                        <Label htmlFor="new-password">New Password</Label>
                        <Input 
                          id="new-password" 
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                        />
                      </div>
                      <div className="grid gap-3">
                        <Label htmlFor="confirm-password">Confirm New Password</Label>
                        <Input 
                          id="confirm-password" 
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                      </div>
                      {error && (
                        <p className="text-sm text-red-500 mt-2">{error}</p>
                      )}
                      {success && (
                        <p className="text-sm text-green-500 mt-2">{success}</p>
                      )}
                      <div className="flex justify-end pt-4">
                        <Button 
                          className="gap-2"
                          onClick={handlePasswordUpdate}
                          disabled={isLoading}
                        >
                          <LockClosedIcon className="h-4 w-4" />
                          {isLoading ? 'Updating...' : 'Update Password'}
                        </Button>
                      </div>
                      
                      <div className="pt-6 border-t mt-8">
                        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                          <DialogTrigger asChild>
                            <Button variant="destructive" className="w-full sm:w-auto">Delete Account</Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Are you sure?</DialogTitle>
                              <DialogDescription>
                                This action cannot be undone. This will permanently delete your account and remove all your data from our servers.
                              </DialogDescription>
                            </DialogHeader>
                            <DialogFooter className="flex space-x-2 mt-4">
                              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                                Cancel
                              </Button>
                              <Button 
                                variant="destructive" 
                                onClick={() => {
                                  alert("Account would be deleted in a real app");
                                  setDeleteDialogOpen(false);
                                }}
                              >
                                Delete Account
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </motion.div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}

