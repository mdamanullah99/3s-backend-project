//  Create category
export const createCategory = async (client, { name, description }) => {
  const query = `
    INSERT INTO categories (name, description)
    VALUES ($1, $2)
    RETURNING *;
  `;
  const values = [name, description];
  const result = await client.query(query, values);
  return result.rows[0];
};

//  Get all categories with product counts
export const getCategories = async (client) => {
  const query = `
    SELECT c.*, COUNT(p.id) AS product_count
    FROM categories c
    LEFT JOIN products p ON c.id = p.category_id
    GROUP BY c.id
    ORDER BY c.name ASC;
  `;
  const result = await client.query(query);
  return result.rows;
};

//  Get one category by ID
export const getCategoryById = async (client, id) => {
  const query = `
    SELECT *
    FROM categories
    WHERE id = $1;
  `;
  const result = await client.query(query, [id]);
  return result.rows[0];
};

//  Update category
export const updateCategory = async (client, id, fields) => {
  const setClause = Object.keys(fields)
    .map((key, idx) => `${key} = $${idx + 1}`)
    .join(", ");

  const values = Object.values(fields);
  values.push(id);

  const query = `
    UPDATE categories
    SET ${setClause}
    WHERE id = $${values.length}
    RETURNING *;
  `;
  const result = await client.query(query, values);
  return result.rows[0];
};

//  Delete category if no products linked
export const deleteCategory = async (client, id) => {
  const checkQuery = `SELECT COUNT(*) FROM products WHERE category_id = $1;`;
  const check = await client.query(checkQuery, [id]);

  if (parseInt(check.rows[0].count) > 0) {
    throw {
      status: 400,
      message: "Cannot delete category with linked products",
    };
  }

  const query = `DELETE FROM categories WHERE id = $1 RETURNING *;`;
  const result = await client.query(query, [id]);
  return result.rows[0];
};
