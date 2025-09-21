import { pool } from "../config/db.js";
import {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
} from "../models/categoryModel.js";

//  Create Category..............................................
export const addCategory = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { name, description } = req.body;

    await client.query("BEGIN");
    const category = await createCategory(client, { name, description });
    await client.query("COMMIT");

    res.status(201).json(category);
  } catch (error) {
    await client.query("ROLLBACK");
    if (error.code === "23505") {
      error.status = 400;
      error.message = "Category name must be unique";
    }
    next(error);
  } finally {
    client.release();
  }
};

//  List Categories............................................
export const listCategories = async (req, res, next) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const categories = await getCategories(client);
    await client.query("COMMIT");

    res.json(categories);
  } catch (error) {
    await client.query("ROLLBACK");
    next(error);
  } finally {
    client.release();
  }
};

// Get One Category..............................................................
export const getOneCategory = async (req, res, next) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const category = await getCategoryById(client, req.params.id);
    await client.query("COMMIT");

    if (!category)
      return res.status(404).json({ message: "Category not found" });
    res.json(category);
  } catch (error) {
    await client.query("ROLLBACK");
    next(error);
  } finally {
    client.release();
  }
};

// Update One Category By Id.......................................................................
export const editCategory = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const fields = { ...req.body };

    await client.query("BEGIN");
    const category = await updateCategory(client, req.params.id, fields);
    if (!category) throw { status: 404, message: "Category not found" };
    await client.query("COMMIT");

    res.json(category);
  } catch (error) {
    await client.query("ROLLBACK");
    if (error.code === "23505") {
      error.status = 400;
      error.message = "Category name must be unique";
    }
    next(error);
  } finally {
    client.release();
  }
};

// Delete One Category By Id.....................................................
export const removeCategory = async (req, res, next) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const category = await deleteCategory(client, req.params.id);
    if (!category) throw { status: 404, message: "Category not found" };
    await client.query("COMMIT");

    res.json({ message: "Category deleted successfully" });
  } catch (error) {
    await client.query("ROLLBACK");
    next(error);
  } finally {
    client.release();
  }
};
