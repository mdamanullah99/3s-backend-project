import { pool } from "../config/db.js";

//Get All Products with filters......................................
export const getProducts = async ({
  categoryId,
  minPrice,
  maxPrice,
  page,
  limit,
}) => {
  let query = `
    SELECT p.*, c.name AS category_name
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE 1=1
  `;
  const values = [];
  let index = 1;

  if (categoryId) {
    query += ` AND p.category_id = $${index++}`;
    values.push(categoryId);
  }
  if (minPrice) {
    query += ` AND p.price >= $${index++}`;
    values.push(minPrice);
  }
  if (maxPrice) {
    query += ` AND p.price <= $${index++}`;
    values.push(maxPrice);
  }

  // Pagination
  if (page && limit) {
    const offset = (page - 1) * limit;
    query += ` LIMIT $${index++} OFFSET $${index++}`;
    values.push(limit, offset);
  }

  const result = await pool.query(query, values);
  return result.rows;
};

// helper: extract Cloudinary public_id from URL
export const getPublicIdFromUrl = (url) => {
  try {
    const parts = url.split("/upload/");
    if (parts.length < 2) return null;

    // strip version (v12345/) and extension
    const withoutVersion = parts[1].replace(/^v\d+\//, "");
    return withoutVersion.replace(/\.[^.]+$/, "");
  } catch (err) {
    console.warn(`Failed to extract public_id from URL: ${url}`);
    return null;
  }
};

export const searchProducts = async (client, keyword) => {
  const query = `
    SELECT p.*, c.name AS category_name
    FROM products p
    JOIN categories c ON p.category_id = c.id
    WHERE p.title ILIKE $1 OR p.description ILIKE $1
    ORDER BY p.id DESC;
  `;
  const values = [`%${keyword}%`];
  const result = await client.query(query, values);
  return result.rows;
};
