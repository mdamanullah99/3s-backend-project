import { pool } from "../config/db.js";

import { v2 as cloudinary } from "cloudinary";

import { uploadToCloudinary } from "../utils/cloudinaryUpload.js";

import slugify from "../utils/slugify.js";

import {
  getProducts,
  getPublicIdFromUrl,
  searchProducts,
} from "../models/productModel.js";

//////////////// ADD PRODUCT ///////////////////////////////
export const addProduct = async (req, res) => {
  const client = await pool.connect();
  try {
    const {
      title,
      sku_code,
      description,
      category,
      subCategory,
      productColorsAdded,
      totalQuantity,
      costPrice,
      sellPrice,
      offerPrice,
      activeStatus,
      role,
      name,
    } = req.body;

    const previewFile = req.files["previewImage"]
      ? req.files["previewImage"][0]
      : null;
    const imageFiles = req.files["images"] || [];

    const colorsArray = JSON.parse(productColorsAdded);
    const now = new Date();
    const slug = slugify(title);

    await client.query("BEGIN");

    const duplires = await client.query(
      `SELECT * FROM products WHERE slug = $1`,
      [slug]
    );
    if (duplires.rows.length > 0) {
      await client.query("ROLLBACK");
      return res
        .status(409)
        .json({ message: "Product With this Title Already in DB" });
    }

    // ✅ Upload preview image to Cloudinary
    let previewUrl = null;
    if (previewFile) {
      const uploadRes = await uploadToCloudinary(
        previewFile.buffer,
        "products/preview"
      );
      previewUrl = uploadRes.secure_url;
    }

    // Insert product
    const productRes = await client.query(
      `INSERT INTO products 
      (title, slug, sku_code, description, category, subcategory, total_quantity, cost_price, sell_price, offer_price, total_sold, active_status, added_by_name, added_by_role, added_date, added_day, added_month, added_year, last_updated_date, last_updated_by_name, last_updated_by_role, preview_image)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,0,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21) RETURNING id`,
      [
        title,
        slug,
        sku_code,
        description,
        category,
        subCategory,
        totalQuantity,
        costPrice,
        sellPrice,
        offerPrice,
        activeStatus,
        name,
        role,
        now.toLocaleString(),
        now.getDate(),
        now.getMonth() + 1,
        now.getFullYear(),
        now.toLocaleString(),
        name,
        role,
        previewUrl,
      ]
    );

    const productId = productRes.rows[0].id;

    // Insert product colors
    for (const color of colorsArray) {
      await client.query(
        `INSERT INTO product_colors (product_id, color_name, color_code, quantity) VALUES ($1, $2, $3, $4)`,
        [productId, color.color_name, color.color_code, color.quantity]
      );
    }

    // ✅ Upload additional images to Cloudinary in parallel
    if (imageFiles.length > 0) {
      const uploadPromises = imageFiles.map((file) =>
        uploadToCloudinary(file.buffer, "products/gallery")
      );

      const uploadedResults = await Promise.all(uploadPromises);

      // Insert all uploaded image URLs into DB
      const insertPromises = uploadedResults.map((res) =>
        client.query(
          `INSERT INTO product_images (product_id, image_path) VALUES ($1, $2)`,
          [productId, res.secure_url]
        )
      );

      await Promise.all(insertPromises);
    }

    await client.query("COMMIT");
    res.status(200).json({ message: "Product added successfully" });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: "Failed to add product" });
  } finally {
    client.release();
  }
};

// List Products with filters .....................................................

export const listProducts = async (req, res, next) => {
  try {
    const { categoryId, minPrice, maxPrice, page, limit } = req.query;
    const products = await getProducts({
      categoryId,
      minPrice,
      maxPrice,
      page,
      limit,
    });
    res.json(products);
  } catch (error) {
    next(error);
  }
};

