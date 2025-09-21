# 3S Backend Project

A **Node.js + Express.js + PostgreSQL** backend for product and category management with authentication, image handling, and search functionality. Fully structured for deployment on Vercel or any hosting platform.

---

## 📦 Features

- **User Authentication**: Register, login, refresh token, logout
- **Product Management**:
  - Add, list, search, edit, delete products
  - Supports multiple images and color variants
- **Category Management**:
  - Add, list, view, edit, delete categories
- **Search**: Search products by title or description
- **Atomic Queries**: All database operations use transactions for data integrity
- **Error Handling**: Centralized middleware for catching and returning errors

---

## 💄 Database

- **PostgreSQL** with **Neon** hosting (or any remote Postgres DB)
- Tables:
  - `users`
  - `products`
  - `categories`
  - `product_colors`
  - `product_images`
- Relationship:
  - One-to-many: Category → Products
  - One-to-many: Product → Product Colors / Product Images

---

## ⚙️ Setup Instructions

### 1. Clone the repository
```bash
git clone https://github.com/<your-username>/3s-backend.git
cd 3s-backend
```

### 2. Install dependencies
```bash
npm install
```

### 3. Environment Variables

Create a `.env` file in the root directory with:

```env
PORT=3000
CLIENT_URL=http://localhost:5173
DATABASE_URL=postgresql://<username>:<password>@<host>:5432/<dbname>?sslmode=require
JWT_SECRET=<your_jwt_secret>
```

- `DATABASE_URL`: Neon PostgreSQL connection string  
- `CLIENT_URL`: Your frontend URL (optional if testing with Postman)  
- `JWT_SECRET`: Secret for signing JWT tokens

---

### 4. Database Setup

Connect to your PostgreSQL database and run SQL migrations to create tables:

```sql
-- Users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Categories table
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(150) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Products table
CREATE TABLE products (
  id BIGSERIAL PRIMARY KEY,
  title TEXT,
  slug TEXT UNIQUE,
  sku_code TEXT,
  description TEXT,
  preview_image TEXT,
  category TEXT,
  category_id INT REFERENCES categories(id) ON DELETE CASCADE,
  subcategory TEXT,
  total_quantity INTEGER,
  cost_price INTEGER,
  sell_price INTEGER,
  offer_price INTEGER,
  total_sold INTEGER,
  active_status TEXT,
  added_by_name TEXT,
  added_by_role TEXT,
  added_date TEXT,
  added_day INTEGER,
  added_month INTEGER,
  added_year INTEGER,
  last_updated_date TEXT,
  last_updated_by_name TEXT,
  last_updated_by_role TEXT
);

-- Product Colors
CREATE TABLE product_colors (
  id BIGSERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  color_name TEXT,
  color_code TEXT,
  quantity INTEGER
);

-- Product Images
CREATE TABLE product_images (
  id BIGSERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  image_path TEXT
);
```

---

### 5. Start the Server (Local)
```bash
npm run start
```

The backend will run on `http://localhost:3000` by default.

---

### 6. API Endpoints

#### **Auth**
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/auth/profile` (protected)

#### **Products**
- `POST /api/products` (protected)
- `GET /api/products`
- `GET /api/products/search?q=<keyword>`
- `GET /api/products/:id`
- `PUT /api/products/:id` (protected)
- `DELETE /api/products/:id` (protected)

#### **Categories**
- `POST /api/categories` (protected)
- `GET /api/categories`
- `GET /api/categories/:id`
- `PUT /api/categories/:id` (protected)
- `DELETE /api/categories/:id` (protected)

---

### 7. Deployment

- Structured for **Vercel deployment**.
- Exported `index.js` for serverless usage:

```js
export default app;
```

- Add environment variables in Vercel dashboard:
  - `DATABASE_URL`
  - `JWT_SECRET`
  - `CLIENT_URL`

---

### 8. Live Links

- **Live Backend URL**: [https://3s-backend-project.vercel.app](https://3s-backend-project.vercel.app)  
- **Database (Neon)**: [https://console.neon.tech](https://console.neon.tech)

---

### 9. Notes

- All database queries use **transactions** to ensure atomic operations.
- Images are handled via **multer** middleware; extendable for cloud storage.
- Error responses follow JSON format:
```json
{
  "success": false,
  "message": "Error message here"
}
```

---

### 10. Run Migrations / Seed Data (Optional)
- Use `psql` or any DB client to insert sample categories, products, and users.
```

