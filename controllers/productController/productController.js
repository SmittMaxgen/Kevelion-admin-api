import fs from "fs";
import path from "path";
import { connectDB } from "../../connection/db.js";
import XLSX from "xlsx";

// Helper to copy local image
const copyLocalImage = async (filename, sourceFolder, destFolder) => {
  if (!filename) return "";

  const cleanName = filename.trim();
  const srcPath = path.join(sourceFolder, cleanName);

  if (!fs.existsSync(srcPath)) {
    console.warn("⚠️ Image not found:", srcPath);
    return "";
  }

  if (!fs.existsSync(srcPath)) return ""; // file not found
  const ext = path.extname(filename);
  const newName = `${Date.now()}_${Math.floor(Math.random() * 1000)}${ext}`;
  const destPath = path.join(destFolder, newName);
  fs.copyFileSync(srcPath, destPath);
  return newName;
};

// ===============================
// ✅ BULK UPLOAD PRODUCTS FROM EXCEL WITH LOCAL IMAGES
// ===============================
export const uploadProductsExcelLocalImages = async (req, res) => {
  let conn;
  try {
    const { seller_id } = req.params;
    const pool = await connectDB();
    conn = await pool.getConnection();
    await conn.beginTransaction();

    if (!seller_id)
      return res
        .status(400)
        .json({ success: false, message: "Seller Id required" });

    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "Excel file is required" });
    }

    // Read Excel file
    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet);

    if (!data || data.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No data found in Excel file" });
    }

    const [rows] = await pool.query(
      `
  SELECT 
      sph.*, 
      sp.max_product_add, 
      COUNT(p.id) AS total_product,
      (sp.max_product_add - COUNT(p.id)) AS remaining_slots
  FROM seller_packages_history sph
  JOIN subscription_package sp ON sph.package_id = sp.id
  LEFT JOIN product p ON p.seller_id = sph.seller_id
  WHERE sph.status = 'active' AND sph.seller_id = ?
  GROUP BY sph.id, sp.max_product_add;
`,
      [seller_id],
    );

    const limitInfo = rows[0];
    if (!limitInfo) {
      await conn.rollback();
      return res
        .status(400)
        .json({ success: false, message: "No active package found" });
    }

    const remaining = limitInfo.remaining_slots ?? 0;
    const totalToUpload = data.length;

    // 2️⃣ Check if seller exceeds limit
    if (totalToUpload > remaining) {
      return res.status(400).json({
        success: false,
        message: `Upload limit exceeded. You can upload only ${remaining} more products.`,
      });
    }

    const uploadFolder = path.join("uploads/");
    if (!fs.existsSync(uploadFolder))
      fs.mkdirSync(uploadFolder, { recursive: true });

    const sourceFolder = path.join("uploads/excel-images"); // folder where your local images are stored

    for (const row of data) {
      const {
        name,
        sku = "",
        status = "Active",
        detail = "",
        product_MRP,
        pricing_tiers = "[]",
        moq = 1,
        cat_id,
        cat_sub_id,
        brand = "",
        material = "",
        made_in = "",
        specification = "",
        warranty = "",
        f_image_name,
        image_2_name,
        image_3_name,
        image_4_name,
      } = row;

      if (!name || !cat_id || !cat_sub_id || !seller_id) {
        await conn.rollback();
        return res.status(400).json({
          success: false,
          message: "Missing required fields in row: " + JSON.stringify(row),
        });
      }

      // Copy images from local folder
      const f_image = await copyLocalImage(
        f_image_name,
        sourceFolder,
        uploadFolder,
      );
      const image_2 = await copyLocalImage(
        image_2_name,
        sourceFolder,
        uploadFolder,
      );
      const image_3 = await copyLocalImage(
        image_3_name,
        sourceFolder,
        uploadFolder,
      );
      const image_4 = await copyLocalImage(
        image_4_name,
        sourceFolder,
        uploadFolder,
      );

      await conn.query(
        `INSERT INTO product (
          name, sku, status, detail,product_MRP, pricing_tiers, moq,
          cat_id, cat_sub_id, f_image, image_2, image_3, image_4,
          brand, material, made_in, specification, warranty, seller_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?,?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          name,
          sku,
          status,
          detail,
          product_MRP,
          typeof pricing_tiers === "string"
            ? pricing_tiers
            : JSON.stringify(pricing_tiers),
          moq,
          cat_id,
          cat_sub_id,
          f_image,
          image_2,
          image_3,
          image_4,
          brand,
          material,
          made_in,
          specification,
          warranty,
          seller_id,
        ],
      );
    }

    await conn.commit();
    return res.status(201).json({
      success: true,
      message: "Products uploaded successfully",
      total: data.length,
    });
  } catch (err) {
    if (conn) await conn.rollback();
    console.error("Error uploading products:", err);
    return res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  } finally {
    if (conn) conn.release();
  }
};

// =======================================================
// ✅ CREATE PRODUCT
// =======================================================
export const createProduct = async (req, res) => {
  let conn;
  try {
    const pool = await connectDB();
    conn = await pool.getConnection();
    await conn.beginTransaction();

    const {
      name,
      sku,
      status = "Inactive",
      detail = "",
      product_MRP,
      pricing_tiers = [],
      moq = 1,
      cat_id,
      cat_sub_id,
      brand = "",
      material = "",
      made_in = "",
      specification = "",
      warranty = "",
      seller_id,
    } = req.body;

    if (!name || !cat_id || !cat_sub_id || !seller_id) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: name, cat_id, cat_sub_id, seller_id",
      });
    }

    // Handle file uploads
    const f_image = req.files?.f_image?.[0]?.filename || "";
    const image_2 = req.files?.image_2?.[0]?.filename || "";
    const image_3 = req.files?.image_3?.[0]?.filename || "";
    const image_4 = req.files?.image_4?.[0]?.filename || "";

    const [rows] = await pool.query(
      `
  SELECT 
      sph.*, 
      sp.max_product_add, 
      COUNT(p.id) AS total_product,
      (sp.max_product_add - COUNT(p.id)) AS remaining_slots
  FROM seller_packages_history sph
  JOIN subscription_package sp ON sph.package_id = sp.id
  LEFT JOIN product p ON p.seller_id = sph.seller_id
  WHERE sph.status = 'active' AND sph.seller_id = ?
  GROUP BY sph.id, sp.max_product_add;
`,
      [seller_id],
    );

    const limitInfo = rows[0];
    if (!limitInfo) {
      await conn.rollback();
      return res
        .status(400)
        .json({ success: false, message: "No active package found" });
    }

    const remaining = limitInfo.remaining_slots ?? 0;

    // 2️⃣ Check if seller exceeds limit
    if (remaining == 0) {
      return res.status(400).json({
        success: false,
        message: `Upload limit exceeded.`,
      });
    }

    const query = `
      INSERT INTO product (
        name, sku, status, detail, product_MRP, pricing_tiers, moq,
        cat_id, cat_sub_id, f_image, image_2, image_3, image_4,
        brand, material, made_in, specification, warranty, seller_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await conn.query(query, [
      name,
      sku,
      status,
      detail,
      product_MRP,
      JSON.stringify(pricing_tiers), // store pricing JSON
      moq,
      cat_id,
      cat_sub_id,
      f_image,
      image_2,
      image_3,
      image_4,
      brand,
      material,
      made_in,
      specification,
      warranty,
      seller_id,
    ]);

    await conn.commit();
    return res.status(201).json({
      success: true,
      message: "Product created successfully",
      product_id: result.insertId,
    });
  } catch (err) {
    if (conn) await conn.rollback();
    console.error("Error creating product:", err);
    return res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  } finally {
    if (conn) conn.release();
  }
};

// =======================================================
// ✅ UPDATE PRODUCT
// =======================================================
export const updateProduct = async (req, res) => {
  let conn;
  try {
    const { id } = req.params;
    const updates = { ...req.body };

    if (!id)
      return res
        .status(400)
        .json({ success: false, message: "Product ID required" });

    // Handle file uploads
    if (req.files?.f_image) updates.f_image = req.files.f_image[0].filename;
    if (req.files?.image_2) updates.image_2 = req.files.image_2[0].filename;
    if (req.files?.image_3) updates.image_3 = req.files.image_3[0].filename;
    if (req.files?.image_4) updates.image_4 = req.files.image_4[0].filename;

    // Convert pricing_tiers to JSON string
    if (updates.pricing_tiers)
      updates.pricing_tiers = JSON.stringify(updates.pricing_tiers);

    const pool = await connectDB();
    conn = await pool.getConnection();
    await conn.beginTransaction();

    const fields = Object.keys(updates)
      .map((key) => `${key} = ?`)
      .join(", ");
    const values = Object.values(updates);
    values.push(id);

    const query = `UPDATE product SET ${fields} WHERE id = ?`;
    const [result] = await conn.query(query, values);

    if (result.affectedRows === 0) {
      await conn.rollback();
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    await conn.commit();
    return res
      .status(200)
      .json({ success: true, message: "Product updated successfully" });
  } catch (err) {
    if (conn) await conn.rollback();
    console.error("Error updating product:", err);
    return res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  } finally {
    if (conn) conn.release();
  }
};

// =======================================================
// ✅ DELETE PRODUCT
// =======================================================
export const deleteProduct = async (req, res) => {
  let conn;
  try {
    const { id } = req.params;
    const pool = await connectDB();
    conn = await pool.getConnection();
    await conn.beginTransaction();

    // Optional: Delete uploaded images from disk
    const [existing] = await conn.query(
      "SELECT f_image, image_2, image_3, image_4 FROM product WHERE id = ?",
      [id],
    );
    if (existing.length > 0) {
      ["f_image", "image_2", "image_3", "image_4"].forEach((field) => {
        if (existing[0][field]) {
          const filePath = path.join("uploads/products", existing[0][field]);
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }
      });
    }

    const [result] = await conn.query("DELETE FROM product WHERE id = ?", [id]);
    if (result.affectedRows === 0) {
      await conn.rollback();
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    await conn.commit();
    return res
      .status(200)
      .json({ success: true, message: "Product deleted successfully" });
  } catch (err) {
    if (conn) await conn.rollback();
    console.error("Error deleting product:", err);
    return res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  } finally {
    if (conn) conn.release();
  }
};

// =======================================================
// ✅ FETCH PRODUCTS
// =======================================================
export const getAllProducts = async (req, res) => {
  try {
    const pool = await connectDB();
    const [rows] = await pool.query("SELECT * FROM product ORDER BY id DESC");
    return res.status(200).json({ success: true, data: rows });
  } catch (err) {
    console.error("Error fetching products:", err);
    return res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
};

export const getAllFeaturedProducts = async (req, res) => {
  try {
    const pool = await connectDB();
    const [rows] = await pool.query(
      "SELECT * FROM product WHERE `featured` = 'Yes'  ORDER BY id DESC",
    );
    return res.status(200).json({ success: true, data: rows });
  } catch (err) {
    console.error("Error fetching products:", err);
    return res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
};

export const getProductsBySeller = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await connectDB();
    const [rows] = await pool.query(
      "SELECT * FROM product WHERE seller_id = ? ORDER BY `product`.`id` DESC",
      [id],
    );
    return res.status(200).json({ success: true, data: rows });
  } catch (err) {
    console.error("Error fetching products:", err);
    return res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
};

// export const getProductById = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const pool = await connectDB();
//     const [rows] = await pool.query("SELECT * FROM product WHERE id = ?", [id]);
//     if (rows.length === 0) return res.status(404).json({ success: false, message: "Product not found" });
//     return res.status(200).json({ success: true, data: rows[0] });
//   } catch (err) {
//     console.error("Error fetching product by ID:", err);
//     return res.status(500).json({ success: false, message: "Server error", error: err.message });
//   }
// };

export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await connectDB();

    const [rows] = await pool.query(
      `
      SELECT 
        p.*,
        COUNT(pr.id) AS total_reviews,
        COALESCE(AVG(pr.rating), 0) AS avg_rating
      FROM product p
      LEFT JOIN product_reviews pr ON pr.product_id = p.id
      WHERE p.id = ?
      GROUP BY p.id
    `,
      [id],
    );

    if (rows.length === 0)
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });

    const product = {
      ...rows[0],
      avg_rating: parseFloat(rows[0].avg_rating).toFixed(1),
    };

    return res.status(200).json({ success: true, data: product });
  } catch (err) {
    console.error("Error fetching product by ID:", err);
    return res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
};

export const getProductsByCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await connectDB();
    const [rows] = await pool.query("SELECT * FROM product WHERE cat_id = ?", [
      id,
    ]);
    return res.status(200).json({ success: true, data: rows });
  } catch (err) {
    console.error("Error fetching products by category:", err);
    return res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
};

