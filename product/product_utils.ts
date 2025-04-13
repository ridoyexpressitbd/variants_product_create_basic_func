/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response, NextFunction } from 'express'
import fs from 'fs'
import util from 'util'
import AppError from '../../errors/AppError'
import multer from 'multer'
import { productUpload } from './product_lib'
import { TProductVariants } from './product_variants/product_variants_interface'

// Allowed file formats
const allowedImageTypes = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/bmp',
  'image/svg+xml'
]

const allowedVideoTypes = [
  'video/mp4',
  'video/quicktime',
  'video/x-msvideo',
  'video/x-ms-wmv',
  'video/mpeg',
  'video/webm',
  'video/ogg'
]

const unlinkAsync = util.promisify(fs.unlink)

// Suppose we only allow images up to 5MB:
const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5MB

export const handleFileUpload = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // First, let Multer handle the basic uploading with a 50MB per-file limit:
  productUpload.fields([
    { name: 'productImages', maxCount: 10 },
    { name: 'variantsImages' },
    { name: 'productVideo', maxCount: 1 }
  ])(req, res, async (err: any) => {
    if (err instanceof multer.MulterError) {
      // e.g. LIMIT_FILE_SIZE if > 50MB
      return next(new AppError(400, '', err.message))
    } else if (err) {
      // Other errors
      return next(new AppError(500, '', err.message))
    }

    // If Multer didn't throw, let's do manual checks:
    const files = req.files as
      | { [fieldname: string]: Express.Multer.File[] }
      | undefined
    if (!files) {
      // No files uploaded, just proceed:
      return next()
    }

    try {
      // 1) Validate MIME types
      if (
        files.productImages &&
        files.productImages.some(
          file => !allowedImageTypes.includes(file.mimetype)
        )
      ) {
        throw new AppError(400, '', 'Invalid product image file type')
      }

      if (
        files.variantsImages &&
        files.variantsImages.some(
          file => !allowedImageTypes.includes(file.mimetype)
        )
      ) {
        throw new AppError(400, '', 'Invalid variants image file type')
      }

      if (
        files.productVideo &&
        files.productVideo.some(
          file => !allowedVideoTypes.includes(file.mimetype)
        )
      ) {
        throw new AppError(400, '', 'Invalid video file type')
      }

      // 2) Check image-file sizes manually (<= 5MB each)
      const allImages = [
        ...(files.productImages || []),
        ...(files.variantsImages || [])
      ]

      for (const image of allImages) {
        if (image.size > MAX_IMAGE_SIZE) {
          // If the image is too big, remove it immediately and throw error
          await unlinkAsync(image.path).catch(unlinkErr => {
            console.error(
              'Failed to remove oversized image:',
              image.path,
              unlinkErr
            )
          })
          throw new AppError(
            400,
            ' ',
            `One of the images exceeds the 5MB limit`
          )
        }
      }

      // If everything is valid, proceed:
      return next()
    } catch (validationError) {
      // On validation error, remove all uploaded files to avoid partials:
      await Promise.all(
        ['productImages', 'variantsImages', 'productVideo'].flatMap(field =>
          files[field]
            ? files[field].map(file =>
                unlinkAsync(file.path).catch(unlinkErr => {
                  console.error('Failed to remove file:', file.path, unlinkErr)
                })
              )
            : []
        )
      )
      return next(validationError)
    }
  })
}

// another way.
// try {
//     // Validate image file types
//     if (
//       files.image &&
//       files.image.some(file => !allowedImageTypes.includes(file.mimetype))
//     ) {
//       return res
//         .status(400)
//         .json({ success: false, message: 'Invalid image file type' })
//     }

//     // Validate video file types
//     if (
//       files.video &&
//       files.video.some(file => !allowedVideoTypes.includes(file.mimetype))
//     ) {
//       return res
//         .status(400)
//         .json({ success: false, message: 'Invalid video file type' })
//     }
//   } catch (err: any) {
//     return res.status(500).json({
//       success: false,
//       message: 'Error processing files',
//       error: err.message
//     })
//   } finally {
//     // Remove uploaded files after validation (cleanup)
//     ;['image', 'video'].forEach(field => {
//       if (files[field]) {
//         files[field].forEach(file => {
//           fs.unlink(file.path, err => {
//             if (err) {
//               console.error('Failed to remove file:', file.path)
//             }
//           })
//         })
//       }
//     })
//   }

// calculate profit and margin
export const calculateProfitAndMargin = (
  buying_price: string | number,
  offer_price: string | number
) => {
  const buyingPrice = Number(buying_price)
  const offerPrice = Number(offer_price)

  const profit = offerPrice - buyingPrice
  const margin = (profit / offerPrice) * 100

  return { profit, margin }
}

// calculate offer price .
export const calculateOfferPrice = (
  buying_price: string | number,
  selling_price: string | number,
  discount_type?: 'fixed' | 'percent' | null,
  discount_amount?: string | number,
  discount_percent?: string | number
) => {
  const buyingPrice = Number(buying_price)
  const discountAmount = Number(discount_amount)
  const discountPercent = Number(discount_percent)

  let offerPrice = selling_price
  if (discount_type === 'fixed') {
    offerPrice = buyingPrice - discountAmount
  }
  if (discount_type === 'percent') {
    offerPrice = buyingPrice - (buyingPrice * discountPercent) / 100
  }
  return offerPrice
}

// caculate total stock.
export const calculateTotalStock = (variants: Partial<TProductVariants>[]) => {
  if (!variants || variants.length === 0) {
    return 0
  }
  const totalStock = variants.reduce((total, variant) => {
    return total + (Number(variant.variants_stock) || 0)
  }, 0)
  return totalStock
}

// generate random barcode number.
export const generateRandomBarcodeNumber = (): string => {
  const part1 = Math.floor(Math.random() * 900) + 100
  const part2 = Math.floor(Math.random() * 90) + 10
  const part3 = Math.floor(Math.random() * 90) + 10
  const part4 = Math.floor(Math.random() * 900) + 100

  // example: 153.04.55.022
  return `${part1}.${part2}.${part3}.${part4}`
}
