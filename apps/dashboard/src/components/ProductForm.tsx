import { useEffect } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import OutlinedInput from '@mui/material/OutlinedInput';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import DeleteIcon from '@mui/icons-material/Delete';
import type { ApiProduct } from '../lib/apiTypes';
import ImageUploader from './ImageUploader';

// Form-specific schema — images are objects for useFieldArray, tag includes empty string for "none".
const ProductFormSchema = z.object({
  slug: z.string().min(1, 'Slug is required'),
  name: z.string().min(1, 'Name is required'),
  brand: z.string().min(1, 'Brand is required'),
  description: z.string(),
  price: z.number({ invalid_type_error: 'Price is required' }).nonnegative('Price must be 0 or above'),
  originalPrice: z.number().nonnegative().optional(),
  images: z.array(z.object({ url: z.string() })),
  stock: z.number({ invalid_type_error: 'Stock is required' }).int().nonnegative('Stock must be 0 or above'),
  category: z.array(z.string()),
  sizes: z.array(z.string()),
  tag: z.enum(['New', 'Sale', 'Bestseller', '']),
  isPublished: z.boolean(),
  vendorId: z.string().min(1, 'Vendor ID is required'),
});

export type ProductFormValues = z.infer<typeof ProductFormSchema>;

const CATEGORIES = ['women', 'men', 'accessories', 'new-arrivals', 'sale'] as const;
const TAGS = ['New', 'Sale', 'Bestseller'] as const;

interface ProductFormProps {
  defaultValues?: Partial<ApiProduct>;
  onSubmit: (values: ProductFormValues) => void;
  isSubmitting: boolean;
}

