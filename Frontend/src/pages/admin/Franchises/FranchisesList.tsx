
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Edit, Trash2, Loader2, Building2 } from "lucide-react";

interface Franchise {
    id: string;
    name: string;
    lms_name: string | null;
    domain: string;
    logo_url: string | null;
    primary_color: string | null;
    is_active: boolean;
    domain_verified: boolean;
    _count?: { users: number; courses: number; enrollments: number };
}

interface FranchisesListProps {
    franchises: Franchise[];
    isLoading: boolean;
    onDelete: (franchise: Franchise) => void;
    onRefresh: () => void;
}

export default function FranchisesList({ franchises, isLoading, onDelete, onRefresh }: FranchisesListProps) {
    const [searchQuery, setSearchQuery] = useState("");

    const filteredFranchises = franchises.filter(
        (f) =>
            f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            f.domain.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <Card className="shadow-sm">
            <CardHeader className="pb-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <CardTitle className="text-lg font-medium">All Franchises</CardTitle>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by name or domain..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 w-full sm:w-64"
                            />
                        </div>
                        {/* We inject the Add Modal here or in parent. Parent is better for layout control, but table header is common place. 
                            Let's keep it clean and allow parent to pass children if needed, or just pass the modal trigger.
                            Actually, passing onRefresh to the modal is key.
                        */}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                {isLoading ? (
                    <div className="flex items-center justify-center py-16">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : filteredFranchises.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
                        <Building2 className="h-10 w-10 text-muted-foreground/40" />
                        <div>
                            <p className="font-medium">No franchises found</p>
                            <p className="text-sm text-muted-foreground">Try adjusting your search.</p>
                        </div>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/50">
                                    <TableHead className="w-[300px]">Franchise</TableHead>
                                    <TableHead className="hidden md:table-cell">Domain</TableHead>
                                    <TableHead className="text-center">Users</TableHead>
                                    <TableHead className="text-center hidden sm:table-cell">Courses</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredFranchises.map((franchise) => (
                                    <TableRow key={franchise.id} className="hover:bg-muted/50 transition-colors">
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-9 w-9 border">
                                                    {franchise.logo_url && <AvatarImage src={franchise.logo_url} alt={franchise.name} />}
                                                    <AvatarFallback
                                                        className="text-xs font-bold text-white"
                                                        style={{ backgroundColor: franchise.primary_color || "#6366f1" }}
                                                    >
                                                        {franchise.name.substring(0, 2).toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <div className="font-semibold">{franchise.name}</div>
                                                    <div className="text-xs text-muted-foreground">{franchise.lms_name}</div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell">
                                            <div className="flex items-center gap-2">
                                                <code className="bg-muted px-1.5 py-0.5 rounded text-xs">{franchise.domain}</code>
                                                {franchise.domain_verified && (
                                                    <Badge variant="outline" className="text-[10px] h-5 border-green-200 text-green-700 bg-green-50">Verified</Badge>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">{(franchise._count?.users || 0).toLocaleString()}</TableCell>
                                        <TableCell className="text-center hidden sm:table-cell">{(franchise._count?.courses || 0).toLocaleString()}</TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={franchise.is_active ? "default" : "destructive"}
                                                className={`text-[10px] ${franchise.is_active ? "bg-green-100 text-green-700 hover:bg-green-100" : "bg-red-100 text-red-700 hover:bg-red-100"}`}
                                            >
                                                {franchise.is_active ? "Active" : "Suspended"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                    onClick={() => onDelete(franchise)}
                                                    title="Delete Franchise"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
