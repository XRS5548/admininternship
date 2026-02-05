'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Internship, InternshipFilters } from '@/types/internship';
import { ApiResponse } from '@/types/domain';
import { 
  Search, 
  Filter, 
  Calendar, 
  MapPin, 
  Monitor, 
  Building, 
  CheckCircle, 
  Loader2,
  IndianRupee,
  Eye,
  Edit,
  Trash2,
  Plus
} from 'lucide-react';
import { format, isAfter, isBefore } from 'date-fns';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export function Internships() {
  const router = useRouter();
  const [internships, setInternships] = useState<Internship[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<InternshipFilters>({});
  const [uniqueDomains, setUniqueDomains] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedInternships, setSelectedInternships] = useState<number[]>([]);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);

  useEffect(() => {
    fetchInternships();
    fetchUniqueDomains();
  }, [filters]);

  const fetchInternships = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams();
      if (filters.domain && filters.domain !== 'all') params.append('domain', filters.domain);
      if (filters.mode && filters.mode !== 'all') params.append('mode', filters.mode);
      if (filters.minPrice !== undefined) params.append('minPrice', filters.minPrice.toString());
      if (filters.maxPrice !== undefined) params.append('maxPrice', filters.maxPrice.toString());
      if (filters.search) params.append('search', filters.search);
      if (filters.hasCertificate !== undefined) params.append('hasCertificate', filters.hasCertificate.toString());

      const response = await fetch(`/api/internships?${params}`);
      const result: ApiResponse<Internship[]> = await response.json();
      
      if (result.success && result.data) {
        setInternships(result.data);
        setSelectedInternships([]);
      }
    } catch (error) {
      console.error('Error fetching internships:', error);
      toast.error('Failed to load internships');
    } finally {
      setLoading(false);
    }
  };

  const fetchUniqueDomains = async () => {
    try {
      const response = await fetch('/api/internships');
      const result: ApiResponse<Internship[]> = await response.json();
      
      if (result.success && result.data) {
        const domains = Array.from(new Set(result.data.map(i => i.domain).filter(Boolean)));
        setUniqueDomains(domains);
      }
    } catch (error) {
      console.error('Error fetching domains:', error);
    }
  };

  const handleFilterChange = (key: keyof InternshipFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({});
    setSelectedInternships([]);
  };

  const getStatusBadge = (internship: Internship) => {
    const startDate = new Date(internship.start_date);
    const endDate = new Date(internship.end_date);
    const today = new Date();

    if (isAfter(today, endDate)) {
      return <Badge variant="destructive">Expired</Badge>;
    } else if (isBefore(today, startDate)) {
      return <Badge variant="secondary">Upcoming</Badge>;
    } else {
      return <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy');
  };

  const calculateDuration = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 30) {
      return `${diffDays} days`;
    } else {
      const months = Math.floor(diffDays / 30);
      const days = diffDays % 30;
      return `${months} month${months > 1 ? 's' : ''}${days > 0 ? ` ${days} days` : ''}`;
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this internship? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(id);
    try {
      const response = await fetch(`/api/internships/${id}`, {
        method: 'DELETE',
      });

      const result: ApiResponse<null> = await response.json();

      if (result.success) {
        toast.success('Internship deleted successfully');
        setInternships(prev => prev.filter(internship => internship.id !== id));
      } else {
        throw new Error(result.error || 'Failed to delete internship');
      }
    } catch (error) {
      console.error('Error deleting internship:', error);
      toast.error('Failed to delete internship');
    } finally {
      setIsDeleting(null);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedInternships.length === 0) {
      toast.error('No internships selected');
      return;
    }

    if (!confirm(`Are you sure you want to delete ${selectedInternships.length} selected internship(s)? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch('/api/internships/bulk', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids: selectedInternships }),
      });

      const result: ApiResponse<null> = await response.json();

      if (result.success) {
        toast.success(`${selectedInternships.length} internship(s) deleted successfully`);
        setInternships(prev => prev.filter(internship => !selectedInternships.includes(internship.id)));
        setSelectedInternships([]);
      } else {
        throw new Error(result.error || 'Failed to delete internships');
      }
    } catch (error) {
      console.error('Error deleting internships:', error);
      toast.error('Failed to delete internships');
    }
  };

  const toggleSelectAll = () => {
    if (selectedInternships.length === internships.length) {
      setSelectedInternships([]);
    } else {
      setSelectedInternships(internships.map(internship => internship.id));
    }
  };

  const toggleSelectInternship = (id: number) => {
    setSelectedInternships(prev =>
      prev.includes(id)
        ? prev.filter(internshipId => internshipId !== id)
        : [...prev, id]
    );
  };

  const handleEdit = (id: number) => {
    router.push(`/internships/${id}/edit`);
  };

  const handleView = (id: number) => {
    router.push(`/internships/${id}`);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header with Actions */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Internships Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage and monitor all internships
          </p>
        </div>
        
        <div className="flex gap-2">
          {selectedInternships.length > 0 && (
            <Button 
              variant="destructive" 
              onClick={handleBulkDelete}
              disabled={isDeleting !== null}
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Delete Selected ({selectedInternships.length})
            </Button>
          )}
          <Button asChild>
            <Link href="/internships/create">
              <Plus className="h-4 w-4 mr-2" />
              Add New Internship
            </Link>
          </Button>
        </div>
      </div>

      {/* Filters Bar */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Filters</CardTitle>
          <CardDescription>Narrow down internships based on your preferences</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search internships..."
                  value={filters.search || ''}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Quick Filters */}
            <div className="flex flex-wrap gap-2">
              <Select
                value={filters.domain || 'all'}
                onValueChange={(value) => handleFilterChange('domain', value === 'all' ? undefined : value)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Domains" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Domains</SelectItem>
                  {uniqueDomains.map((domain) => (
                    <SelectItem key={domain} value={domain}>
                      {domain}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filters.mode || 'all'}
                onValueChange={(value) => handleFilterChange('mode', value === 'all' ? undefined : value)}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="All Modes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Modes</SelectItem>
                  <SelectItem value="virtual">Virtual</SelectItem>
                  <SelectItem value="physical">Physical</SelectItem>
                </SelectContent>
              </Select>

              <Sheet open={showFilters} onOpenChange={setShowFilters}>
                <SheetTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    More Filters
                    {Object.keys(filters).filter(key => 
                      filters[key as keyof InternshipFilters] !== undefined && 
                      filters[key as keyof InternshipFilters] !== 'all'
                    ).length > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        {Object.keys(filters).filter(key => 
                          filters[key as keyof InternshipFilters] !== undefined && 
                          filters[key as keyof InternshipFilters] !== 'all'
                        ).length}
                      </Badge>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
                  <SheetHeader>
                    <SheetTitle>Advanced Filters</SheetTitle>
                    <SheetDescription>
                      Apply additional filters to find specific internships
                    </SheetDescription>
                  </SheetHeader>
                  
                  <div className="space-y-6 py-6">
                    {/* Price Range Filter */}
                    <div className="space-y-3">
                      <Label>Price Range (₹)</Label>
                      <div className="space-y-4">
                        <Slider
                          defaultValue={[0, 50000]}
                          max={100000}
                          step={1000}
                          value={[filters.minPrice || 0, filters.maxPrice || 100000]}
                          onValueChange={([min, max]) => {
                            handleFilterChange('minPrice', min);
                            handleFilterChange('maxPrice', max);
                          }}
                          className="my-4"
                        />
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>₹{filters.minPrice || 0}</span>
                          <span>₹{filters.maxPrice || 100000}</span>
                        </div>
                      </div>
                    </div>

                    {/* Certificate Filter */}
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="certificate"
                        checked={filters.hasCertificate || false}
                        onCheckedChange={(checked) => 
                          handleFilterChange('hasCertificate', checked === true)
                        }
                      />
                      <Label htmlFor="certificate" className="cursor-pointer">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4" />
                          <span>Certificate Provided</span>
                        </div>
                      </Label>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-4">
                      <Button
                        variant="outline"
                        onClick={clearFilters}
                        className="flex-1"
                      >
                        Clear All Filters
                      </Button>
                      <Button
                        onClick={() => setShowFilters(false)}
                        className="flex-1"
                      >
                        Apply Filters
                      </Button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>

              <Button
                variant="outline"
                onClick={clearFilters}
                disabled={Object.keys(filters).length === 0}
              >
                Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : internships.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No Internships Found</CardTitle>
            <CardDescription>
              {Object.keys(filters).length > 0 
                ? 'Try adjusting your filters' 
                : 'No internships available. Add a new internship to get started.'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/internships/create">
                Add New Internship
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Stats and Bulk Actions */}
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="text-sm text-muted-foreground">
              Showing {internships.length} internship{internships.length !== 1 ? 's' : ''}
              {selectedInternships.length > 0 && (
                <span className="ml-2 text-primary">
                  • {selectedInternships.length} selected
                </span>
              )}
            </div>
            
            {selectedInternships.length > 0 && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedInternships([])}
                >
                  Clear Selection
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleSelectAll}
                >
                  {selectedInternships.length === internships.length ? 'Deselect All' : 'Select All'}
                </Button>
              </div>
            )}
          </div>

          {/* Internships Table */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={internships.length > 0 && selectedInternships.length === internships.length}
                          onCheckedChange={toggleSelectAll}
                          aria-label="Select all"
                        />
                      </TableHead>
                      <TableHead className="min-w-[200px]">Title & Domain</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Mode</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Certificate</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {internships.map((internship) => (
                      <TableRow key={internship.id} className="group">
                        <TableCell>
                          <Checkbox
                            checked={selectedInternships.includes(internship.id)}
                            onCheckedChange={() => toggleSelectInternship(internship.id)}
                            aria-label={`Select ${internship.title}`}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium line-clamp-1">
                              {internship.title}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {internship.domain}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-sm">
                              <Calendar className="h-3 w-3" />
                              {formatDate(internship.start_date)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {calculateDuration(internship.start_date, internship.end_date)}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {internship.mode === 'virtual' ? (
                              <Monitor className="h-4 w-4" />
                            ) : (
                              <Building className="h-4 w-4" />
                            )}
                            <span className="capitalize">{internship.mode}</span>
                          </div>
                          {internship.location && (
                            <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                              <MapPin className="h-3 w-3" />
                              {internship.location}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 font-medium">
                            <IndianRupee className="h-4 w-4" />
                            {internship.price.toLocaleString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(internship)}
                        </TableCell>
                        <TableCell>
                          {internship.certificate ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              {internship.certificate_title || 'Yes'}
                            </Badge>
                          ) : (
                            <Badge variant="outline">No</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleView(internship.id)}
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(internship.id)}
                              title="Edit"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(internship.id)}
                              disabled={isDeleting === internship.id}
                              title="Delete"
                            >
                              {isDeleting === internship.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
              <div className="text-sm text-muted-foreground w-full text-center">
                Showing {internships.length} of {internships.length} internships
              </div>
            </CardFooter>
          </Card>
        </>
      )}
    </div>
  );
}