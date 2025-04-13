import express from 'express'
import validateRequest from '../../middlewares/validateRequest'
import { ProductValidation } from './product_validationZodSchema'
import { ProductControllers } from './product_controller'
import auth from '../../middlewares/auth'

const router = express.Router()

//create product
router.post(
  '/create',
  auth('user'),
  validateRequest(ProductValidation.createProductValidationZodSchema),
  ProductControllers.createProduct
)

// get all products
router.get('/', auth('user'), ProductControllers.getAllProduct)

// get single product
router.get('/:id', ProductControllers.getSingleProduct)

// delete single product
router.delete('/:id', ProductControllers.deleteSingleProduct)

//get all product for admin
router.get('/all', ProductControllers.getForAdminAllProducts)

export const ProductRoutes = router
