import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { Request } from 'express'
import AppError from '../../errors/AppError'

// If your max allowed video size is 50MB:
const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

// Ensure directory exists before saving
function ensureDirectoryExists(dirPath: string) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true })
  }
}

const storage = multer.diskStorage({
  destination: (req: Request, file, cb) => {
    let uploadPath: string

    if (file.fieldname === 'productVideo') {
      uploadPath = path.join(process.cwd(), 'uploads/videos')
    } else if (
      file.fieldname === 'productImages' ||
      file.fieldname === 'variantsImages'
    ) {
      uploadPath = path.join(process.cwd(), 'uploads/images')
    } else {
      return cb(new AppError(400, '', 'Invalid field name'), '')
    }

    ensureDirectoryExists(uploadPath)
    cb(null, uploadPath)
  },

  filename: (req: Request, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
    const ext = path.extname(file.originalname)
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`)
  }
})

// This Multer config sets the *global* file-size limit to 50MB
export const productUpload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE }
})

// export const handleFileUpload = (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   // .any() => সব ফাইল ধরবে, fieldname যে কেউ হতে পারে
//   localUpload.fields([
//     { name: 'productImages', maxCount: 10 }, // Allow up to 5 images
//     { name: 'variantsImages' },
//     { name: 'video', maxCount: 1 } // Allow only 1 video
//   ])(req, res, async (err: any) => {
//     if (err instanceof multer.MulterError) {
//       // multer নির্দিষ্ট error, যেমন fileSize exceed
//       return next(new AppError(400, err.message))
//     } else if (err) {
//       // অন্য error
//       return next(new AppError(500, err.message))
//     }

//     // সফল হলে next()
//     return next()
//   })
// }
