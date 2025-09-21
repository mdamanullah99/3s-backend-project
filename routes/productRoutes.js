import express from "express";
import { upload } from "../middlewares/uploadMiddleware.js";

import {
  addProduct,
  listProducts,
  editProduct,
  deleteOneProduct,
  getOneProductById,
  searchProductsController,
} from "../controllers/productController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Routes
// Add Product Route.................................
router.post(
  "/",
  authMiddleware,
  upload.fields([
    { name: "previewImage", maxCount: 1 },
    { name: "images", maxCount: 25 },
  ]),
  addProduct
);

// List Products with Filters Route ................................
router.get("/", listProducts);

// Get One Product By Id Route .....................................
router.get("/:id", getOneProductById);

// Edit One Product By ID Route.....................................
router.put(
  "/:id",
  authMiddleware,
  upload.fields([
    { name: "previewImage", maxCount: 1 },
    { name: "images", maxCount: 25 },
  ]),
  editProduct
);

// Delete One Product By ID Route....................................
router.delete("/:id", authMiddleware, deleteOneProduct);

// Search Product with Query Route...................................
router.get("/search", searchProductsController);

export default router;