// Generate a URL-safe slug from a product name
function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export default function ProductForm({ defaultValues, onSubmit, isSubmitting }: ProductFormProps) {
  const initialValues: ProductFormValues = {
    slug: defaultValues?.slug ?? '',
    name: defaultValues?.name ?? '',
    brand: defaultValues?.brand ?? '',
    description: defaultValues?.description ?? '',
    price: defaultValues?.price ?? 0,
    originalPrice: defaultValues?.originalPrice,
    images: (defaultValues?.images ?? []).map((url) => ({ url })),
    stock: defaultValues?.stock ?? 0,
    category: defaultValues?.category ?? [],
    sizes: defaultValues?.sizes ?? [],
    tag: defaultValues?.tag ?? '',
    isPublished: defaultValues?.isPublished ?? false,
    vendorId: defaultValues?.vendorId ?? '',
  };

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(ProductFormSchema),
    defaultValues: initialValues,
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'images' });
  const nameValue = watch('name');
  const slugValue = watch('slug');

  // Auto-generate slug from name when slug is empty
  useEffect(() => {
    if (!slugValue && nameValue) {
      setValue('slug', slugify(nameValue));
    }
  }, [nameValue, slugValue, setValue]);

  // TipTap rich text editor for the description field
  const editor = useEditor({
    extensions: [StarterKit],
    content: initialValues.description,
    onUpdate: ({ editor }) => {
      setValue('description', editor.getHTML(), { shouldDirty: true });
    },
  });

  // Sync TipTap content when editing an existing product
  useEffect(() => {
    if (editor && defaultValues?.description && editor.isEmpty) {
      editor.commands.setContent(defaultValues.description);
    }
  }, [editor, defaultValues?.description]);

  function handleFormSubmit(values: ProductFormValues) {
    onSubmit(values);
  }

  return (
    <Box component="form" onSubmit={handleSubmit(handleFormSubmit)} noValidate>
      <Grid container spacing={3}>
        {/* Name */}
        <Grid item xs={12} md={6}>
          <TextField
            label="Product Name"
            fullWidth
            required
            error={!!errors.name}
            helperText={errors.name?.message}
            {...register('name')}
          />
        </Grid>

        {/* Slug */}
        <Grid item xs={12} md={6}>
          <TextField
            label="Slug"
            fullWidth
            required
            error={!!errors.slug}
            helperText={errors.slug?.message ?? 'Auto-generated from name — must be unique'}
            {...register('slug')}
          />
        </Grid>

        {/* Brand */}
        <Grid item xs={12} md={6}>
          <TextField
            label="Brand"
            fullWidth
            required
            error={!!errors.brand}
            helperText={errors.brand?.message}
            {...register('brand')}
          />
        </Grid>

        {/* Vendor ID */}
        <Grid item xs={12} md={6}>
          <TextField
            label="Vendor ID"
            fullWidth
            required
            error={!!errors.vendorId}
            helperText={errors.vendorId?.message ?? 'MongoDB ObjectId of the vendor user'}
            {...register('vendorId')}
          />
        </Grid>

        {/* Price */}
        <Grid item xs={12} md={4}>
          <TextField
            label="Price ($)"
            type="number"
            fullWidth
            required
            inputProps={{ min: 0, step: '0.01' }}
            error={!!errors.price}
            helperText={errors.price?.message}
            {...register('price', { valueAsNumber: true })}
          />
        </Grid>

        {/* Original Price */}
        <Grid item xs={12} md={4}>
          <TextField
            label="Original Price ($)"
            type="number"
            fullWidth
            inputProps={{ min: 0, step: '0.01' }}
            helperText="Leave empty if not on sale"
            {...register('originalPrice', { valueAsNumber: true, setValueAs: (v) => (v === '' || isNaN(v) ? undefined : v) })}
          />
        </Grid>

        {/* Stock */}
        <Grid item xs={12} md={4}>
          <TextField
            label="Stock"
            type="number"
            fullWidth
            required
            inputProps={{ min: 0 }}
            error={!!errors.stock}
            helperText={errors.stock?.message}
            {...register('stock', { valueAsNumber: true })}
          />
        </Grid>

        {/* Category */}
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Categories</InputLabel>
            <Controller
              name="category"
              control={control}
              render={({ field }) => (
                <Select
                  multiple
                  input={<OutlinedInput label="Categories" />}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {(selected as string[]).map((v) => <Chip key={v} label={v} size="small" />)}
                    </Box>
                  )}
                  {...field}
                >
                  {CATEGORIES.map((cat) => (
                    <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                  ))}
                </Select>
              )}
            />
          </FormControl>
        </Grid>

        {/* Tag */}
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Tag</InputLabel>
            <Controller
              name="tag"
              control={control}
              render={({ field }) => (
                <Select label="Tag" {...field}>
                  <MenuItem value="">None</MenuItem>
                  {TAGS.map((tag) => (
                    <MenuItem key={tag} value={tag}>{tag}</MenuItem>
                  ))}
                </Select>
              )}
            />
          </FormControl>
        </Grid>

        {/* Sizes */}
        <Grid item xs={12}>
          <TextField
            label="Sizes (comma-separated)"
            fullWidth
            helperText='e.g. "XS, S, M, L, XL" or "36, 37, 38"'
            defaultValue={initialValues.sizes.join(', ')}
            onChange={(e) => {
              const sizes = e.target.value
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean);
              setValue('sizes', sizes);
            }}
          />
        </Grid>

        {/* Description (TipTap) */}
        <Grid item xs={12}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
            Description
          </Typography>
          <Box
            sx={{
              border: '1px solid',
              borderColor: 'grey.400',
              borderRadius: 1,
              minHeight: 160,
              p: 1.5,
              '& .ProseMirror': { outline: 'none', minHeight: 120 },
              '& .ProseMirror p': { margin: 0 },
            }}
          >
            <EditorContent editor={editor} />
          </Box>
        </Grid>

        {/* Images */}
        <Grid item xs={12}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Images
          </Typography>
          {/* Thumbnail grid — one tile per uploaded image */}
          <Box display="flex" flexWrap="wrap" gap={1} mb={1}>
            {fields.map((field, index) => (
              <Box
                key={field.id}
                sx={{ position: 'relative', width: 96, height: 96, borderRadius: 1, overflow: 'hidden', border: '1px solid', borderColor: 'grey.300' }}
              >
                <img
                  src={field.url}
                  alt={`Product image ${index + 1}`}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => remove(index)}
                  sx={{ position: 'absolute', top: 2, right: 2, bgcolor: 'rgba(255,255,255,0.85)', p: '2px' }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            ))}
          </Box>
          {/* Upload button — appends the returned URL to the images field array */}
          <ImageUploader
            onUploaded={(url) => append({ url })}
            disabled={isSubmitting}
          />
        </Grid>

        {/* Published */}
        <Grid item xs={12}>
          <Controller
            name="isPublished"
            control={control}
            render={({ field }) => (
              <FormControlLabel
                control={<Switch checked={field.value} onChange={field.onChange} />}
                label="Published (visible to customers)"
              />
            )}
          />
        </Grid>

        {/* Submit */}
        <Grid item xs={12}>
          <Button
            type="submit"
            variant="contained"
            disabled={isSubmitting}
            sx={{ minWidth: 140 }}
          >
            {isSubmitting ? 'Saving…' : 'Save Product'}
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
}
