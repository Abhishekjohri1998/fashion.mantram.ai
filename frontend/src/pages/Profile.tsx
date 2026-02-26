import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/api";
import { toast } from "sonner";
import { Loader2, Camera, User, Mail, Shield, Key } from "lucide-react";

const Profile = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || user.name || "");
      setEmail(user.email || "");
      setAvatarUrl(user.avatarUrl || "");
    }
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put("/users/profile", {
        displayName,
        name: displayName,
        avatarUrl,
      });
      toast.success("Profile updated successfully");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      return toast.error("Passwords do not match");
    }
    setLoading(true);
    try {
      await api.put("/users/profile", { password: newPassword });
      toast.success("Password updated successfully");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("image", file);

    setLoading(true);
    try {
      const { data } = await api.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';
      const fullUrl = `${serverUrl}${data.filePath}`;
      setAvatarUrl(fullUrl);
      await api.put("/users/profile", { avatarUrl: fullUrl });
      toast.success("Avatar updated");
    } catch (error: any) {
      toast.error("Upload failed");
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <div className="p-8 text-center">Please login to view profile.</div>;

  return (
    <div className="container max-w-4xl py-12 px-4 text-left">
      <div className="flex flex-col gap-8 text-left">
        <div>
          <h1 className="text-3xl font-display font-bold">Account Settings</h1>
          <p className="text-muted-foreground mt-2">Manage your account information and preferences.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-1">
            <Card>
              <CardHeader className="items-center text-center">
                <div className="relative group">
                  <Avatar className="w-24 h-24 border-2 border-primary/20 shadow-xl mx-auto">
                    <AvatarImage src={avatarUrl} />
                    <AvatarFallback className="text-xl font-bold bg-primary/10 text-primary">
                      {displayName?.charAt(0) || user.name?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <label htmlFor="avatar-upload" className="absolute bottom-0 right-0 p-1.5 bg-primary text-primary-foreground rounded-full cursor-pointer shadow-lg hover:scale-110 transition-transform">
                    <Camera className="w-4 h-4" />
                    <input id="avatar-upload" type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} disabled={loading} />
                  </label>
                </div>
                <CardTitle className="mt-4">{displayName || user.name}</CardTitle>
                <CardDescription className="flex items-center gap-1 justify-center">
                  <Mail className="w-3 h-3" /> {email}
                </CardDescription>
                {user.isAdmin && (
                  <Badge variant="secondary" className="mt-2 bg-primary/10 text-primary border-none">
                    <Shield className="w-3 h-3 mr-1" /> Administrator
                  </Badge>
                )}
              </CardHeader>
            </Card>
          </div>

          <div className="md:col-span-2 space-y-8">
            <Card className="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <form onSubmit={handleUpdateProfile}>
                <CardContent className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="displayName">Display Name</Label>
                    <Input id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Full Name" />
                  </div>
                  <div className="grid gap-2 text-muted-foreground opacity-70">
                    <Label>Email Address</Label>
                    <Input value={email} disabled className="bg-muted" />
                    <p className="text-[10px] italic">Email cannot be changed.</p>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" disabled={loading} className="glow-primary">
                    {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Save Changes
                  </Button>
                </CardFooter>
              </form>
            </Card>

            <Card className="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="w-5 h-5 text-primary" />
                  Security
                </CardTitle>
                <CardDescription>Update your password to keep your account secure.</CardDescription>
              </CardHeader>
              <form onSubmit={handleUpdatePassword}>
                <CardContent className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" variant="secondary" disabled={loading || !newPassword}>
                    Update Password
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
