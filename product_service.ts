import { JwtPayload } from 'jsonwebtoken'
import { TProduct } from './product_interface'
import AppError from '../../errors/AppError'
import { Owner } from '../owner/owner.model'
import { Business } from '../business/business_model'
import { Category } from '../category/category.model'
import { Warehouse } from '../warehouse/warehouse_model'
import { Brand } from '../brand/brand.model'
import { Supplier } from '../supplier/supplier_model'
import { SizeGuard } from '../size_guard/size_guard_model'
import { Product } from './product_model'
import { generateRandomBarcodeId } from '../../utils/barcodeGenerateByBWIP'
import { TProductVariants } from './product_variants/product_variants_interface'
import { ProductVariants } from './product_variants/product_variants_model'
import mongoose, { Types } from 'mongoose'
import { File } from '../file/file_model'
import {
  calculateOfferPrice,
  calculateProfitAndMargin,
  calculateTotalStock
} from './product_utils'

// create a product into db.
const createProductIntoDB = async (user: JwtPayload, payload: TProduct) => {
  const { owner } = await Owner.isUserOwnerInfoExistInDBFindBy_ID(user.owner_id)
  if (!owner) {
    throw new AppError(404, '', 'Owner information not found!')
  }

  // check single or multiple business.
  if (!payload.business || payload.business.length === 0) {
    throw new AppError(400, 'business', 'One or more business is required!')
  }

  // check variants.
  if (payload.hasVariants && payload.variants && payload.variants.length <= 1) {
    throw new AppError(
      400,
      'variants',
      'Allowed multiple variants when hasVariants is true!'
    )
  } else if (
    !payload.hasVariants &&
    payload.variants &&
    payload.variants.length !== 1
  ) {
    throw new AppError(
      400,
      'variants',
      'Allowed only one variant when hasVariants is false!'
    )
  }

  //  check buying price not less than selling price
  if (payload.variants) {
    for (const variant of payload.variants) {
      if (Number(variant.buying_price) >= Number(variant.selling_price)) {
        throw new AppError(
          400,
          `variants/${payload.variants.indexOf(variant)}/buying_price`,
          'Buying price must be less than selling price!'
        )
      }
    }
  }

  //check sku
  if (payload.variants) {
    // Check for duplicate SKUs in the payload
    const skuSet = new Set()
    for (const variant of payload.variants) {
      if (skuSet.has(variant.sku)) {
        throw new AppError(
          400,
          `variants/${payload.variants.indexOf(variant)}/sku`,
          `This ${variant.sku} SKU must be unique!`
        )
      }
      skuSet.add(variant.sku)
    }

    // Check for existing SKUs in the database
    for (const variant of payload.variants) {
      const existingSKU = await ProductVariants.findOne({
        sku: variant.sku.toLowerCase(),
        owner: owner._id
      })
        .collation({ locale: 'en', strength: 2 })
        .select('_id')
        .lean()
      if (existingSKU) {
        throw new AppError(
          400,
          `variants/${payload.variants.indexOf(variant)}/sku`,
          `This "${variant.sku}" SKU is already created!`
        )
      }
    }
  }

  // check when discount type fixed or percent then provide discount amount or percent
  if (payload.variants) {
    for (const variant of payload.variants) {
      if (variant.discount_type) {
        if (variant.discount_type === 'fixed' && variant.discount_percent) {
          throw new AppError(
            400,
            `variants/${payload.variants.indexOf(variant)}/discount_percent`,
            'Discount type is fixed, so discount percent is not allowed!'
          )
        } else if (
          variant.discount_type === 'percent' &&
          variant.discount_amount
        ) {
          throw new AppError(
            400,
            `variants/${payload.variants.indexOf(variant)}/discount_amount`,
            'Discount type is percent, so discount amount is not allowed!'
          )
        }
        if (variant.discount_type === 'fixed' && !variant.discount_amount) {
          throw new AppError(
            400,
            `variants/${payload.variants.indexOf(variant)}/discount_amount`,
            'Discount type is fixed, so discount amount is required!'
          )
        } else if (
          variant.discount_type === 'percent' &&
          !variant.discount_percent
        ) {
          throw new AppError(
            400,
            `variants/${payload.variants.indexOf(variant)}/discount_percent`,
            'Discount type is percent, so discount percent is required!'
          )
        }

        if (!variant.discount_start_date) {
          throw new AppError(
            400,
            `variants/${payload.variants.indexOf(variant)}/discount_start_date`,
            'Discount start date is required!'
          )
        } else if (!variant.discount_end_date) {
          throw new AppError(
            400,
            `variants/${payload.variants.indexOf(variant)}/discount_end_date`,
            'Discount end date is required!'
          )
        }
      }
    }
  }

  // check business under owner.
  const business = await Business.findOne({ owner: owner._id })
    .select('_id')
    .lean()
  if (!business) {
    throw new AppError(404, '', 'First business create then product create!')
  }

  for (const business of payload.business) {
    const existBusiness = await Business.findOne({
      _id: new Types.ObjectId(business),
      owner: owner._id
    })
      .select('_id')
      .lean()
    if (!existBusiness) {
      throw new AppError(
        404,
        `business/${payload.business.indexOf(business)}`,
        `This ${payload.business.indexOf(business)} index Business is not found!`
      )
    }
  }

  // check category
  const existCategory = await Category.findOne({
    _id: payload.category,
    owner: owner._id
  })
    .select('_id')
    .lean()
  if (!existCategory) {
    throw new AppError(404, 'category', 'This Category is not found!')
  }

  // check warehouse
  if (!payload.warehouse) {
    const existWarehouse = await Warehouse.findOne({
      _id: payload.warehouse,
      owner: owner._id
    })
      .select('_id')
      .lean()

    if (!existWarehouse) {
      throw new AppError(404, 'warehouse', 'This Warehouse is not found!')
    }
  }

  // check brand
  if (payload.brand) {
    const existBrand = await Brand.findOne({
      _id: payload.brand,
      owner: owner._id
    })
      .select('_id')
      .lean()
    if (!existBrand) {
      throw new AppError(404, 'brand', 'This Brand is not found!')
    }
  }

  // check supplier
  if (payload.supplier) {
    const existSupplier = await Supplier.findOne({
      _id: payload.supplier,
      owner: owner._id
    })
      .select('_id')
      .lean()
    if (!existSupplier) {
      throw new AppError(404, 'supplier', 'This Supplier is not found!')
    }
  }

  // check size guard
  if (payload.sizeGuard) {
    const existSizeGuard = await SizeGuard.findOne({
      _id: payload.sizeGuard,
      owner: owner._id
    })
      .select('_id')
      .lean()
    if (!existSizeGuard) {
      throw new AppError(404, 'sizeGuard', 'This Size Guard is not found!')
    }
  }

  // check images.
  for (const image of payload.images) {
    const existImage = await File.findOne({
      _id: image,
      owner: owner._id,
      fileType: 'images'
    })
      .select('_id')
      .lean()
    const imageIndex = payload.images.indexOf(image) + 1
    if (!existImage) {
      throw new AppError(
        404,
        'images',
        `This ${imageIndex} number Image is not found!`
      )
    }
  }

  // check videos.
  if (payload.video && payload.video.length > 0) {
    for (const video of payload.video) {
      const existVideo = await File.findOne({
        _id: video,
        owner: owner._id,
        fileType: 'videos'
      })
        .select('_id')
        .lean()
      const videoIndex = payload.video.indexOf(video) + 1

      if (!existVideo) {
        throw new AppError(
          404,
          'video',
          `This ${videoIndex} number Video is not found!`
        )
      }
    }
  }

  // check variants single image.
  if (payload.variants) {
    for (const variant of payload.variants) {
      if (variant.image) {
        const existImage = await File.findOne({
          _id: variant.image,
          owner: owner._id,
          fileType: 'images'
        })
          .select('_id')
          .lean()
        const imageIndex = payload.variants.indexOf(variant) + 1
        if (!existImage) {
          throw new AppError(
            404,
            `variants/${payload.variants.indexOf(variant)}`,
            `This ${imageIndex} number Image is not found!`
          )
        }
      }
    }
  }

  // calculate total stock .
  const totalStock = calculateTotalStock(payload.variants!)
  payload.total_stock = totalStock
  payload.created_by = user.user_id
  payload.owner = owner._id!

  // console.log(payload)

  // create a product.
  const createdProduct = await Product.create(payload)

  // create a product variants. when hasVariants is true.
  if (payload.hasVariants && payload.variants && payload.variants.length > 1) {
    const variantDocs: Types.ObjectId[] = []
    for (const variant of payload.variants) {
      // generate a random barcode id.
      const barcodeId = generateRandomBarcodeId()

      // generate a product name with variant values.
      const generateProductNameWithVariantValues = `${payload.name} / ${variant.variants_values?.join(' - ')}`

      // generate profit and margin.
      const { profit, margin } = calculateProfitAndMargin(
        variant.buying_price,
        variant.selling_price
      )

      // calculate offer price.
      const offerPrice = calculateOfferPrice(
        variant.buying_price,
        variant.selling_price,
        variant.discount_type ?? null,
        variant.discount_amount ?? 0,
        variant.discount_percent ?? 0
      )

      // create a product variant data.
      const variantData: Partial<TProductVariants> = {
        owner: owner._id,
        productId: createdProduct._id,
        name: generateProductNameWithVariantValues,
        image: variant.image,
        barcode: barcodeId,
        sku: variant.sku,
        buying_price: variant.buying_price,
        selling_price: variant.selling_price,
        profit: profit.toString(),
        margin: margin.toString(),
        offer_price: offerPrice.toString(),
        variants_stock: variant.variants_stock,
        total_sold: variant.total_sold ?? 0,
        variants_values: variant.variants_values ?? [],
        discount_type: variant.discount_type ?? null,
        discount_amount: variant.discount_amount ?? null,
        discount_percent: variant.discount_percent ?? null,
        discount_start_date: variant.discount_start_date ?? null,
        discount_end_date: variant.discount_end_date ?? null,
        condition: variant.condition ?? 'new',
        isPreOrder: variant.isPreOrder,
        isPublish: variant.isPublish,
        isDeleted: false
      }
      // create a product variant.
      const createdVariant = await ProductVariants.create(variantData)
      variantDocs.push(createdVariant._id)
    }
    //  Update the product with all variant IDs
    const variantIds = variantDocs.map(v => v._id)
    createdProduct.variantsId = variantIds as mongoose.Types.ObjectId[]
  }
  // create a product variant. when hasVariants is false.
  else {
    if (
      !payload.hasVariants &&
      payload.variants &&
      payload.variants.length === 1
    ) {
      const singleVariant = payload.variants[0]
      // generate a random barcode id.
      const barcodeId = generateRandomBarcodeId()

      // generate profit and margin.
      const { profit, margin } = calculateProfitAndMargin(
        singleVariant.buying_price,
        singleVariant.selling_price
      )
      // calculate offer price.
      const offerPrice = calculateOfferPrice(
        singleVariant.buying_price,
        singleVariant.selling_price,
        singleVariant.discount_type ?? null,
        singleVariant.discount_amount ?? 0,
        singleVariant.discount_percent ?? 0
      )

      // create a product variant data.
      const singleVariantData: Partial<TProductVariants> = {
        owner: owner._id,
        productId: createdProduct._id,
        name: payload.name,
        image: singleVariant.image,
        barcode: barcodeId,
        sku: singleVariant.sku,
        buying_price: singleVariant.buying_price,
        selling_price: singleVariant.selling_price,
        profit: profit.toString(),
        margin: margin.toString(),
        offer_price: offerPrice.toString(),
        variants_stock: singleVariant.variants_stock,
        total_sold: singleVariant.total_sold ?? 0,
        variants_values: singleVariant.variants_values ?? [],
        discount_type: singleVariant.discount_type,
        discount_amount: singleVariant.discount_amount,
        discount_percent: singleVariant.discount_percent,
        discount_start_date: singleVariant.discount_start_date,
        discount_end_date: singleVariant.discount_end_date,
        condition: singleVariant.condition ?? 'new',
        isPreOrder: singleVariant.isPreOrder,
        isPublish: singleVariant.isPublish,
        isDeleted: false
      }

      // create a product variant.
      const createdSingleVariant =
        await ProductVariants.create(singleVariantData)
      createdProduct.variantsId = [createdSingleVariant._id]
    }
  }
  // save the created product.
  await createdProduct.save()

  // add this product is into all business.
  for (const business of payload.business) {
    await Business.findOneAndUpdate(
      { _id: business, owner: owner._id },
      { $addToSet: { products: createdProduct._id } },
      { new: true }
    )
  }

  return createdProduct
}

