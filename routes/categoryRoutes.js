import express from "express";
import {
  addCategory,
  listCategories,
  getOneCategory,
  editCategory,
  removeCategory,
} from "../controllers/categoryController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/", authMiddleware, addCategory);
router.get("/", listCategories);
router.get("/:id", getOneCategory);
router.put("/:id", authMiddleware, editCategory);
router.delete("/:id", authMiddleware, removeCategory);

export default router;
