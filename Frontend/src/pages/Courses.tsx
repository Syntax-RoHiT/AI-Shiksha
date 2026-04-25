import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  Plus,
  MoreVertical,
  Star,
  Users,
  PlayCircle,
  Edit,
  Copy,
  Trash2,
  Sparkles,
  Filter,
  LayoutGrid,
  List,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Course {
  id: string;
  title: string;
  thumbnail: string;
  status: "published" | "draft" | "archived";
  students: number;
  rating: number;
  lessons: number;
  price: number;
  revenue: number;
  lastUpdated: string;
}

const courses: Course[] = [
  {
    id: "1",
    title: "React Masterclass 2024",
    thumbnail: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&h=300&fit=crop",
    status: "published",
    students: 2456,
    rating: 4.9,
    lessons: 48,
    price: 79,
    revenue: 48920,
    lastUpdated: "2 days ago",
  },
  {
    id: "2",
    title: "JavaScript Fundamentals",
    thumbnail: "https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=400&h=300&fit=crop",
    status: "published",
    students: 3821,
    rating: 4.8,
    lessons: 62,
    price: 49,
    revenue: 76420,
    lastUpdated: "1 week ago",
  },
  {
    id: "3",
    title: "TypeScript Essentials",
    thumbnail: "https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=400&h=300&fit=crop",
    status: "published",
    students: 1234,
    rating: 4.7,
    lessons: 36,
    price: 59,
    revenue: 24680,
    lastUpdated: "3 days ago",
  },
  {
    id: "4",
    title: "Node.js Backend Development",
    thumbnail: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&h=300&fit=crop",
    status: "draft",
    students: 0,
    rating: 0,
    lessons: 24,
    price: 69,
    revenue: 0,
    lastUpdated: "1 day ago",
  },
  {
    id: "5",
    title: "CSS & Tailwind Mastery",
    thumbnail: "https://images.unsplash.com/photo-1507721999472-8ed4421c4af2?w=400&h=300&fit=crop",
    status: "draft",
    students: 0,
    rating: 0,
    lessons: 18,
    price: 39,
    revenue: 0,
    lastUpdated: "5 hours ago",
  },
  {
    id: "6",
    title: "Python for Beginners",
    thumbnail: "https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=400&h=300&fit=crop",
    status: "archived",
    students: 892,
    rating: 4.5,
    lessons: 42,
    price: 39,
    revenue: 15280,
    lastUpdated: "2 months ago",
  },
];

const statusStyles = {
  published: "bg-lms-emerald-light text-lms-emerald",
  draft: "bg-lms-amber-light text-lms-amber",
  archived: "bg-muted text-muted-foreground",
};

export default function Courses() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCourses = courses.filter((course) =>
    course.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout title="Courses" subtitle="Manage your courses and content">
      <div className="page-container">
        {/* Actions Bar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select defaultValue="all">
              <SelectTrigger className="w-[140px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center rounded-lg border border-border p-1">
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="icon"
                className="h-8 w-8"
                onClick={() => setViewMode("grid")}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="icon"
                className="h-8 w-8"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>

            <Button className="gap-2 bg-lms-purple hover:bg-lms-purple/90">
              <Sparkles className="h-4 w-4" />
              AI Generate
            </Button>

            <Button className="gap-2 bg-lms-blue hover:bg-lms-blue/90">
              <Plus className="h-4 w-4" />
              New Course
            </Button>
          </div>
        </div>

        {/* Courses Grid */}
        {viewMode === "grid" ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredCourses.map((course) => (
              <div
                key={course.id}
                className="group rounded-xl border border-border bg-card overflow-hidden transition-shadow hover:shadow-card-hover animate-fade-in"
              >
                <div className="relative aspect-video overflow-hidden">
                  <img
                    src={course.thumbnail}
                    alt={course.title}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100 flex items-center justify-center">
                    <Button variant="secondary" size="sm" className="gap-2">
                      <PlayCircle className="h-4 w-4" />
                      Preview
                    </Button>
                  </div>
                  <Badge className={cn("absolute right-3 top-3", statusStyles[course.status])}>
                    {course.status}
                  </Badge>
                </div>

                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-foreground line-clamp-2">{course.title}</h3>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Course
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Copy className="mr-2 h-4 w-4" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Sparkles className="mr-2 h-4 w-4 text-lms-purple" />
                          AI Enhance
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive focus:bg-destructive focus:text-destructive-foreground">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {course.students.toLocaleString()}
                    </span>
                    {course.rating > 0 && (
                      <span className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-lms-amber text-lms-amber" />
                        {course.rating}
                      </span>
                    )}
                    <span>{course.lessons} lessons</span>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                    <span className="text-lg font-bold text-foreground">₹{course.price}</span>
                    {course.revenue > 0 && (
                      <span className="text-sm text-lms-emerald">
                        ₹{course.revenue.toLocaleString()} earned
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead className="border-b border-border bg-muted/50">
                <tr>
                  <th className="table-header py-3 px-4 text-left">Course</th>
                  <th className="table-header py-3 px-4 text-left">Status</th>
                  <th className="table-header py-3 px-4 text-left">Students</th>
                  <th className="table-header py-3 px-4 text-left">Rating</th>
                  <th className="table-header py-3 px-4 text-left">Price</th>
                  <th className="table-header py-3 px-4 text-left">Revenue</th>
                  <th className="table-header py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredCourses.map((course) => (
                  <tr key={course.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={course.thumbnail}
                          alt={course.title}
                          className="h-12 w-20 rounded-lg object-cover"
                        />
                        <div>
                          <p className="font-medium text-foreground">{course.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {course.lessons} lessons • Updated {course.lastUpdated}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <Badge className={statusStyles[course.status]}>{course.status}</Badge>
                    </td>
                    <td className="py-4 px-4 text-sm">{course.students.toLocaleString()}</td>
                    <td className="py-4 px-4">
                      {course.rating > 0 ? (
                        <span className="flex items-center gap-1 text-sm">
                          <Star className="h-4 w-4 fill-lms-amber text-lms-amber" />
                          {course.rating}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="py-4 px-4 font-medium">₹{course.price}</td>
                    <td className="py-4 px-4 text-lms-emerald font-medium">
                      ₹{course.revenue.toLocaleString()}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Course
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Sparkles className="mr-2 h-4 w-4 text-lms-purple" />
                            AI Enhance
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive focus:bg-destructive focus:text-destructive-foreground">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
