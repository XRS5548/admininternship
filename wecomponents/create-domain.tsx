'use client';

import { useState, useRef } from 'react';
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
import { Plus, X, Loader2, Upload, Image as ImageIcon } from 'lucide-react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { toast } from 'sonner';

// Define the form schema
export const domainFormSchema = z.object({
    name: z
        .string()
        .min(2, 'Domain name must be at least 2 characters')
        .max(100, 'Domain name must be less than 100 characters'),

    description: z
        .string()
        .min(10, 'Description must be at least 10 characters')
        .max(500, 'Description must be less than 500 characters'),

    image: z
        .string()
        .url('Image must be a valid URL')
        .optional()
        .or(z.literal(''))
        .default(''),

    skills: z
        .array(
            z.object({
                name: z.string().min(1, 'Skill name is required'),
                proficiency: z.enum([
                    'Beginner',
                    'Intermediate',
                    'Advanced',
                    'Expert',
                ]),
            })
        )
        .default([]),
});

type DomainFormValues = z.infer<typeof domainFormSchema>;

const defaultSkills = [
    { name: '', proficiency: 'Beginner' as const }
];

export function CreateDomain() {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    const form = useForm({
        resolver: zodResolver(domainFormSchema),
        defaultValues: {
            name: '',
            description: '',
            image: '',
            skills: [],
        },
    });
    

    const { control, handleSubmit, reset, setValue, watch } = form;
    const imageValue = watch('image');

    // Cloudinary upload function
    const uploadToCloudinary = async (file: File): Promise<string> => {
        setIsUploading(true);

        try {
            // Create form data
            const formData = new FormData();
            formData.append('file', file);
            formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || '');
            formData.append('folder', 'domains'); // Optional: organize images in a folder

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

            // Return secure URL
            return data.secure_url;
        } catch (error) {
            console.error('Cloudinary upload error:', error);
            throw new Error('Failed to upload image to Cloudinary');
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
            setValue('image', cloudinaryUrl, { shouldValidate: true });
            toast.success('Image uploaded successfully!');

            // Clean up preview URL
            URL.revokeObjectURL(previewUrl);
            setImagePreview(null);
        } catch (error: any) {
            toast.error(error.message || 'Failed to upload image');
            setImagePreview(null);
        } finally {
            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    // Handle remove image
    const handleRemoveImage = () => {
        setValue('image', '', { shouldValidate: true });
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const onSubmit = async (data: DomainFormValues) => {
        setIsSubmitting(true);

        try {
            const response = await fetch('/api/domains/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...data,
                    skills: data.skills?.filter(skill => skill.name.trim() !== '')
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to create domain');
            }

            if (result.success) {
                toast.success('Domain created successfully!');
                reset();
                setOpen(false);
                router.refresh(); // Refresh the page to show new domain
            } else {
                throw new Error(result.error || 'Failed to create domain');
            }
        } catch (error: any) {
            toast.error(error.message || 'An error occurred while creating the domain');
            console.error('Error creating domain:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const addSkill = () => {
        const currentSkills = form.getValues('skills') || [];
        form.setValue('skills', [...currentSkills, { name: '', proficiency: 'Beginner' }]);
    };

    const removeSkill = (index: number) => {
        const currentSkills = form.getValues('skills') || [];
        const newSkills = currentSkills.filter((_, i) => i !== index);
        form.setValue('skills', newSkills);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Domain
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Create New Domain</DialogTitle>
                    <DialogDescription>
                        Add a new domain with its associated skills. Click create when you're done.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        {/* Domain Name */}
                        <FormField
                            control={control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Domain Name *</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="e.g., Web Development, Data Science, AI/ML"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        The primary name for this domain
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Description */}
                        <FormField
                            control={control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description *</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Describe what this domain covers, its importance, and scope..."
                                            className="min-h-[100px]"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        Provide a detailed description of the domain
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Image Upload Section */}
                        <div className="space-y-4">
                            <FormLabel>Domain Image</FormLabel>

                            {/* Image Preview */}
                            {(imageValue || imagePreview) && (
                                <div className="relative group">
                                    <div className="w-full h-48 rounded-lg overflow-hidden border">
                                        <img
                                            src={imagePreview || imageValue}
                                            alt="Preview"
                                            className="w-full h-full object-cover"
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
                                                {imageValue ? (
                                                    <ImageIcon className="h-6 w-6 text-primary" />
                                                ) : (
                                                    <Upload className="h-6 w-6 text-primary" />
                                                )}
                                            </div>
                                            <p className="font-medium mb-1">
                                                {imageValue ? 'Change Image' : 'Upload Image'}
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
                                name="image"
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
                                                {imageValue && (
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
                                        <FormDescription>
                                            Optional: Upload an image or paste a Cloudinary URL
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Skills Section */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold">Skills</h3>
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
                                                            placeholder="e.g., React, Python, Docker"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        {/* Proficiency Level */}
                                        <FormField
                                            control={control}
                                            name={`skills.${index}.proficiency`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className={index === 0 ? '' : 'sr-only'}>
                                                        Proficiency
                                                    </FormLabel>
                                                    <Select
                                                        onValueChange={field.onChange}
                                                        defaultValue={field.value}
                                                    >
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select proficiency" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="Beginner">Beginner</SelectItem>
                                                            <SelectItem value="Intermediate">Intermediate</SelectItem>
                                                            <SelectItem value="Advanced">Advanced</SelectItem>
                                                            <SelectItem value="Expert">Expert</SelectItem>
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
                                        Skills help users understand what this domain involves
                                    </p>
                                </div>
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
                                }}
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
                                Create Domain
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}