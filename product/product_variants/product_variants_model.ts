import mongoose, { Schema } from 'mongoose'
import { TProductVariants } from './product_variants_interface'
import { productCondition } from './product_variants_constants'

const ProductVariantsSchema = new Schema<TProductVariants>(
  {
    owner: {
      type: Schema.Types.ObjectId,
      required: [true, 'Owner id is required!'],
      ref: 'Owner'
    },
    productId: {
      type: Schema.Types.ObjectId,
      required: [true, 'Product id is required!'],
      ref: 'Product'
    },
    name: {
      type: String,
      trim: true
    },
    image: {
      type: Schema.Types.ObjectId,
      ref: 'File'
    },
    barcode: {
      type: String,
      required: [true, 'Barcode ID is required!'],
      trim: true,
      unique: true
    },
    sku: {
      type: String,
      required: [true, 'Product sku is required!'],
      trim: true
    },
    buying_price: {
      type: String,
      required: [true, 'Buying Price is required!'],
      trim: true
    },
    selling_price: {
      type: String,
      required: [true, 'Selling price is required!'],
      trim: true
    },
    condition: {
      type: String,
      enum: [...productCondition],
      required: [true, 'Product condition is required!'],
      default: 'new'
    },
    discount_type: {
      type: String,
      enum: ['fixed', 'percent']
    },
    discount_percent: {
      type: String,
      trim: true
    },
    discount_amount: {
      type: String,
      trim: true
    },
    discount_start_date: {
      type: Date
    },
    discount_end_date: {
      type: Date
    },
    profit: {
      type: String,
      required: [true, 'Profit is required!'],
      trim: true
    },
    margin: {
      type: String,
      required: [true, 'Profit Margin is required!'],
      trim: true
    },
    // changed to Number to match interface
    variants_stock: {
      type: Number,
      default: 0
    },
    variants_values: {
      type: [String]
    },
    total_sold: {
      type: Number,
      default: 0
    },
    isPublish: {
      type: Boolean,
      default: true
    },
    isPreOrder: {
      type: Boolean,
      default: false
    },
    isDeleted: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
)

export const ProductVariants = mongoose.model<TProductVariants>(
  'ProductVariants',
  ProductVariantsSchema
)
