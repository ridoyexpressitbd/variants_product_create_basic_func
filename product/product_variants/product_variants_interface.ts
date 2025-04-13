import { Types } from 'mongoose'

export type TProductCondition =
  | 'best selling'
  | 'trending'
  | 'new'
  | 'latest'
  | 'limited'
  | 'exclusive'
  | 'hot'
  | 'popular'
  | 'upcoming'
  | 'luxury'
  | 'pre order'
  | 'featured'
  | 'sale'
  | 'top'
  | 'best'
  | 'new arrival'

export type TProductVariants = {
  _id?: Types.ObjectId
  owner: Types.ObjectId
  productId: Types.ObjectId
  name?: string
  image?: Types.ObjectId
  condition?: TProductCondition
  buying_price: string
  selling_price: string
  discount_type?: 'fixed' | 'percent' | null
  discount_percent?: string | null
  discount_amount?: string | null
  discount_start_date?: Date | null
  discount_end_date?: Date | null
  offer_price?: string
  profit: string
  margin: string
  sku: string
  variants_stock?: number
  variants_values?: string[]
  barcode: string
  total_sold?: number
  isPreOrder: boolean
  isPublish: boolean
  isDeleted: boolean
}