//////////////// EDIT PRODUCT ///////////////////////////////
export const editProduct = async (req, res) => {
  const productId = req.params.id;
  const client = await pool.connect();

  const currentDate = new Date().toLocaleString();

  try {
    await client.query("BEGIN");

    const {
      title,
      sku_code,
      description,
      category,
      subCategory,
      totalQuantity,
      costPrice,
      sellPrice,
      offerPrice,
      activeStatus,
      productColorsAdded,
      role,
      name,
    } = req.body;

    const slug = slugify(title);
    const duplires = await client.query(
      `SELECT * FROM products WHERE slug = $1 AND id != $2`,
      [slug, productId]
    );
    if (duplires.rows.length > 0) {
      await client.query("ROLLBACK");
      return res
        .status(409)
        .json({ message: "Product With this Title Already in DB" });
    }

    const previewFile = req.files["previewImage"]?.[0] || null;
    const imageFiles = req.files["images"] || [];

    // --- Dynamic SQL patching ---
    const fieldMap = {
      title,
      sku_code,
      description,
      category,
      subcategory: subCategory,
      total_quantity: totalQuantity,
      cost_price: costPrice,
      sell_price: sellPrice,
      offer_price: offerPrice || 0,
      active_status: activeStatus,
      last_updated_by_name: name,
      last_updated_by_role: role,
      last_updated_date: currentDate,
    };

    // --- Replace preview image if uploaded ---
    if (previewFile) {
      const oldPreviewRes = await client.query(
        "SELECT preview_image FROM products WHERE id = $1",
        [productId]
      );
      const oldPreviewUrl = oldPreviewRes.rows[0]?.preview_image;

      // delete old preview from Cloudinary
      if (oldPreviewUrl) {
        const oldPublicId = getPublicIdFromUrl(oldPreviewUrl);
        if (oldPublicId) {
          try {
            await cloudinary.uploader.destroy(oldPublicId);
          } catch (err) {
            console.warn(
              `Could not delete old preview from Cloudinary: ${oldPreviewUrl} —`,
              err.message
            );
          }
        }
      }

      // upload new preview to Cloudinary
      const uploadRes = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "products/preview", resource_type: "image" },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        stream.end(previewFile.buffer);
      });

      fieldMap.preview_image = uploadRes.secure_url;
    }

    // --- Update product fields ---
    const updateFields = [];
    const updateValues = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(fieldMap)) {
      if (value !== undefined) {
        updateFields.push(`${key} = $${paramIndex}`);
        updateValues.push(value);
        paramIndex++;
      }
    }

    if (updateFields.length > 0) {
      updateValues.push(productId);
      await client.query(
        `UPDATE products SET ${updateFields.join(
          ", "
        )} WHERE id = $${paramIndex}`,
        updateValues
      );
    }

    // --- Update colors if provided ---
    if (productColorsAdded) {
      const colors = JSON.parse(productColorsAdded);
      await client.query("DELETE FROM product_colors WHERE product_id = $1", [
        productId,
      ]);
      for (const color of colors) {
        await client.query(
          `INSERT INTO product_colors (product_id, color_name, color_code, quantity) VALUES ($1, $2, $3, $4)`,
          [productId, color.color_name, color.color_code, color.quantity]
        );
      }
    }

    // --- Replace gallery images if new ones uploaded ---
    if (imageFiles.length > 0) {
      const imgRes = await client.query(
        "SELECT image_path FROM product_images WHERE product_id = $1",
        [productId]
      );
      const oldImageUrls = imgRes.rows.map((r) => r.image_path);

      // delete old images from Cloudinary
      for (const url of oldImageUrls) {
        const publicId = getPublicIdFromUrl(url);
        if (publicId) {
          try {
            await cloudinary.uploader.destroy(publicId);
          } catch (err) {
            console.warn(`Could not delete old image: ${url} —`, err.message);
          }
        }
      }

      await client.query("DELETE FROM product_images WHERE product_id = $1", [
        productId,
      ]);

      // upload new gallery images to Cloudinary in parallel
      const uploadPromises = imageFiles.map(
        (file) =>
          new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
              { folder: "products/gallery", resource_type: "image" },
              (error, result) => {
                if (error) reject(error);
                else resolve(result);
              }
            );
            stream.end(file.buffer);
          })
      );

      const uploadedResults = await Promise.all(uploadPromises);

      // insert all uploaded images into DB in parallel
      const insertPromises = uploadedResults.map((res) =>
        client.query(
          `INSERT INTO product_images (product_id, image_path) VALUES ($1, $2)`,
          [productId, res.secure_url]
        )
      );

      await Promise.all(insertPromises);
    }

    await client.query("COMMIT");
    res.status(200).json({ message: "Product updated successfully." });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error updating product:", err.message);
    res.status(500).json({ error: "Failed to update product." });
  } finally {
    client.release();
  }
};

