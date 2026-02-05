'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Domain } from '@/types/domain';
import { 
  Edit, 
  Trash2, 
  Eye,
  MoreVertical,
  ExternalLink,
  Sparkles,
  Users
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import Image from 'next/image';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export interface DomainTableProps {
  domains: Domain[];
  onDelete?: (id: number) => void;
}

export function DomainTable({ domains, onDelete }: DomainTableProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState<number | null>(null);

  const getProficiencyColor = (proficiency: string) => {
    switch (proficiency) {
      case 'Beginner': return 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100';
      case 'Intermediate': return 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100';
      case 'Advanced': return 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100';
      case 'Expert': return 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100';
      default: return 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100';
    }
  };

  const handleEdit = (id: number) => {
    router.push(`/domains/${id}`);
  };

  const handleDelete = async (id: number) => {
    setIsDeleting(id);
    try {
      const response = await fetch(`/api/domains/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Domain deleted successfully!');
        if (onDelete) {
          onDelete(id);
        }
      } else {
        throw new Error(result.error || 'Failed to delete domain');
      }
    } catch (error) {
      console.error('Error deleting domain:', error);
      toast.error('Failed to delete domain. Please try again.');
    } finally {
      setIsDeleting(null);
      setShowDeleteDialog(null);
    }
  };

  const handleView = (id: number) => {
    router.push(`/domains/${id}`);
  };

  return (
    <>
      <div className="rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/50 dark:bg-gray-800/50 hover:bg-gray-50/50">
              <TableHead className="w-[80px]">ID</TableHead>
              <TableHead className="min-w-[200px]">Domain</TableHead>
              <TableHead className="min-w-[300px]">Description</TableHead>
              <TableHead className="min-w-[150px]">Skills</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {domains.map((domain) => (
              <TableRow 
                key={domain.id} 
                className="group hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                      <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                        {domain.id}
                      </span>
                    </div>
                  </div>
                </TableCell>
                
                <TableCell>
                  <div className="flex items-start gap-3">
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={domain.image || '/placeholder-domain.jpg'}
                        alt={domain.name}
                        className="object-cover"
                        sizes="48px"
                      />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {domain.name}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs border-blue-200 text-blue-700 bg-blue-50">
                          Domain
                        </Badge>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Users className="h-3 w-3" />
                          <span>{domain.skills.length} skills</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </TableCell>
                
                <TableCell>
                  <div className="max-w-[300px]">
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {domain.description}
                    </p>
                  </div>
                </TableCell>
                
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {domain.skills.slice(0, 3).map((skill, index) => (
                      <TooltipProvider key={index}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge 
                              variant="outline"
                              className={`text-xs px-2 py-1 ${getProficiencyColor(skill.proficiency)}`}
                            >
                              {skill.name}
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="flex items-center gap-1">
                              <Sparkles className="h-3 w-3" />
                              <span>Level: {skill.proficiency}</span>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ))}
                    {domain.skills.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{domain.skills.length - 3}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleView(domain.id)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          View Details
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleEdit(domain.id)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          Edit Domain
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-red-50 hover:text-red-600"
                            onClick={() => setShowDeleteDialog(domain.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          Delete Domain
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => handleView(domain.id)}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEdit(domain.id)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Domain
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => setShowDeleteDialog(domain.id)}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Domain
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <ExternalLink className="mr-2 h-4 w-4" />
                          View Internships
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog !== null} onOpenChange={(open) => !open && setShowDeleteDialog(null)}>
        {showDeleteDialog !== null && (
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <Trash2 className="h-5 w-5 text-red-500" />
                Delete Domain
              </AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete{' '}
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {domains.find(d => d.id === showDeleteDialog)?.name}
                </span>
                ? This action cannot be undone. All associated data will be permanently removed.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting !== null}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => handleDelete(showDeleteDialog)}
                disabled={isDeleting !== null}
                className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
              >
                {isDeleting === showDeleteDialog ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                    Deleting...
                  </>
                ) : (
                  'Delete Domain'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        )}
      </AlertDialog>
    </>
  );
}