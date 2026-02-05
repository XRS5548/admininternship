'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Plus, X, Loader2, Upload, Image as ImageIcon, CalendarIcon } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { format } from 'date-fns';
import { toast } from 'sonner';
import Image from 'next/image';

// Define the form interface
interface InternshipFormValues {
  title: string;
  description: string;
  domain: string;
  start_date: Date | undefined;
  end_date: Date | undefined;
  price: number;
  banner_url: string;
  mode: 'virtual' | 'physical';
  location: string;
  skills: Array<{
    name: string;
    level: 'Basic' | 'Intermediate' | 'Advanced';
  }>;
  certificate: boolean;
  certificate_title: string;
}

const defaultSkills = [
  { name: '', level: 'Basic' as const }
];

interface Domain {
  id: number;
  name: string;
}

export function CreateInternship() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loadingDomains, setLoadingDomains] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch domains for dropdown
  useEffect(() => {
    if (open) {
      fetchDomains();
    }
  }, [open]);

  const fetchDomains = async () => {
    try {
      setLoadingDomains(true);
      const response = await fetch('/api/domains');
      const result = await response.json();
      
      if (result.success && result.data) {
        setDomains(result.data);
      }
    } catch (error) {
      console.error('Error fetching domains:', error);
      toast.error('Failed to load domains');
    } finally {
      setLoadingDomains(false);
    }
  };

  const form = useForm<InternshipFormValues>({
    defaultValues: {
      title: '',
      description: '',
      domain: '',
      price: 0,
      banner_url: '',
      mode: 'virtual',
      location: '',
      skills: defaultSkills,
      certificate: false,
      certificate_title: '',
    },
  });

  const { control, handleSubmit, reset, setValue, watch, formState, trigger, setError, clearErrors } = form;
  const bannerUrl = watch('banner_url');
  const mode = watch('mode');
  const certificate = watch('certificate');
  const startDate = watch('start_date');
  const endDate = watch('end_date');

  // Manual validation function
  const validateForm = (data: InternshipFormValues): boolean => {
    const newErrors: Record<string, string> = {};

    // Title validation
    if (!data.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (data.title.length < 5) {
      newErrors.title = 'Title must be at least 5 characters';
    } else if (data.title.length > 200) {
      newErrors.title = 'Title must be less than 200 characters';
    }

    // Description validation
    if (!data.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (data.description.length < 50) {
      newErrors.description = 'Description must be at least 50 characters';
    } else if (data.description.length > 2000) {
      newErrors.description = 'Description must be less than 2000 characters';
    }

    // Domain validation
    if (!data.domain.trim()) {
      newErrors.domain = 'Domain is required';
    } else if (data.domain.length < 2) {
      newErrors.domain = 'Domain must be at least 2 characters';
    }

    // Start date validation
    if (!data.start_date) {
      newErrors.start_date = 'Start date is required';
    }

    // End date validation
    if (!data.end_date) {
      newErrors.end_date = 'End date is required';
    } else if (data.start_date && data.end_date <= data.start_date) {
      newErrors.end_date = 'End date must be after start date';
    }

    // Price validation
    if (data.price < 0) {
      newErrors.price = 'Price cannot be negative';
    } else if (data.price > 1000000) {
      newErrors.price = 'Price is too high';
    }

    // Mode validation
    if (!data.mode) {
      newErrors.mode = 'Mode is required';
    }

    // Location validation for physical mode
    if (data.mode === 'physical' && !data.location.trim()) {
      newErrors.location = 'Location is required for physical internships';
    }

    // Banner URL validation (optional)
    if (data.banner_url && !isValidUrl(data.banner_url)) {
      newErrors.banner_url = 'Please enter a valid URL';
    }

    // Skills validation
    const validSkills = data.skills.filter(skill => skill.name.trim() !== '');
    if (validSkills.length > 0) {
      validSkills.forEach((skill, index) => {
        if (!skill.name.trim()) {
          newErrors[`skills.${index}.name`] = 'Skill name is required';
        }
      });
    }

    // Certificate validation
    if (data.certificate && !data.certificate_title.trim()) {
      newErrors.certificate_title = 'Certificate title is required when certificate is enabled';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Helper function to validate URLs
  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  // Cloudinary upload function
  const uploadToCloudinary = async (file: File): Promise<string> => {
    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || '');
      formData.append('folder', 'internships');

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      return data.secure_url;
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      throw new Error('Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  // Handle file selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please select a valid image file (JPEG, PNG, GIF, WEBP)');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    // Create preview
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);

    try {
      // Upload to Cloudinary
      const cloudinaryUrl = await uploadToCloudinary(file);
      
      // Set the form value
      setValue('banner_url', cloudinaryUrl, { shouldValidate: true });
      clearErrors('banner_url');
      toast.success('Banner uploaded successfully!');
      
      // Clean up preview URL
      URL.revokeObjectURL(previewUrl);
      setImagePreview(null);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to upload image');
      setImagePreview(null);
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Handle remove image
  const handleRemoveImage = () => {
    setValue('banner_url', '', { shouldValidate: true });
    clearErrors('banner_url');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const onSubmit = async (data: InternshipFormValues) => {
    // Clear previous errors
    setErrors({});
    
    // Validate form
    if (!validateForm(data)) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/internships/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          start_date: data.start_date ? format(data.start_date, 'yyyy-MM-dd') : null,
          end_date: data.end_date ? format(data.end_date, 'yyyy-MM-dd') : null,
          skills: data.skills?.filter(skill => skill.name.trim() !== ''),
          location: mode === 'virtual' ? null : data.location
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create internship');
      }

      if (result.success) {
        toast.success('Internship created successfully!');
        reset();
        setOpen(false);
        setImagePreview(null);
        setErrors({});
        router.refresh(); // Refresh the page
      } else {
        throw new Error(result.error || 'Failed to create internship');
      }
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'An error occurred while creating the internship');
      console.error('Error creating internship:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const addSkill = () => {
    const currentSkills = form.getValues('skills') || [];
    form.setValue('skills', [...currentSkills, { name: '', level: 'Basic' }]);
  };

  const removeSkill = (index: number) => {
    const currentSkills = form.getValues('skills') || [];
    const newSkills = currentSkills.filter((_, i) => i !== index);
    form.setValue('skills', newSkills);
  };

  const calculateDuration = () => {
    const start = form.getValues('start_date');
    const end = form.getValues('end_date');
    
    if (!start || !end) return null;
    
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

  const duration = calculateDuration();

  // Get error message for a specific field
  const getErrorMessage = (fieldName: string): string | undefined => {
    return errors[fieldName];
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Internship
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Internship</DialogTitle>
          <DialogDescription>
            Add a new internship opportunity. Fill in all required fields.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Title */}
              <FormField
                control={control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g., Full Stack Developer Intern" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage>
                      {getErrorMessage('title')}
                    </FormMessage>
                  </FormItem>
                )}
              />

              {/* Domain */}
              <FormField
                control={control}
                name="domain"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Domain *</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                      disabled={loadingDomains}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={loadingDomains ? "Loading domains..." : "Select domain"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {loadingDomains ? (
                          <div className="py-6 text-center">
                            <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
                            <p className="text-sm text-muted-foreground">Loading domains...</p>
                          </div>
                        ) : domains.length > 0 ? (
                          domains.map((domain) => (
                            <SelectItem key={domain.id} value={domain.name}>
                              {domain.name}
                            </SelectItem>
                          ))
                        ) : (
                          <div className="py-2 text-center text-sm text-muted-foreground">
                            No domains found. Create a domain first.
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage>
                      {getErrorMessage('domain')}
                    </FormMessage>
                  </FormItem>
                )}
              />
            </div>

            {/* Description */}
            <FormField
              control={control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description *</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe the internship role, responsibilities, learning outcomes..."
                      className="min-h-30"
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Be detailed about what the intern will learn and do
                  </FormDescription>
                  <FormMessage>
                    {getErrorMessage('description')}
                  </FormMessage>
                </FormItem>
              )}
            />

            {/* Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Start Date */}
              <FormField
                control={control}
                name="start_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Start Date *</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage>
                      {getErrorMessage('start_date')}
                    </FormMessage>
                  </FormItem>
                )}
              />

              {/* End Date */}
              <FormField
                control={control}
                name="end_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>End Date *</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => {
                            if (!startDate) return date < new Date();
                            return date <= startDate;
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    {duration && (
                      <FormDescription className="text-green-600 font-medium">
                        Duration: {duration}
                      </FormDescription>
                    )}
                    <FormMessage>
                      {getErrorMessage('end_date')}
                    </FormMessage>
                  </FormItem>
                )}
              />
            </div>

            {/* Price and Mode */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Price */}
              <FormField
                control={control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price (₹) *</FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormDescription>
                      Enter 0 for free internship
                    </FormDescription>
                    <FormMessage>
                      {getErrorMessage('price')}
                    </FormMessage>
                  </FormItem>
                )}
              />

              {/* Mode */}
              <FormField
                control={control}
                name="mode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mode *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select mode" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="virtual">Virtual</SelectItem>
                        <SelectItem value="physical">Physical</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage>
                      {getErrorMessage('mode')}
                    </FormMessage>
                  </FormItem>
                )}
              />
            </div>

            {/* Location (only for physical mode) */}
            {mode === 'physical' && (
              <FormField
                control={control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g., Bangalore, Karnataka"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage>
                      {getErrorMessage('location')}
                    </FormMessage>
                  </FormItem>
                )}
              />
            )}

            {/* Banner Image Upload */}
            <div className="space-y-4">
              <FormLabel>Banner Image</FormLabel>
              
              {/* Image Preview */}
              {(bannerUrl || imagePreview) && (
                <div className="relative group">
                  <div className="w-full h-48 rounded-lg overflow-hidden border relative">
                    <img
                      src={imagePreview || bannerUrl}
                      alt="Preview"
                      className="object-cover"
                      
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={handleRemoveImage}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {/* Upload Area */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  id="banner-upload"
                />
                
                {isUploading ? (
                  <div className="flex flex-col items-center justify-center py-8">
                    <Loader2 className="h-10 w-10 animate-spin text-primary mb-2" />
                    <p className="text-sm text-muted-foreground">Uploading image...</p>
                  </div>
                ) : (
                  <label htmlFor="banner-upload" className="cursor-pointer">
                    <div className="flex flex-col items-center justify-center py-8">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                        {bannerUrl ? (
                          <ImageIcon className="h-6 w-6 text-primary" />
                        ) : (
                          <Upload className="h-6 w-6 text-primary" />
                        )}
                      </div>
                      <p className="font-medium mb-1">
                        {bannerUrl ? 'Change Banner' : 'Upload Banner'}
                      </p>
                      <p className="text-sm text-muted-foreground mb-3">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-xs text-muted-foreground">
                        PNG, JPG, GIF, WEBP up to 5MB
                      </p>
                    </div>
                  </label>
                )}
              </div>

              {/* URL Input as fallback */}
              <FormField
                control={control}
                name="banner_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Or enter image URL</FormLabel>
                    <FormControl>
                      <div className="flex gap-2">
                        <Input 
                          placeholder="https://res.cloudinary.com/..."
                          {...field}
                          value={field.value || ''}
                          onChange={(e) => {
                            field.onChange(e);
                            setImagePreview(null);
                          }}
                        />
                        {bannerUrl && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleRemoveImage}
                          >
                            Clear
                          </Button>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage>
                      {getErrorMessage('banner_url')}
                    </FormMessage>
                  </FormItem>
                )}
              />
            </div>

            {/* Skills Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Skills Required</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addSkill}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Skill
                </Button>
              </div>
              
              {(form.watch('skills') || []).map((skill, index) => (
                <div key={index} className="flex gap-3 items-start p-3 border rounded-lg">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Skill Name */}
                    <FormField
                      control={control}
                      name={`skills.${index}.name`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className={index === 0 ? '' : 'sr-only'}>
                            Skill Name
                          </FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="e.g., React, Python, AWS" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage>
                            {getErrorMessage(`skills.${index}.name`)}
                          </FormMessage>
                        </FormItem>
                      )}
                    />

                    {/* Skill Level */}
                    <FormField
                      control={control}
                      name={`skills.${index}.level`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className={index === 0 ? '' : 'sr-only'}>
                            Level
                          </FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select level" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Basic">Basic</SelectItem>
                              <SelectItem value="Intermediate">Intermediate</SelectItem>
                              <SelectItem value="Advanced">Advanced</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  {/* Remove Skill Button */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeSkill(index)}
                    disabled={(form.watch('skills') || []).length <= 1}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Remove skill</span>
                  </Button>
                </div>
              ))}
              
              {(form.watch('skills') || []).length === 0 && (
                <div className="text-center py-4 border rounded-lg">
                  <p className="text-muted-foreground">No skills added yet</p>
                  <p className="text-sm text-muted-foreground">
                    Add skills that interns will learn or use
                  </p>
                </div>
              )}
            </div>

            {/* Certificate Section */}
            <div className="space-y-4 border rounded-lg p-4">
              <FormField
                control={control}
                name="certificate"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Provide Certificate</FormLabel>
                      <FormDescription>
                        Will a certificate be provided upon completion?
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              {certificate && (
                <FormField
                  control={control}
                  name="certificate_title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Certificate Title *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., Certificate of Completion in Web Development"
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        The title that will appear on the certificate
                      </FormDescription>
                      <FormMessage>
                        {getErrorMessage('certificate_title')}
                      </FormMessage>
                    </FormItem>
                  )}
                />
              )}
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  reset();
                  setOpen(false);
                  setImagePreview(null);
                  setErrors({});
                }}
                disabled={isSubmitting || isUploading}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting || isUploading || formState.isSubmitting}
              >
                {(isSubmitting || formState.isSubmitting) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Create Internship
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}