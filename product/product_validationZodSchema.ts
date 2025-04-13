import { z } from 'zod'
import { productCondition } from './product_variants/product_variants_constants'

// Reusable RegEx for validating MongoDB ObjectId strings
const objectIdRegex = /^[0-9a-fA-F]{24}$/

const TagsSchema = z
  .string({ required_error: 'Each tag must have a value.' })
  .min(2, 'Each tag must be at least 2 characters long.')
  .trim()

// Schema for the tags array (ensures it's a non-empty array of valid strings, max 60 tags)
const TagsGroupSchema = z
  .array(TagsSchema, { required_error: 'Tags list is required.' })
  .nonempty('You must provide at least one tag.')
  .max(80, 'You can add a maximum of 80 tags.')

/**
 * ProductVariant Schema (based on TProductVariants):
 *  - If you store prices, margin, etc. as strings, keep using z.string().
 *    Otherwise switch them to z.number() if you actually store numeric data.
 */
const productVariantZodSchema = z.object({
  sku: z
    .string({ required_error: 'Variant SKU is required' })
    .min(3, 'Variant SKU must be at least 3 characters')
    .max(18, 'Variant SKU can be max 18 characters')
    .regex(
      /^[a-zA-Z0-9._\-#]+$/,
      'Variant SKU can only contain letters, numbers, ., -, _, and #'
    )
    .trim(),
  image: z
    .string({ required_error: 'Variant image is required' })
    .length(24, 'ID length must be 24 characters')
    .regex(objectIdRegex, 'Invalid Variant image ID')
    .optional(),

  buying_price: z
    .string({ required_error: 'Buying Price is required' })
    .regex(/^\d+(\.\d{1,2})?$/, 'Buying price must be a valid number'),

  selling_price: z
    .string({ required_error: 'Selling Price is required' })
    .regex(/^\d+(\.\d{1,2})?$/, 'Selling price must be a valid number'),

  // // If "profit" or "margin" are required only in certain contexts, you can keep them optional.
  // profit: z
  //   .string({ required_error: 'Profit is required' })
  //   .regex(/^\d+(\.\d{1,2})?$/, 'Profit must be a valid number')
  //   .optional(),

  // margin: z
  //   .string({ required_error: 'Margin is required' })
  //   .regex(/^\d+(\.\d{1,2})?$/, 'Margin must be a valid number')
  //   .optional(),

  condition: z.enum(productCondition as [string, ...string[]], {
    required_error: 'End Point Resoures is required!'
  }),

  variants_stock: z
    .number({ required_error: 'Variant stock is required' })
    .nonnegative('Variant stock must be a non-negative number')
    .optional(),

  variants_values: z
    .array(z.string({ required_error: 'Variants values is required' }), {
      required_error: 'Varaints values is required'
    })
    .min(2, 'Variants values must be at least 2 characters')
    .nonempty('Variants Value is requried!')
    .optional(),

  discount_type: z.enum(['fixed', 'percent']).optional(),

  discount_amount: z
    .string({ required_error: 'Discount amount is required' })
    .regex(/^\d+(\.\d{1,2})?$/, 'Discount amount must be a valid number')
    .optional(),
  discount_percent: z
    .string({ required_error: 'Discount percent is required' })
    .regex(/^\d+(\.\d{1,2})?$/, 'Discount percent must be a valid number')
    .refine(
      val => parseFloat(val) > 0 && parseFloat(val) <= 100,
      'Discount percent must be greater than 0'
    )
    .optional(),

  discount_start_date: z
    .string({ required_error: 'Discount start date is required' })
    .refine(
      val => !isNaN(Date.parse(val)),
      'discount_start_date must be a valid date string'
    )
    .optional(),

  discount_end_date: z
    .string({ required_error: 'Discount end date is required' })
    .refine(
      val => !isNaN(Date.parse(val)),
      'discount_end_date must be a valid date string'
    )
    .optional(),

  // If your interface calls it isActive, change accordingly.
  // Using 'isPublish' here to match your Mongoose interface:
  isPreOrder: z.boolean({ required_error: 'isPreOrder is required!' }),
  isPublish: z.boolean().default(true).optional()
})

const createProductValidationZodSchema = z.object({
  body: z.object({
    business: z
      .array(
        z
          .string({ required_error: 'Business id is required' })
          .length(24, 'ID length must be 24 characters')
          .regex(objectIdRegex, 'Invalid Business ID'),
        { required_error: 'At least one business id is required!' }
      )
      .nonempty('At least one business id is required!'),
    name: z
      .string({ required_error: 'Product name is required!' })
      .min(5, 'Product name cannot be empty')
      .max(200, 'Product name can be max 200 characters')
      .trim(),

    short_description: z
      .string({ required_error: 'Short Description is required!' })
      .min(10, 'Short description minimum 10 characters')
      .max(500, 'Short description can be max 500 characters')
      .trim(),

    long_description: z
      .string({ required_error: 'Long Description is required!' })
      .min(20, 'Long description minimum 20 characters')
      .max(5000, 'Long description can be max 5000 characters')
      .trim()
      .optional(),

    tags: TagsGroupSchema.optional(),

    images: z
      .array(
        z
          .string({ required_error: 'Images is required!' })
          .length(24, 'ID length must be 24 characters')
          .regex(objectIdRegex, 'Invalid Image ID'),
        {
          required_error: 'Images are required!'
        }
      )
      .nonempty('You must provide at least one image.')
      .max(12, {
        message: 'You can upload a maximum of 12 images.'
      }),

    video: z
      .array(
        z
          .string({ required_error: 'Video is required!' })
          .length(24, 'ID length must be 24 characters')
          .regex(objectIdRegex, 'Invalid Video ID')
      )
      .nonempty('You must provide at least one video.')
      .max(2, {
        message: 'You can upload a maximum of 2 videos.'
      })
      .optional(),

    category: z
      .string({ required_error: 'Category ID is required!' })
      .length(24, 'ID length must be 24 characters')
      .regex(objectIdRegex, 'Invalid Category ID'),

    warehouse: z
      .string({ required_error: 'Warehouse ID is required!' })
      .length(24, 'ID length must be 24 characters')
      .regex(objectIdRegex, 'Invalid Warehouse ID')
      .optional(),

    brand: z
      .string({ required_error: 'Brand is required!' })
      .length(24, 'ID length must be 24 characters')
      .regex(objectIdRegex, 'Invalid Brand ID')
      .optional(),

    sizeGuard: z
      .string({ required_error: 'Size gurad is required!' })
      .length(24, 'ID length must be 24 characters')
      .regex(objectIdRegex, 'Invalid SizeGuard ID')
      .optional(),

    supplier: z
      .string({ required_error: 'Supplier ID is requried' })
      .length(24, 'ID length must be 24 characters')
      .regex(objectIdRegex, 'Invalid Supplier ID')
      .optional(),

    hasVariants: z.boolean().default(false),

    /**
     * If your interface uses isPublish (instead of isActive) for the Product:
     */
    isPublish: z.boolean().default(true).optional(),

    currency: z.enum(['BDT']).default('BDT').optional(),

    variants: z
      .array(productVariantZodSchema, {
        // The message if `variants` is missing entirely or if it isn't an array:
        required_error: 'Variants field is required and must be an array',
        invalid_type_error: 'Variants must be an array of variant objects'
      })
      // If you want at least one variant:
      .nonempty('At least one variant is required')
  })
})

export const ProductValidation = { createProductValidationZodSchema }
