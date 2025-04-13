import catchAsync from '../../utils/catchAsync'
import sendResponse from '../../utils/sendResponse'
import { ProductServices } from './product_service'

// create product controller.
const createProduct = catchAsync(async (req, res) => {
  const result = await ProductServices.createProductIntoDB(req.user, req.body)

  sendResponse(res, {
    status: 200,
    success: true,
    message: 'Product created is successfully!',
    data: result
  })
})

// get all products from db
const getAllProduct = catchAsync(async (req, res) => {
  const result = await ProductServices.getAllProductsFromDB(req.user, req.query)

  // sendResponse(res, {
  //   status: 200,
  //   success: true,

  //   message: 'Products are retrieved successfully!',
  //   data: result.result,
  //   meta: result.meta
  // })
})

// get single product from db
const getSingleProduct = catchAsync(async (req, res) => {
  const result = await ProductServices.getSingleProductFromDB(req.params.id)

  sendResponse(res, {
    status: 200,
    success: true,
    message: 'Product are retrieved successfully!',
    data: result
  })
})

// delete single form db. its soft delete.
const deleteSingleProduct = catchAsync(async (req, res) => {
  const result = await ProductServices.deleteSingleProducFromDB(req.body)

  sendResponse(res, {
    status: 200,
    success: true,
    message: 'Product deleted is successfully!',
    data: result
  })
})

// all product fatch for admin
const getForAdminAllProducts = catchAsync(async (req, res) => {
  const result = await ProductServices.getForAdminAllProductsFromDB(req.query)

  sendResponse(res, {
    status: 200,
    success: true,
    message: 'Products are retreved successfully!',
    data: result
  })
})
export const ProductControllers = {
  createProduct,
  getAllProduct,
  getSingleProduct,
  deleteSingleProduct,
  getForAdminAllProducts
}