export const getProductsBySubCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await connectDB();
    const [rows] = await pool.query(
      "SELECT * FROM product WHERE cat_sub_id = ?",
      [id],
    );
    return res.status(200).json({ success: true, data: rows });
  } catch (err) {
    console.error("Error fetching products by subcategory:", err);
    return res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
};

export const getProductsByBrand = async (req, res) => {
  try {
    const { brand } = req.params;
    const pool = await connectDB();
    const [rows] = await pool.query(
      "SELECT * FROM product WHERE brand LIKE ?",
      [`%${brand}%`],
    );
    return res.status(200).json({ success: true, data: rows });
  } catch (err) {
    console.error("Error fetching products by brand:", err);
    return res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
};

export const getBestBrandByCategory = async (req, res) => {
  try {
    const { cat_id } = req.params;
    const pool = await connectDB();
    const [rows] = await pool.query(
      "SELECT brand, COUNT(*) AS total_products FROM product WHERE cat_id = ? GROUP BY brand ORDER BY total_products DESC LIMIT 10;",
      [cat_id],
    );
    return res.status(200).json({ success: true, data: rows });
  } catch (err) {
    console.error("Error fetching best Brand:", err);
    return res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
};

export const getTotalBrandByCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await connectDB();
    const [rows] = await pool.query(
      "SELECT COUNT(DISTINCT p.brand) AS total_brands FROM product p WHERE p.cat_id = ?",
      [id],
    );
    return res.status(200).json({ success: true, data: rows });
  } catch (err) {
    console.error("Error fetching brands by category:", err);
    return res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
};
