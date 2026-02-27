import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AdminDashboardLayout } from "@/components/layout/AdminDashboardLayout";
import {
  Search,
  Plus,
  MoreVertical,
  Mail,
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
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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

  // Fetch all users to ensure correct stats counts
  const { users: allUsers = [], isLoading } = useUsers();

  const createUserMutation = useCreateUser();
  const bulkCreateUsersMutation = useBulkCreateUsers();
  const deleteUserMutation = useDeleteUser();
  const updateUserRoleMutation = useUpdateUserRole();

  // Filter users based on active tab
  const tabFilteredUsers = allUsers.filter((user) => {
    if (activeTab === 'all') return true;
    const role = user.role.toLowerCase();
    if (activeTab === 'student') return role === 'student';
    if (activeTab === 'teacher') return role === 'teacher' || role === 'instructor';
    if (activeTab === 'admin') return role === 'admin' || role === 'super_admin' || role === 'franchise_admin';
    return false;
  });

  // Filter users based on search
  const filteredUsers = tabFilteredUsers.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
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

          // Validate row data loosely before sending to backend
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
          if (e.target) e.target.value = ''; // Reset input
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

  const handleSendEmail = (user: any) => {
    toast({
      title: "Email Sent",
      description: `Email sent to ${user.email}`,
    });
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

  const stats = [
    { label: "Total Users", value: allUsers.length, icon: Users, color: "text-primary" },
    { label: "Active", value: allUsers.length, icon: UserCheck, color: "text-emerald-600" },
    { label: "Teachers", value: allUsers.filter((u) => u.role === "INSTRUCTOR" || u.role === "teacher").length, icon: Shield, color: "text-primary" },
    { label: "Suspended", value: 0, icon: UserX, color: "text-destructive" },
  ];

  return (
    <AdminDashboardLayout title="User Management" subtitle="Manage platform users and permissions">
      <div className="space-y-4 md:space-y-6">
        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <Card key={stat.label} className="border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-muted">
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-semibold">{stat.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-3 justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search users by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-background"
            />
          </div>
          <div className="flex gap-2">
            {/* CSV Upload Dialog */}
            <Dialog open={isCSVUploadOpen} onOpenChange={setIsCSVUploadOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Upload className="h-4 w-4" />
                  <span className="hidden sm:inline">Import CSV</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Import Users from CSV</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  {/* Guidelines */}
                  <div className="bg-muted/50 border border-border rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <FileText className="h-4 w-4 text-primary" />
                      CSV Format Guidelines
                    </div>
                    <ul className="text-sm text-muted-foreground space-y-1.5 ml-6 list-disc">
                      <li>First row must contain headers: <code className="bg-muted px-1 rounded text-xs">name,email,role,password</code></li>
                      <li>Role must be one of: <code className="bg-muted px-1 rounded text-xs">student</code>, <code className="bg-muted px-1 rounded text-xs">teacher</code>, or <code className="bg-muted px-1 rounded text-xs">admin</code></li>
                      <li>Email addresses must be unique and valid</li>
                      <li>Password must be at least 8 characters</li>
                      <li>Maximum 500 users per upload</li>
                    </ul>
                    <Button
                      variant="link"
                      size="sm"
                      className="gap-1 p-0 h-auto text-primary"
                      onClick={downloadCSVTemplate}
                    >
                      <Download className="h-3 w-3" />
                      Download Template CSV
                    </Button>
                  </div>

                  {/* Upload Area */}
                  <div className={`border-2 border-dashed border-border rounded-lg p-8 text-center transition-colors ${isUploadingCSV ? 'opacity-50 pointer-events-none' : 'hover:border-primary/50'}`}>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleCSVUpload}
                      className="hidden"
                      id="csv-upload"
                      disabled={isUploadingCSV}
                    />
                    <label htmlFor="csv-upload" className="cursor-pointer">
                      <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                      <p className="text-sm font-medium">
                        {isUploadingCSV ? "Processing CSV... Please wait." : "Click to upload or drag and drop"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">CSV files only (max 500 rows)</p>
                    </label>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Add User Dialog */}
            <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Add User</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Add New User</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      placeholder="Enter full name"
                      value={newUser.name}
                      onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter email address"
                      value={newUser.email}
                      onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-3 pt-2">
                    <Label className="text-sm font-medium">Role *</Label>
                    <RadioGroup
                      value={newUser.role}
                      onValueChange={(value) => setNewUser({ ...newUser, role: value })}
                      className="grid grid-cols-1 sm:grid-cols-3 gap-3"
                    >
                      <div>
                        <RadioGroupItem value="student" id="role-student" className="peer sr-only" />
                        <Label
                          htmlFor="role-student"
                          className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                        >
                          Student
                        </Label>
                      </div>
                      <div>
                        <RadioGroupItem value="teacher" id="role-teacher" className="peer sr-only" />
                        <Label
                          htmlFor="role-teacher"
                          className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                        >
                          Teacher
                        </Label>
                      </div>
                      <div>
                        <RadioGroupItem value="admin" id="role-admin" className="peer sr-only" />
                        <Label
                          htmlFor="role-admin"
                          className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                        >
                          Admin
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password *</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Minimum 8 characters"
                      value={newUser.password}
                      onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setIsAddUserOpen(false)}
                      disabled={createUserMutation.isPending}
                    >
                      Cancel
                    </Button>
                    <Button
                      className="flex-1 bg-primary hover:bg-primary/90"
                      onClick={handleAddUser}
                      disabled={createUserMutation.isPending}
                    >
                      {createUserMutation.isPending ? "Adding..." : "Add User"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Bulk Actions Bar */}
        {selectedUsers.length > 0 && (
          <Card className="border-primary/50 bg-primary/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm font-medium">
                  {selectedUsers.length} user{selectedUsers.length !== 1 ? "s" : ""} selected
                </p>
                <div className="flex gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-2">
                        <UserCog className="h-4 w-4" />
                        Change Role
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => handleBulkRoleChange("student")}>
                        Student
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleBulkRoleChange("teacher")}>
                        Teacher
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleBulkRoleChange("admin")}>
                        Admin
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleBulkDelete}
                    className="gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedUsers([])}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs and Table */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-muted/50">
            <TabsTrigger value="all">All ({allUsers.length})</TabsTrigger>
            <TabsTrigger value="student">Students ({allUsers.filter((u) => u.role === "STUDENT" || u.role === "student").length})</TabsTrigger>
            <TabsTrigger value="teacher">Teachers ({allUsers.filter((u) => u.role === "INSTRUCTOR" || u.role === "teacher").length})</TabsTrigger>
            <TabsTrigger value="admin">Admins ({allUsers.filter((u) => ["admin", "super_admin", "franchise_admin", "admin"].includes(u.role?.toLowerCase())).length})</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4">
            <Card className="border-border/50">
              <CardContent className="p-0">
                <Table className="hidden md:table">
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                      <TableHead className="font-semibold">User</TableHead>
                      <TableHead className="font-semibold">Role</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="font-semibold hidden md:table-cell">Joined</TableHead>
                      <TableHead className="font-semibold hidden lg:table-cell">Last Active</TableHead>
                      <TableHead className="text-right font-semibold">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedUsers.includes(user.id)}
                            onCheckedChange={() => handleSelectUser(user.id)}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                              <AvatarImage src={user.avatar_url} />
                              <AvatarFallback className="bg-primary/10 text-primary text-sm">
                                {user.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-sm">{user.name}</p>
                              <p className="text-xs text-muted-foreground">{user.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={
                              user.role === "ADMIN" || user.role === "admin"
                                ? "bg-amber-100 text-amber-700 hover:bg-amber-100"
                                : user.role === "INSTRUCTOR" || user.role === "teacher"
                                  ? "bg-primary/10 text-primary hover:bg-primary/10"
                                  : "bg-muted text-muted-foreground"
                            }
                          >
                            {user.role === "INSTRUCTOR" ? "Instructor" : user.role.charAt(0).toUpperCase() + user.role.slice(1).toLowerCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
                          >
                            Active
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm hidden md:table-cell">
                          {new Date(user.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm hidden lg:table-cell">
                          -
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem className="gap-2" onClick={() => handleSendEmail(user)}>
                                <Mail className="h-4 w-4" />
                                Send Email
                              </DropdownMenuItem>
                              <DropdownMenuItem className="gap-2" onClick={() => handleChangeRole(user.id, user.name, user.role)}>
                                <Shield className="h-4 w-4" />
                                Change Role
                              </DropdownMenuItem>
                              <DropdownMenuItem className="gap-2 text-destructive" onClick={() => handleDeleteUser(user.id, user.name)}>
                                <Ban className="h-4 w-4" />
                                Delete User
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Mobile Responsive Cards View */}
                <div className="md:hidden flex flex-col">
                  {filteredUsers.length > 0 ? (
                    <>
                      <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50 bg-muted/20">
                        <Checkbox
                          id="mobile-select-all"
                          checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                          onCheckedChange={handleSelectAll}
                        />
                        <Label htmlFor="mobile-select-all" className="text-sm font-medium cursor-pointer">
                          Select All Users
                        </Label>
                      </div>
                      <div className="flex flex-col gap-3 p-4">
                        {filteredUsers.map((user) => (
                          <Card key={user.id} className="border border-border/50 shadow-sm">
                            <CardContent className="p-4 space-y-4">
                              <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                  <Checkbox
                                    checked={selectedUsers.includes(user.id)}
                                    onCheckedChange={() => handleSelectUser(user.id)}
                                  />
                                  <Avatar className="h-10 w-10">
                                    <AvatarImage src={user.avatar_url} />
                                    <AvatarFallback className="bg-primary/10 text-primary font-medium">
                                      {user.name.charAt(0)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex flex-col overflow-hidden">
                                    <span className="font-semibold text-sm line-clamp-1">{user.name}</span>
                                    <span className="text-xs text-muted-foreground line-clamp-1">{user.email}</span>
                                  </div>
                                </div>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem className="gap-2" onClick={() => handleSendEmail(user)}>
                                      <Mail className="h-4 w-4" />
                                      Send Email
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="gap-2" onClick={() => handleChangeRole(user.id, user.name, user.role)}>
                                      <Shield className="h-4 w-4" />
                                      Change Role
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="gap-2 text-destructive" onClick={() => handleDeleteUser(user.id, user.name)}>
                                      <Ban className="h-4 w-4" />
                                      Delete User
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                              <div className="flex flex-wrap items-center gap-2 pl-[3.25rem]">
                                <Badge
                                  variant="secondary"
                                  className={
                                    user.role === "ADMIN" || user.role === "admin"
                                      ? "bg-amber-100 text-amber-700"
                                      : user.role === "INSTRUCTOR" || user.role === "teacher"
                                        ? "bg-primary/10 text-primary"
                                        : "bg-muted text-muted-foreground"
                                  }
                                >
                                  {user.role === "INSTRUCTOR" ? "Instructor" : user.role.charAt(0).toUpperCase() + user.role.slice(1).toLowerCase()}
                                </Badge>
                                <Badge
                                  variant="secondary"
                                  className="bg-emerald-100 text-emerald-700"
                                >
                                  Active
                                </Badge>
                                <span className="text-xs text-muted-foreground ml-auto">
                                  {new Date(user.created_at).toLocaleDateString()}
                                </span>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-10 text-muted-foreground">
                      No users found.
                    </div>
                  )}
                </div>

              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Role Change Dialog */}
        <Dialog open={!!roleChangeUser} onOpenChange={(open) => !open && setRoleChangeUser(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Change User Role</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Change role for <span className="font-medium text-foreground">{roleChangeUser?.name}</span>
              </p>
              <div className="space-y-3 pt-2">
                <Label className="text-sm font-medium">New Role</Label>
                <RadioGroup
                  value={roleChangeUser?.currentRole}
                  onValueChange={handleConfirmRoleChange}
                  className="grid grid-cols-1 sm:grid-cols-3 gap-3"
                >
                  <div>
                    <RadioGroupItem value="STUDENT" id="change-role-student" className="peer sr-only" />
                    <Label
                      htmlFor="change-role-student"
                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                    >
                      Student
                    </Label>
                  </div>
                  <div>
                    <RadioGroupItem value="INSTRUCTOR" id="change-role-teacher" className="peer sr-only" />
                    <Label
                      htmlFor="change-role-teacher"
                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                    >
                      Instructor
                    </Label>
                  </div>
                  <div>
                    <RadioGroupItem value="ADMIN" id="change-role-admin" className="peer sr-only" />
                    <Label
                      htmlFor="change-role-admin"
                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                    >
                      Admin
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminDashboardLayout>
  );
}
