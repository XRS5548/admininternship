'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Loader2,
  ArrowLeft,
  Save,
  Plus,
  X,
  Image as ImageIcon,
  Upload,
  Calendar,
  MapPin,
  Monitor,
  Building,
  IndianRupee,
  CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';
import Link from 'next/link';

interface Skill {
  name: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
}

interface Internship {
  id: number;
  title: string;
  description?: string;
  domain?: string;
  start_date: string;
  end_date: string;
  price: number;
  banner_url?: string;
  mode: 'virtual' | 'physical';
  location?: string;
  skills?: Skill[];
  certificate: boolean;
  certificate_title?: string;
  created_at: string;
}

export default function EditInternshipPage() {
  const router = useRouter();
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id || '';

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    domain: '',
    start_date: '',
    end_date: '',
    price: '',
    banner_url: '',
    mode: 'virtual' as 'virtual' | 'physical',
    location: '',
    skills: [{ name: '', level: 'beginner' as const }],
    certificate: false,
    certificate_title: ''
  });

  useEffect(() => {
    if (id) {
      fetchInternship();
    }
  }, [id]);

  const fetchInternship = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/internships/${id}`);
      
      

      const result = await response.json();

      if (result.success && result.data) {
        const internship = result.data;
        setFormData({
          title: internship.title || '',
          description: internship.description || '',
          domain: internship.domain || '',
          start_date: internship.start_date ? new Date(internship.start_date).toISOString().split('T')[0] : '',
          end_date: internship.end_date ? new Date(internship.end_date).toISOString().split('T')[0] : '',
          price: internship.price ? internship.price.toString() : '',
          banner_url: internship.banner_url || '',
          mode: internship.mode || 'virtual',
          location: internship.location || '',
          skills: internship.skills && Array.isArray(internship.skills) && internship.skills.length > 0 
            ? internship.skills 
            : [{ name: '', level: 'beginner' as const }],
          certificate: internship.certificate || false,
          certificate_title: internship.certificate_title || ''
        });
      } else {
        toast.error(result.error || 'Failed to load internship');
        router.push('/internships');
      }
    } catch (error) {
      console.error('Error fetching internship:', error);
      toast.error('Failed to load internship');
      router.push('/internships');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Title validation
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length < 3) {
      newErrors.title = 'Title must be at least 3 characters';
    }

    // Description validation
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    }

    // Start date validation
    if (!formData.start_date) {
      newErrors.start_date = 'Start date is required';
    }

    // End date validation
    if (!formData.end_date) {
      newErrors.end_date = 'End date is required';
    } else if (formData.start_date && formData.end_date) {
      const start = new Date(formData.start_date);
      const end = new Date(formData.end_date);
      if (end <= start) {
        newErrors.end_date = 'End date must be after start date';
      }
    }

    // Price validation
    if (!formData.price) {
      newErrors.price = 'Price is required';
    } else if (isNaN(Number(formData.price)) || Number(formData.price) < 0) {
      newErrors.price = 'Price must be a valid positive number';
    }

    // Mode validation
    if (!formData.mode) {
      newErrors.mode = 'Mode is required';
    }

    // Skills validation
    const validSkills = formData.skills.filter(skill => skill.name.trim() !== '');
    if (validSkills.length === 0) {
      newErrors.skills = 'At least one skill is required';
    }

    // Certificate title validation if certificate is checked
    if (formData.certificate && !formData.certificate_title.trim()) {
      newErrors.certificate_title = 'Certificate title is required when certificate is provided';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

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
      
      // Update form data
      setFormData(prev => ({ ...prev, banner_url: cloudinaryUrl }));
      clearError('banner_url');
      toast.success('Image uploaded successfully!');
      
      // Clean up preview URL
      URL.revokeObjectURL(previewUrl);
      setImagePreview(null);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to upload image');
      setImagePreview(null);
    }
  };

  const handleRemoveImage = () => {
    setFormData(prev => ({ ...prev, banner_url: '' }));
    clearError('banner_url');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    clearError(name);
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    clearError(name);
  };

  const handleSkillChange = (index: number, field: keyof Skill, value: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.map((skill, i) => 
        i === index ? { ...skill, [field]: value } : skill
      )
    }));
    clearError(`skills.${index}.${field}`);
  };

  const addSkill = () => {
    setFormData(prev => ({
      ...prev,
      skills: [...prev.skills, { name: '', level: 'beginner' as const }]
    }));
  };

  const removeSkill = (index: number) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index)
    }));
  };

  const clearError = (fieldName: string) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!id) {
      toast.error('Internship ID is missing');
      return;
    }
    
    // Clear previous errors
    setErrors({});
    
    // Validate form
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setIsSubmitting(true);

    try {
      // Filter out empty skills
      const filteredSkills = formData.skills.filter(skill => skill.name.trim() !== '');

      const response = await fetch(`/api/internships/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          domain: formData.domain || undefined,
          start_date: formData.start_date,
          end_date: formData.end_date,
          price: parseFloat(formData.price),
          banner_url: formData.banner_url || undefined,
          mode: formData.mode,
          location: formData.location || undefined,
          skills: filteredSkills.length > 0 ? filteredSkills : undefined,
          certificate: formData.certificate,
          certificate_title: formData.certificate_title || undefined
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Internship updated successfully!');
        router.push('/internships');
        router.refresh();
      } else {
        throw new Error(result.error || 'Failed to update internship');
      }
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'An error occurred while updating the internship');
      console.error('Error updating internship:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/internships')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Internships
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Edit Internship</h1>
            <p className="text-muted-foreground mt-2">
              Update internship information
            </p>
          </div>
        </div>
      </div>

      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>Internship Details</CardTitle>
          <CardDescription>
            Update the internship information below
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="e.g., Web Development Internship"
                  className={errors.title ? 'border-red-500' : ''}
                />
                {errors.title && (
                  <p className="text-sm text-red-500">{errors.title}</p>
                )}
              </div>

              {/* Domain */}
              <div className="space-y-2">
                <Label htmlFor="domain">Domain</Label>
                <Input
                  id="domain"
                  name="domain"
                  value={formData.domain}
                  onChange={handleInputChange}
                  placeholder="e.g., Web Development, Data Science"
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe the internship program..."
                className={`min-h-32 ${errors.description ? 'border-red-500' : ''}`}
              />
              {errors.description && (
                <p className="text-sm text-red-500">{errors.description}</p>
              )}
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Start Date */}
              <div className="space-y-2">
                <Label htmlFor="start_date">Start Date *</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="start_date"
                    name="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={handleInputChange}
                    className={`pl-10 ${errors.start_date ? 'border-red-500' : ''}`}
                  />
                </div>
                {errors.start_date && (
                  <p className="text-sm text-red-500">{errors.start_date}</p>
                )}
              </div>

              {/* End Date */}
              <div className="space-y-2">
                <Label htmlFor="end_date">End Date *</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="end_date"
                    name="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={handleInputChange}
                    className={`pl-10 ${errors.end_date ? 'border-red-500' : ''}`}
                  />
                </div>
                {errors.end_date && (
                  <p className="text-sm text-red-500">{errors.end_date}</p>
                )}
              </div>
            </div>

            {/* Price and Mode */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Price */}
              <div className="space-y-2">
                <Label htmlFor="price">Price (₹) *</Label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    value={formData.price}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    className={`pl-10 ${errors.price ? 'border-red-500' : ''}`}
                  />
                </div>
                {errors.price && (
                  <p className="text-sm text-red-500">{errors.price}</p>
                )}
              </div>

              {/* Mode */}
              <div className="space-y-2">
                <Label htmlFor="mode">Mode *</Label>
                <Select
                  value={formData.mode}
                  onValueChange={(value: 'virtual' | 'physical') => handleSelectChange('mode', value)}
                >
                  <SelectTrigger className={errors.mode ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="virtual">
                      <div className="flex items-center gap-2">
                        <Monitor className="h-4 w-4" />
                        <span>Virtual</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="physical">
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4" />
                        <span>Physical</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                {errors.mode && (
                  <p className="text-sm text-red-500">{errors.mode}</p>
                )}
              </div>
            </div>

            {/* Location (only for physical mode) */}
            {formData.mode === 'physical' && (
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    placeholder="e.g., Bangalore, India"
                    className="pl-10"
                  />
                </div>
              </div>
            )}

            {/* Banner Image Upload */}
            <div className="space-y-4">
              <Label>Banner Image</Label>
              
              {/* Image Preview */}
              {(formData.banner_url || imagePreview) && (
                <div className="relative group">
                  <div className="w-full h-48 rounded-lg overflow-hidden border relative">
                    <img
                      src={imagePreview || formData.banner_url}
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
                        {formData.banner_url ? (
                          <ImageIcon className="h-6 w-6 text-primary" />
                        ) : (
                          <Upload className="h-6 w-6 text-primary" />
                        )}
                      </div>
                      <p className="font-medium mb-1">
                        {formData.banner_url ? 'Change Image' : 'Upload Image'}
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
              <div className="space-y-2">
                <Label htmlFor="banner_url" className="text-sm">Or enter image URL</Label>
                <div className="flex gap-2">
                  <Input
                    id="banner_url"
                    name="banner_url"
                    value={formData.banner_url}
                    onChange={handleInputChange}
                    placeholder="https://res.cloudinary.com/..."
                    className={errors.banner_url ? 'border-red-500' : ''}
                  />
                  {formData.banner_url && (
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
                {errors.banner_url && (
                  <p className="text-sm text-red-500">{errors.banner_url}</p>
                )}
              </div>
            </div>

            {/* Skills Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base">Skills *</Label>
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
              
              {errors.skills && (
                <p className="text-sm text-red-500">{errors.skills}</p>
              )}
              
              {formData.skills.map((skill, index) => (
                <div key={index} className="flex gap-3 items-start p-3 border rounded-lg">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Skill Name */}
                    <div className="space-y-2">
                      <Label className={index === 0 ? '' : 'sr-only'}>
                        Skill Name
                      </Label>
                      <Input
                        placeholder="e.g., React, Python, Docker"
                        value={skill.name}
                        onChange={(e) => handleSkillChange(index, 'name', e.target.value)}
                        className={errors[`skills.${index}.name`] ? 'border-red-500' : ''}
                      />
                      {errors[`skills.${index}.name`] && (
                        <p className="text-sm text-red-500">{errors[`skills.${index}.name`]}</p>
                      )}
                    </div>

                    {/* Proficiency Level */}
                    <div className="space-y-2">
                      <Label className={index === 0 ? '' : 'sr-only'}>
                        Proficiency Level
                      </Label>
                      <Select
                        value={skill.level}
                        onValueChange={(value) => handleSkillChange(index, 'level', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Basic">Basic</SelectItem>
                              <SelectItem value="Intermediate">Intermediate</SelectItem>
                              <SelectItem value="Advanced">Advanced</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  {/* Remove Skill Button */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeSkill(index)}
                    disabled={formData.skills.length <= 1}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Remove skill</span>
                  </Button>
                </div>
              ))}
            </div>

            {/* Certificate Section */}
            <div className="space-y-4 border rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="certificate"
                  checked={formData.certificate}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({ ...prev, certificate: checked === true }))
                  }
                />
                <Label htmlFor="certificate" className="cursor-pointer">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    <span className="font-medium">Certificate Provided</span>
                  </div>
                </Label>
              </div>
              
              {formData.certificate && (
                <div className="space-y-2 pl-6">
                  <Label htmlFor="certificate_title">Certificate Title *</Label>
                  <Input
                    id="certificate_title"
                    name="certificate_title"
                    value={formData.certificate_title}
                    onChange={handleInputChange}
                    placeholder="e.g., Certificate of Completion in Web Development"
                    className={errors.certificate_title ? 'border-red-500' : ''}
                  />
                  {errors.certificate_title && (
                    <p className="text-sm text-red-500">{errors.certificate_title}</p>
                  )}
                </div>
              )}
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/internships')}
                disabled={isSubmitting || isUploading}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting || isUploading}
              >
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                <Save className="mr-2 h-4 w-4" />
                Update Internship
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}