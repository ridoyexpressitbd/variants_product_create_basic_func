import { Types } from 'mongoose'
import { TProductVariants } from './product_variants/product_variants_interface'

export type TUpdated_by = { id: Types.ObjectId }

export type TProduct = {
  owner: Types.ObjectId
  business?: [Types.ObjectId] | []
  created_by?: Types.ObjectId
  updated_by?: TUpdated_by[] | []
  name: string
  short_description?: string
  long_description?: string
  tags?: string[]
  images: Types.ObjectId[]
  video?: Types.ObjectId[]
  category: Types.ObjectId
  warehouse?: Types.ObjectId
  total_stock: number
  total_sold?: number
  brand?: Types.ObjectId
  sizeGuard?: Types.ObjectId
  supplier?: Types.ObjectId
  variantsId: Types.ObjectId[]
  variants?: TProductVariants[]
  hasVariants: boolean
  currency: 'BDT'
  isPublish: boolean
  isDeleted: boolean
}