// get all product
const getAllProductsFromDB = async (
  user: JwtPayload,
  query: Record<string, unknown>
) => {
  // await User.isUserBlockedOrDeletedFindBy_id(user.user_id)
  // const owner = await Owner.isExistOwnerInDBFindBy_user(user.user_id)
  // if (!owner) {
  //   throw new AppError(404, '', 'Owner information not found!')
  // }
  // const store = await Store.findOne({ owner: owner._id }).select('_id').lean()
  // if (!store) {
  //   throw new AppError(404, '', 'First store create then branch create!')
  // }
  // const productQuery = new QueryBuilder(
  //   Product.find({ owner: owner._id }).populate(
  //     'variantsId sizeGuard brand supplier category warehouse'
  //   ),
  //   query
  // )
  //   .search(['name'])
  //   .sort()
  //   .fields()
  //   .filter()
  // const result = await productQuery.modelQuery
  // const meta = await productQuery.countTotal()
  // return { result, meta }
}

// get single product
const getSingleProductFromDB = async (_id: string) => {}

// delete a product from db.
const deleteSingleProducFromDB = async (_id: string) => {}

// get all product for admin
const getForAdminAllProductsFromDB = async (
  query: Record<string, unknown>
) => {}

export const ProductServices = {
  createProductIntoDB,
  getAllProductsFromDB,
  getSingleProductFromDB,
  deleteSingleProducFromDB,
  getForAdminAllProductsFromDB
}