//       Get ONE PRODUCT BY ID ......................................................................
export const getOneProductById = async (req, res) => {
  const id = req.params.id;

  const client = await pool.connect();

  try {
    const result = await client.query("SELECT * FROM products WHERE id = $1", [
      id,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    const product = result.rows[0];

    // Fetch product colors
    const colorQuery = `
      SELECT color_name, color_code, quantity 
      FROM product_colors 
      WHERE product_id = $1
    `;
    const colorsResult = await client.query(colorQuery, [product.id]);

    // Fetch product images
    const imageQuery = `
      SELECT image_path 
      FROM product_images 
      WHERE product_id = $1
    `;
    const imagesResult = await client.query(imageQuery, [product.id]);

    res.status(200).json({
      ...product,
      colors: colorsResult.rows,
      images: imagesResult.rows.map((row) => row.image_path),
    });
  } catch (err) {
    console.error("Error fetching product by slug:", err);
    res.status(500).json({ error: "Failed to fetch product" });
  } finally {
    client.release();
  }
};

//////////////// DELETE ONE PRODUCT  /////////////////////////////////////

export const deleteOneProduct = async (req, res) => {
  const productId = req.params.id;
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Fetch preview image URL
    const prevPreviewImageQuery = `SELECT preview_image FROM products WHERE id = $1`;
    const prevPreviewImage = await client.query(prevPreviewImageQuery, [
      productId,
    ]);
    const prevPreviewImageUrl = prevPreviewImage.rows[0]?.preview_image;

    // Fetch gallery image URLs
    const imageQuery = `SELECT image_path FROM product_images WHERE product_id = $1`;
    const imageResult = await client.query(imageQuery, [productId]);
    const imageUrls = imageResult.rows.map((row) => row.image_path);

    // Delete colors
    await client.query(`DELETE FROM product_colors WHERE product_id = $1`, [
      productId,
    ]);

    // Delete images from database
    await client.query(`DELETE FROM product_images WHERE product_id = $1`, [
      productId,
    ]);

    // Delete the product
    const deleteProductResult = await client.query(
      `DELETE FROM products WHERE id = $1 RETURNING *`,
      [productId]
    );

    if (deleteProductResult.rowCount === 0) {
      throw new Error("Product not found.");
    }

    // --- Delete preview image from Cloudinary ---
    if (prevPreviewImageUrl) {
      const publicId = getPublicIdFromUrl(prevPreviewImageUrl);
      if (publicId) {
        try {
          await cloudinary.uploader.destroy(publicId);
        } catch (err) {
          console.warn(
            `Could not delete preview image from Cloudinary: ${prevPreviewImageUrl} —`,
            err.message
          );
        }
      }
    }

    // --- Delete gallery images from Cloudinary ---
    for (const url of imageUrls) {
      const publicId = getPublicIdFromUrl(url);
      if (publicId) {
        try {
          await cloudinary.uploader.destroy(publicId);
        } catch (err) {
          console.warn(`Could not delete gallery image: ${url} —`, err.message);
        }
      }
    }

    await client.query("COMMIT");
    res.status(200).json({ message: "Product deleted successfully." });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error deleting product:", err.message);
    res
      .status(500)
      .json({ error: "Something went wrong while deleting product." });
  } finally {
    client.release();
  }
};

//  Search Product By Query Controller......................................................
export const searchProductsController = async (req, res, next) => {
  const client = await pool.connect();
  console.log("I am at start");
  try {
    await client.query("BEGIN");

    const { q } = req.query;
    if (!q) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Search query is required" });
    }

    console.log("I am at Before Query");
    const products = await searchProducts(client, q);

    console.log("I am at end");

    await client.query("COMMIT");
    res.json(products);
  } catch (error) {
    console.log(error);
    await client.query("ROLLBACK");
    console.error("SearchProductsController Error:", error); // Logs full error
    res
      .status(500)
      .json({ error: "Internal Server Error", details: error.message });
  } finally {
    client.release();
  }
};
