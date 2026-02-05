'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Loader2, ArrowLeft, Save, Plus, X, Image as ImageIcon, Upload } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';
import Link from 'next/link';

interface Skill {
  name: string;
  proficiency: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
}

interface Domain {
  id: number;
  name: string;
  description: string;
  image: string;
  skills: Skill[];
}

export default function EditDomainPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [domain, setDomain] = useState<Domain | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image: '',
    skills: [{ name: '', proficiency: 'Beginner' as const }]
  });

  useEffect(() => {
    if (id) {
      fetchDomain();
    }
  }, [id]);

  const fetchDomain = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/domains/${id}`);
      const result = await response.json();

      if (result.success && result.data) {
        setDomain(result.data);
        setFormData({
          name: result.data.name,
          description: result.data.description,
          image: result.data.image || '',
          skills: result.data.skills.length > 0 ? result.data.skills : [{ name: '', proficiency: 'Beginner' as const }]
        });
      } else {
        toast.error(result.error || 'Failed to load domain');
        router.push('/domains');
      }
    } catch (error) {
      console.error('Error fetching domain:', error);
      toast.error('Failed to load domain');
      router.push('/domains');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Domain name is required';
    } else if (formData.name.length < 2) {
      newErrors.name = 'Domain name must be at least 2 characters';
    } else if (formData.name.length > 100) {
      newErrors.name = 'Domain name must be less than 100 characters';
    }

    // Description validation
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    } else if (formData.description.length > 500) {
      newErrors.description = 'Description must be less than 500 characters';
    }

    // Image URL validation (optional)
    if (formData.image && !isValidUrl(formData.image)) {
      newErrors.image = 'Please enter a valid URL';
    }

    // Skills validation
    const validSkills = formData.skills.filter(skill => skill.name.trim() !== '');
    if (validSkills.length === 0) {
      newErrors.skills = 'At least one skill is required';
    } else {
      validSkills.forEach((skill, index) => {
        if (!skill.name.trim()) {
          newErrors[`skills.${index}.name`] = 'Skill name is required';
        }
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const uploadToCloudinary = async (file: File): Promise<string> => {
    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || '');
      formData.append('folder', 'domains');

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
      setFormData(prev => ({ ...prev, image: cloudinaryUrl }));
      clearError('image');
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
    setFormData(prev => ({ ...prev, image: '' }));
    clearError('image');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
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
      skills: [...prev.skills, { name: '', proficiency: 'Beginner' as const }]
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

      const response = await fetch(`/api/domains/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          skills: filteredSkills
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Domain updated successfully!');
        router.push('/domains');
        router.refresh();
      } else {
        throw new Error(result.error || 'Failed to update domain');
      }
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'An error occurred while updating the domain');
      console.error('Error updating domain:', error);
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
            onClick={() => router.push('/domains')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Domains
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Edit Domain</h1>
            <p className="text-muted-foreground mt-2">
              Update domain information and skills
            </p>
          </div>
        </div>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Domain Details</CardTitle>
          <CardDescription>
            Update the domain information below
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Domain Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Domain Name *</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g., Web Development"
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name}</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe what this domain covers..."
                className={`min-h-32 ${errors.description ? 'border-red-500' : ''}`}
              />
              {errors.description && (
                <p className="text-sm text-red-500">{errors.description}</p>
              )}
            </div>

            {/* Image Upload */}
            <div className="space-y-4">
              <Label>Domain Image</Label>
              
              {/* Image Preview */}
              {(formData.image || imagePreview) && (
                <div className="relative group">
                  <div className="w-full h-48 rounded-lg overflow-hidden border relative">
                    <img
                      src={imagePreview || formData.image}
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
                  id="image-upload"
                />
                
                {isUploading ? (
                  <div className="flex flex-col items-center justify-center py-8">
                    <Loader2 className="h-10 w-10 animate-spin text-primary mb-2" />
                    <p className="text-sm text-muted-foreground">Uploading image...</p>
                  </div>
                ) : (
                  <label htmlFor="image-upload" className="cursor-pointer">
                    <div className="flex flex-col items-center justify-center py-8">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                        {formData.image ? (
                          <ImageIcon className="h-6 w-6 text-primary" />
                        ) : (
                          <Upload className="h-6 w-6 text-primary" />
                        )}
                      </div>
                      <p className="font-medium mb-1">
                        {formData.image ? 'Change Image' : 'Upload Image'}
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
                <Label htmlFor="image" className="text-sm">Or enter image URL</Label>
                <div className="flex gap-2">
                  <Input
                    id="image"
                    name="image"
                    value={formData.image}
                    onChange={handleInputChange}
                    placeholder="https://res.cloudinary.com/..."
                    className={errors.image ? 'border-red-500' : ''}
                  />
                  {formData.image && (
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
                {errors.image && (
                  <p className="text-sm text-red-500">{errors.image}</p>
                )}
              </div>
            </div>

            {/* Skills Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base">Skills</Label>
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
                        Proficiency
                      </Label>
                      <select
                        className="w-full h-10 px-3 py-2 border rounded-md bg-background"
                        value={skill.proficiency}
                        onChange={(e) => handleSkillChange(index, 'proficiency', e.target.value)}
                      >
                        <option value="Beginner">Beginner</option>
                        <option value="Intermediate">Intermediate</option>
                        <option value="Advanced">Advanced</option>
                        <option value="Expert">Expert</option>
                      </select>
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

            {/* Form Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/domains')}
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
                Update Domain
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}