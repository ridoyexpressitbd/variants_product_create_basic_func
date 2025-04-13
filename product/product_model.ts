import mongoose, { Schema } from 'mongoose'
import { TProduct, TUpdated_by } from './product_interface'

const Updated_bySchema = new Schema<TUpdated_by>(
  {
    id: {
      type: Schema.Types.ObjectId,
      ref: 'Owner',
      default: []
    }
  },
  {
    _id: false,
    timestamps: true
  }
)

const ProductSchema = new Schema<TProduct>(
  {
    owner: {
      type: Schema.Types.ObjectId,
      required: [true, 'Store id is required!'],
      ref: 'Owner'
    },
    business: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Business',
        default: []
      }
    ],
    created_by: {
      type: Schema.Types.ObjectId,
      required: [true, 'Created by id is required!'],
      ref: 'Client'
    },
    updated_by: [Updated_bySchema],
    name: {
      type: String,
      required: [true, 'Product name is required!'],
      trim: true
    },
    short_description: {
      type: String,
      trim: true
    },
    long_description: {
      type: String,
      trim: true
    },
    tags: {
      type: [String],
      default: []
    },
    images: {
      type: [Schema.Types.ObjectId],
      required: [true, 'Image is required!'],
      ref: 'File'
    },
    video: {
      type: [Schema.Types.ObjectId],
      ref: 'File',
      default: []
    },
    brand: {
      type: Schema.Types.ObjectId,
      ref: 'Brand'
    },
    sizeGuard: {
      type: Schema.Types.ObjectId,
      ref: 'SizeGuard'
    },
    supplier: {
      type: Schema.Types.ObjectId,
      ref: 'Supplier'
    },
    category: {
      type: Schema.Types.ObjectId,
      required: [true, 'Category is required!'],
      ref: 'Category'
    },
    warehouse: {
      type: Schema.Types.ObjectId,
      ref: 'Warehouse'
    },
    total_stock: {
      type: Number,
      required: [true, 'Total Stock is required!'],
      trim: true
    },
    total_sold: {
      type: Number,
      trim: true,
      default: 0
    },
    hasVariants: {
      type: Boolean,
      default: false
    },
    variantsId: {
      type: [Schema.Types.ObjectId],
      ref: 'ProductVariants'
    },
    currency: {
      type: String,
      enum: ['BDT'],
      default: 'BDT'
    },
    isPublish: {
      type: Boolean,
      default: true
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

export const Product = mongoose.model<TProduct>('Product', ProductSchema)
