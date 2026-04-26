import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { AdminDashboardLayout } from "@/components/layout/AdminDashboardLayout";
import {
  Search,
  Plus,
  MoreVertical,
  Ban,
  Shield,
  Users,
  UserCheck,
  UserX,
  Upload,
  Download,
  FileText,
  X,
  Trash2,
  UserCog,
  Loader2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

import Papa from "papaparse";
import { useUsers, useCreateUser, useBulkCreateUsers, useDeleteUser, useUpdateUserRole } from "@/hooks/useUsers";

export default function UsersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isCSVUploadOpen, setIsCSVUploadOpen] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [roleChangeUser, setRoleChangeUser] = useState<{ id: string; name: string; currentRole: string } | null>(null);
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    role: "student",
    password: "",
  });
  const [isUploadingCSV, setIsUploadingCSV] = useState(false);
  const { toast } = useToast();

  const { users: allUsers = [], isLoading } = useUsers();

  const createUserMutation = useCreateUser();
  const bulkCreateUsersMutation = useBulkCreateUsers();
  const deleteUserMutation = useDeleteUser();
  const updateUserRoleMutation = useUpdateUserRole();

  const tabFilteredUsers = allUsers.filter((user) => {
    if (activeTab === 'all') return true;
    const role = user.role.toLowerCase();
    if (activeTab === 'student') return role === 'student';
    if (activeTab === 'teacher') return role === 'teacher' || role === 'instructor';
    if (activeTab === 'admin') return role === 'admin' || role === 'super_admin' || role === 'franchise_admin';
    return false;
  });

  const filteredUsers = tabFilteredUsers.filter((user) => {
    return (
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const handleAddUser = async () => {
    if (!newUser.name || !newUser.email || !newUser.password) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      await createUserMutation.mutateAsync({
        name: newUser.name,
        email: newUser.email,
        password: newUser.password,
        role: newUser.role,
      });

      toast({
        title: "User Added",
        description: `${newUser.name} has been added as a ${newUser.role}.`,
      });

      setNewUser({ name: "", email: "", role: "student", password: "" });
      setIsAddUserOpen(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to create user. Please try again.",
        variant: "destructive",
      });
    }
  };


  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingCSV(true);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const { data, meta } = results;
          const requiredFields = ['name', 'email', 'role', 'password'];
          const missingFields = requiredFields.filter(f => !meta.fields?.includes(f));

          if (missingFields.length > 0) {
            toast({
              title: "Invalid Format",
              description: `Missing columns: ${missingFields.join(", ")}`,
              variant: "destructive",
            });
            setIsUploadingCSV(false);
            return;
          }

          const validUsers = data.filter((row: any) =>
            row.name && row.email && row.role && row.password &&
            row.password.length >= 6
          ) as any[];

          if (validUsers.length === 0) {
            toast({
              title: "No Valid Users",
              description: "Could not find any fully fleshed out rows (name, email, role, password).",
              variant: "destructive",
            });
            setIsUploadingCSV(false);
            return;
          }

          if (validUsers.length > 500) {
            toast({
              title: "File Too Large",
              description: "Maximum 500 users can be imported at once.",
              variant: "destructive",
            });
            setIsUploadingCSV(false);
            return;
          }

          await bulkCreateUsersMutation.mutateAsync({ users: validUsers });

          toast({
            title: "Import Successful",
            description: `${validUsers.length} users have been imported. They will receive welcome emails shortly.`,
          });

          setIsCSVUploadOpen(false);
        } catch (error: any) {
          toast({
            title: "Import Failed",
            description: error.response?.data?.message || "An error occurred during import.",
            variant: "destructive",
          });
        } finally {
          setIsUploadingCSV(false);
          if (e.target) e.target.value = '';
        }
      },
      error: (error) => {
        toast({
          title: "Parsing Error",
          description: error.message,
          variant: "destructive",
        });
        setIsUploadingCSV(false);
      }
    });
  };

  const downloadCSVTemplate = () => {
    const a = document.createElement("a");
    a.href = "/test_users.csv";
    a.download = "test_users.csv";
    a.click();
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map((u) => u.id));
    }
  };

  const handleSelectUser = (userId: string) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter((id) => id !== userId));
    } else {
      setSelectedUsers([...selectedUsers, userId]);
    }
  };

  const handleBulkDelete = async () => {
    if (!selectedUsers.length) return;
    if (!confirm(`Are you sure you want to delete ${selectedUsers.length} user(s)?`)) return;

    try {
      await Promise.all(
        selectedUsers.map((userId) => deleteUserMutation.mutateAsync(userId))
      );

      toast({
        title: "Users Deleted",
        description: `${selectedUsers.length} user(s) have been deleted.`,
      });
      setSelectedUsers([]);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete users. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleBulkRoleChange = (newRole: string) => {
    if (!selectedUsers.length) return;
    toast({
      title: "Roles Updated",
      description: `${selectedUsers.length} user(s) role changed to ${newRole}.`,
    });
    setSelectedUsers([]);
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to delete ${userName}?`)) return;

    try {
      await deleteUserMutation.mutateAsync(userId);
      toast({
        title: "User Deleted",
        description: `${userName} has been deleted.`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete user.",
        variant: "destructive",
      });
    }
  };

  const handleChangeRole = (userId: string, userName: string, currentRole: string) => {
    setRoleChangeUser({ id: userId, name: userName, currentRole });
  };

  const handleConfirmRoleChange = async (newRole: string) => {
    if (!roleChangeUser) return;

    try {
      await updateUserRoleMutation.mutateAsync({
        userId: roleChangeUser.id,
        role: newRole,
      });

      toast({
        title: "Role Updated",
        description: `${roleChangeUser.name}'s role has been changed to ${newRole}.`,
      });
      setRoleChangeUser(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update role.",
        variant: "destructive",
      });
    }
  };

  const getRoleColor = (role: string) => {
    const r = role.toLowerCase();
    if (r === "admin" || r === "super_admin" || r === "franchise_admin") return "border-red-500/30 text-red-600 bg-red-500/5";
    if (r === "instructor" || r === "teacher") return "border-purple-500/30 text-purple-600 bg-purple-500/5";
    return "border-emerald-500/30 text-emerald-600 bg-emerald-500/5"; // Student
  };

  return (
    <AdminDashboardLayout title="User Management" subtitle="Manage platform users and permissions">
      <div className="p-4 md:p-8 space-y-8 max-w-[1600px] mx-auto transition-all duration-700 ease-out animate-in fade-in slide-in-from-bottom-8">
        
        {/* Dynamic Header */}
        <div className="relative overflow-hidden rounded-none bg-zinc-950 p-8 shadow-2xl border border-white/10 group">
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/20 via-rose-500/10 to-orange-500/20 opacity-50 transition-opacity duration-1000 group-hover:opacity-70"></div>
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-red-500/30 blur-3xl transition-transform duration-1000 group-hover:scale-110"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white">
                Global Users
              </h2>
              <p className="text-sm md:text-lg text-white/60 font-medium max-w-xl">
                Manage roles, permissions, and accounts across the entire platform.
              </p>
            </div>
            
            {/* Actions Container */}
            <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                <Input
                  placeholder="Search by name or email..."
                  className="pl-9 h-12 bg-white/10 border-white/20 text-white placeholder:text-white/40 rounded-none focus-visible:ring-red-500 shadow-[0_0_40px_rgba(0,0,0,0.3)] backdrop-blur-md font-medium w-full"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* CSV Upload */}
              <Dialog open={isCSVUploadOpen} onOpenChange={setIsCSVUploadOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="h-12 rounded-none border-white/20 bg-white/5 text-white hover:bg-white/10 w-full sm:w-auto">
                    <Upload className="h-4 w-4 mr-2" />
                    Import CSV
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg rounded-none border border-black/10 dark:border-white/10">
                  <DialogHeader>
                    <DialogTitle className="font-black text-xl uppercase tracking-widest">Import Users</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-6 pt-4">
                    <div className="bg-zinc-50 dark:bg-zinc-900 border border-black/5 dark:border-white/5 rounded-none p-4 space-y-3">
                      <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-zinc-900 dark:text-white">
                        <FileText className="h-4 w-4 text-red-500" />
                        CSV Guidelines
                      </div>
                      <ul className="text-sm font-medium text-zinc-500 dark:text-zinc-400 space-y-2 list-disc pl-5">
                        <li>Headers required: <code className="bg-black/5 dark:bg-white/5 px-1 py-0.5 font-mono text-xs">name,email,role,password</code></li>
                        <li>Role options: <code className="bg-black/5 dark:bg-white/5 px-1 py-0.5 font-mono text-xs">student</code>, <code className="bg-black/5 dark:bg-white/5 px-1 py-0.5 font-mono text-xs">teacher</code>, <code className="bg-black/5 dark:bg-white/5 px-1 py-0.5 font-mono text-xs">admin</code></li>
                        <li>Max 500 rows per upload</li>
                      </ul>
                      <Button
                        variant="link"
                        size="sm"
                        className="gap-1 p-0 h-auto text-red-600 dark:text-red-400 hover:text-red-700 font-bold uppercase tracking-widest text-[10px]"
                        onClick={downloadCSVTemplate}
                      >
                        <Download className="h-3 w-3" />
                        Download Template
                      </Button>
                    </div>

                    <div className={`border-2 border-dashed rounded-none p-8 text-center transition-colors ${isUploadingCSV ? 'border-zinc-300 dark:border-zinc-700 opacity-50 pointer-events-none' : 'border-black/20 dark:border-white/20 hover:border-red-500'}`}>
                      <input
                        type="file"
                        accept=".csv"
                        onChange={handleCSVUpload}
                        className="hidden"
                        id="csv-upload"
                        disabled={isUploadingCSV}
                      />
                      <label htmlFor="csv-upload" className="cursor-pointer flex flex-col items-center">
                        <Upload className="h-10 w-10 text-zinc-400 mb-3" />
                        <p className="text-sm font-bold uppercase tracking-widest text-zinc-900 dark:text-white">
                          {isUploadingCSV ? "Processing CSV..." : "Click to upload"}
                        </p>
                      </label>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Add User Dialog */}
              <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
                <DialogTrigger asChild>
                  <Button className="h-12 rounded-none bg-white hover:bg-zinc-200 text-zinc-900 font-bold uppercase tracking-widest w-full sm:w-auto">
                    <Plus className="h-4 w-4 mr-2" />
                    Add User
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md rounded-none border border-black/10 dark:border-white/10">
                  <DialogHeader>
                    <DialogTitle className="font-black text-xl uppercase tracking-widest">Add New User</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-6 pt-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-widest">Full Name *</Label>
                      <Input
                        placeholder="John Doe"
                        className="rounded-none border-black/10 dark:border-white/10 h-10"
                        value={newUser.name}
                        onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-widest">Email Address *</Label>
                      <Input
                        type="email"
                        placeholder="john@example.com"
                        className="rounded-none border-black/10 dark:border-white/10 h-10"
                        value={newUser.email}
                        onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                      />
                    </div>
                    <div className="space-y-3">
                      <Label className="text-xs font-bold uppercase tracking-widest">Role *</Label>
                      <RadioGroup
                        value={newUser.role}
                        onValueChange={(value) => setNewUser({ ...newUser, role: value })}
                        className="grid grid-cols-3 gap-3"
                      >
                        <div>
                          <RadioGroupItem value="student" id="role-student" className="peer sr-only" />
                          <Label
                            htmlFor="role-student"
                            className="flex flex-col items-center justify-center rounded-none border border-black/10 dark:border-white/10 p-3 hover:bg-zinc-50 dark:hover:bg-zinc-900 peer-data-[state=checked]:border-red-500 peer-data-[state=checked]:bg-red-50 dark:peer-data-[state=checked]:bg-red-500/10 cursor-pointer font-bold text-xs uppercase tracking-widest text-center"
                          >
                            Student
                          </Label>
                        </div>
                        <div>
                          <RadioGroupItem value="teacher" id="role-teacher" className="peer sr-only" />
                          <Label
                            htmlFor="role-teacher"
                            className="flex flex-col items-center justify-center rounded-none border border-black/10 dark:border-white/10 p-3 hover:bg-zinc-50 dark:hover:bg-zinc-900 peer-data-[state=checked]:border-red-500 peer-data-[state=checked]:bg-red-50 dark:peer-data-[state=checked]:bg-red-500/10 cursor-pointer font-bold text-xs uppercase tracking-widest text-center"
                          >
                            Teacher
                          </Label>
                        </div>
                        <div>
                          <RadioGroupItem value="admin" id="role-admin" className="peer sr-only" />
                          <Label
                            htmlFor="role-admin"
                            className="flex flex-col items-center justify-center rounded-none border border-black/10 dark:border-white/10 p-3 hover:bg-zinc-50 dark:hover:bg-zinc-900 peer-data-[state=checked]:border-red-500 peer-data-[state=checked]:bg-red-50 dark:peer-data-[state=checked]:bg-red-500/10 cursor-pointer font-bold text-xs uppercase tracking-widest text-center"
                          >
                            Admin
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-widest">Password *</Label>
                      <Input
                        type="password"
                        placeholder="Min 8 characters"
                        className="rounded-none border-black/10 dark:border-white/10 h-10"
                        value={newUser.password}
                        onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                      />
                    </div>
                    <Button
                      className="w-full rounded-none h-12 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 font-bold uppercase tracking-widest"
                      onClick={handleAddUser}
                      disabled={createUserMutation.isPending}
                    >
                      {createUserMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      Create User
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        {/* Floating Glass Stats */}
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative group rounded-none bg-white/60 dark:bg-zinc-900/50 backdrop-blur-xl border border-black/5 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] transition-all duration-500 hover:-translate-y-1 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-400 to-blue-500 opacity-0 group-hover:opacity-10 transition-opacity duration-500"></div>
            <div className="relative p-6 flex flex-col h-full z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-none flex items-center justify-center shadow-sm bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 group-hover:scale-110 transition-transform duration-500">
                  <Users className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                </div>
              </div>
              <div className="mt-auto space-y-1">
                <p className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight">{allUsers.length}</p>
                <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">Total Users</p>
              </div>
            </div>
          </div>

          <div className="relative group rounded-none bg-white/60 dark:bg-zinc-900/50 backdrop-blur-xl border border-black/5 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] transition-all duration-500 hover:-translate-y-1 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-teal-500 opacity-0 group-hover:opacity-10 transition-opacity duration-500"></div>
            <div className="relative p-6 flex flex-col h-full z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-none flex items-center justify-center shadow-sm bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 group-hover:scale-110 transition-transform duration-500">
                  <UserCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>
              <div className="mt-auto space-y-1">
                <p className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight">{allUsers.length}</p>
                <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">Active Users</p>
              </div>
            </div>
          </div>

          <div className="relative group rounded-none bg-white/60 dark:bg-zinc-900/50 backdrop-blur-xl border border-black/5 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] transition-all duration-500 hover:-translate-y-1 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-400 to-fuchsia-500 opacity-0 group-hover:opacity-10 transition-opacity duration-500"></div>
            <div className="relative p-6 flex flex-col h-full z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-none flex items-center justify-center shadow-sm bg-purple-50 dark:bg-purple-500/10 border border-purple-100 dark:border-purple-500/20 group-hover:scale-110 transition-transform duration-500">
                  <Shield className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
              <div className="mt-auto space-y-1">
                <p className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight">{allUsers.filter((u) => u.role === "INSTRUCTOR" || u.role === "teacher").length}</p>
                <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">Instructors</p>
              </div>
            </div>
          </div>

          <div className="relative group rounded-none bg-white/60 dark:bg-zinc-900/50 backdrop-blur-xl border border-black/5 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] transition-all duration-500 hover:-translate-y-1 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-red-400 to-rose-500 opacity-0 group-hover:opacity-10 transition-opacity duration-500"></div>
            <div className="relative p-6 flex flex-col h-full z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-none flex items-center justify-center shadow-sm bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 group-hover:scale-110 transition-transform duration-500">
                  <UserX className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
              </div>
              <div className="mt-auto space-y-1">
                <p className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight">0</p>
                <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">Suspended</p>
              </div>
            </div>
          </div>
        </div>

        {/* Ledger */}
        <div className="bg-white/60 dark:bg-zinc-900/50 backdrop-blur-xl border border-black/5 dark:border-white/5 rounded-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="border-b border-black/5 dark:border-white/5 bg-white/40 dark:bg-zinc-950/40 p-0 overflow-x-auto hidden-scrollbar">
              <TabsList className="bg-transparent h-14 p-0 w-max min-w-full justify-start rounded-none">
                <TabsTrigger value="all" className="rounded-none h-full data-[state=active]:bg-black/5 dark:data-[state=active]:bg-white/5 data-[state=active]:border-b-2 data-[state=active]:border-red-500 data-[state=active]:shadow-none font-bold uppercase tracking-widest text-xs px-6">
                  All ({allUsers.length})
                </TabsTrigger>
                <TabsTrigger value="student" className="rounded-none h-full data-[state=active]:bg-black/5 dark:data-[state=active]:bg-white/5 data-[state=active]:border-b-2 data-[state=active]:border-emerald-500 data-[state=active]:shadow-none font-bold uppercase tracking-widest text-xs px-6">
                  Students ({allUsers.filter((u) => u.role === "STUDENT" || u.role === "student").length})
                </TabsTrigger>
                <TabsTrigger value="teacher" className="rounded-none h-full data-[state=active]:bg-black/5 dark:data-[state=active]:bg-white/5 data-[state=active]:border-b-2 data-[state=active]:border-purple-500 data-[state=active]:shadow-none font-bold uppercase tracking-widest text-xs px-6">
                  Teachers ({allUsers.filter((u) => u.role === "INSTRUCTOR" || u.role === "teacher").length})
                </TabsTrigger>
                <TabsTrigger value="admin" className="rounded-none h-full data-[state=active]:bg-black/5 dark:data-[state=active]:bg-white/5 data-[state=active]:border-b-2 data-[state=active]:border-red-500 data-[state=active]:shadow-none font-bold uppercase tracking-widest text-xs px-6">
                  Admins ({allUsers.filter((u) => ["admin", "super_admin", "franchise_admin"].includes(u.role?.toLowerCase())).length})
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value={activeTab} className="m-0 border-0 outline-none">
              
              {/* Bulk Actions Bar */}
              {selectedUsers.length > 0 && (
                <div className="bg-red-50 dark:bg-red-500/10 border-b border-red-200 dark:border-red-900/50 p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                      onCheckedChange={handleSelectAll}
                      className="border-red-500 data-[state=checked]:bg-red-500 data-[state=checked]:text-white rounded-none"
                    />
                    <span className="text-sm font-bold text-red-900 dark:text-red-200 uppercase tracking-widest">
                      {selectedUsers.length} Selected
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="rounded-none border-red-200 dark:border-red-900/50 bg-white/50 dark:bg-zinc-900/50 hover:bg-white dark:hover:bg-zinc-900 text-xs font-bold uppercase tracking-widest gap-2">
                          <UserCog className="h-3 w-3" />
                          Change Role
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="rounded-none border border-black/10 dark:border-white/10">
                        <DropdownMenuItem className="cursor-pointer text-xs uppercase tracking-widest font-bold" onClick={() => handleBulkRoleChange("student")}>Student</DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer text-xs uppercase tracking-widest font-bold" onClick={() => handleBulkRoleChange("teacher")}>Teacher</DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer text-xs uppercase tracking-widest font-bold text-red-600" onClick={() => handleBulkRoleChange("admin")}>Admin</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Button variant="destructive" size="sm" className="rounded-none text-xs font-bold uppercase tracking-widest gap-2" onClick={handleBulkDelete}>
                      <Trash2 className="h-3 w-3" />
                      Delete
                    </Button>
                  </div>
                </div>
              )}

              <div className="p-0">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center h-64 space-y-4">
                    <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-sm font-bold text-zinc-500 tracking-widest uppercase">Loading Directory...</p>
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 space-y-4 text-center px-4">
                    <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-none flex items-center justify-center mb-2">
                      <Users className="h-8 w-8 text-zinc-400" />
                    </div>
                    <p className="text-lg font-bold text-zinc-900 dark:text-white">No users found</p>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">No matching users for this criteria.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-black/5 dark:divide-white/5">
                    {filteredUsers.map((user) => (
                      <div key={user.id} className="group p-4 md:p-6 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                        
                        {/* Left: Checkbox & Info */}
                        <div className="flex items-center gap-4 flex-1 min-w-0 md:min-w-[300px]">
                          <Checkbox
                            checked={selectedUsers.includes(user.id)}
                            onCheckedChange={() => handleSelectUser(user.id)}
                            className="rounded-none"
                          />
                          <Avatar className="h-12 w-12 rounded-none border border-black/10 dark:border-white/10 shadow-sm">
                            <AvatarImage src={user.avatar_url} className="rounded-none" />
                            <AvatarFallback className="bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-black rounded-none">
                              {user.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="space-y-1">
                            <h4 className="font-bold text-zinc-900 dark:text-white text-base truncate max-w-[200px] md:max-w-md">
                              {user.name}
                            </h4>
                            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 truncate">
                              {user.email}
                            </p>
                          </div>
                        </div>

                        {/* Middle: Badges */}
                        <div className="flex items-center gap-2 py-2 md:py-0 border-y md:border-y-0 border-black/5 dark:border-white/5 md:px-6">
                          <Badge variant="outline" className={cn("rounded-none uppercase tracking-widest text-[10px] px-2 py-1 border", getRoleColor(user.role))}>
                            {user.role === "INSTRUCTOR" ? "TEACHER" : user.role}
                          </Badge>
                          <Badge variant="outline" className="rounded-none uppercase tracking-widest text-[10px] px-2 py-1 border border-emerald-500/30 text-emerald-600 bg-emerald-500/5">
                            Active
                          </Badge>
                        </div>

                        {/* Right: Actions */}
                        <div className="flex items-center justify-end gap-4 shrink-0 min-w-[120px]">
                          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest hidden lg:block">
                            Joined {new Date(user.created_at).toLocaleDateString()}
                          </span>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="rounded-none border border-transparent hover:border-black/10 dark:hover:border-white/10 shrink-0 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="rounded-none border-black/10 dark:border-white/10 min-w-[160px]">
                              <DropdownMenuItem className="gap-2 cursor-pointer text-xs font-bold uppercase tracking-widest" onClick={() => handleChangeRole(user.id, user.name, user.role)}>
                                <Shield className="h-3 w-3" />
                                Change Role
                              </DropdownMenuItem>
                              <DropdownMenuItem className="gap-2 cursor-pointer text-xs font-bold uppercase tracking-widest text-red-600 focus:bg-red-50 focus:text-red-700 dark:focus:bg-red-500/10" onClick={() => handleDeleteUser(user.id, user.name)}>
                                <Ban className="h-3 w-3" />
                                Delete User
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Role Change Dialog */}
      <Dialog open={!!roleChangeUser} onOpenChange={(open) => !open && setRoleChangeUser(null)}>
        <DialogContent className="sm:max-w-md rounded-none border border-black/10 dark:border-white/10">
          <DialogHeader>
            <DialogTitle className="font-black text-xl uppercase tracking-widest">Update Role</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 pt-4">
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Select a new role for <strong className="text-zinc-900 dark:text-white font-bold">{roleChangeUser?.name}</strong>.
            </p>
            <RadioGroup
              value={roleChangeUser?.currentRole.toLowerCase() === 'instructor' ? 'teacher' : roleChangeUser?.currentRole.toLowerCase()}
              onValueChange={handleConfirmRoleChange}
              className="grid grid-cols-1 sm:grid-cols-3 gap-3"
            >
              <div>
                <RadioGroupItem value="student" id="change-role-student" className="peer sr-only" />
                <Label
                  htmlFor="change-role-student"
                  className="flex flex-col items-center justify-center rounded-none border border-black/10 dark:border-white/10 p-4 hover:bg-zinc-50 dark:hover:bg-zinc-900 peer-data-[state=checked]:border-emerald-500 peer-data-[state=checked]:bg-emerald-50 dark:peer-data-[state=checked]:bg-emerald-500/10 cursor-pointer font-bold text-xs uppercase tracking-widest text-center"
                >
                  Student
                </Label>
              </div>
              <div>
                <RadioGroupItem value="teacher" id="change-role-teacher" className="peer sr-only" />
                <Label
                  htmlFor="change-role-teacher"
                  className="flex flex-col items-center justify-center rounded-none border border-black/10 dark:border-white/10 p-4 hover:bg-zinc-50 dark:hover:bg-zinc-900 peer-data-[state=checked]:border-purple-500 peer-data-[state=checked]:bg-purple-50 dark:peer-data-[state=checked]:bg-purple-500/10 cursor-pointer font-bold text-xs uppercase tracking-widest text-center"
                >
                  Teacher
                </Label>
              </div>
              <div>
                <RadioGroupItem value="admin" id="change-role-admin" className="peer sr-only" />
                <Label
                  htmlFor="change-role-admin"
                  className="flex flex-col items-center justify-center rounded-none border border-black/10 dark:border-white/10 p-4 hover:bg-zinc-50 dark:hover:bg-zinc-900 peer-data-[state=checked]:border-red-500 peer-data-[state=checked]:bg-red-50 dark:peer-data-[state=checked]:bg-red-500/10 cursor-pointer font-bold text-xs uppercase tracking-widest text-center"
                >
                  Admin
                </Label>
              </div>
            </RadioGroup>
          </div>
        </DialogContent>
      </Dialog>
    </AdminDashboardLayout>
  );
}
