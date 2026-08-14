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

    if (!seller_id) {
      await conn.rollback();
      return res
        .status(400)
        .json({ success: false, message: "Seller Id required" });
    }

    if (!req.file) {
      await conn.rollback();
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
      await conn.rollback();
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

    if (totalToUpload > remaining) {
      await conn.rollback();
      return res.status(400).json({
        success: false,
        message: `Upload limit exceeded. You can upload only ${remaining} more products.`,
      });
    }

    const uploadFolder = path.join("uploads/");
    if (!fs.existsSync(uploadFolder))
      fs.mkdirSync(uploadFolder, { recursive: true });

    const sourceFolder = path.join("uploads/excel-images");

    for (const [index, row] of data.entries()) {
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
          message: `Missing required fields in row ${index + 2}: ` + JSON.stringify(row),
        });
      }

      const catIdNum = Number(cat_id);
      const catSubIdNum = Number(cat_sub_id);

      if (!catIdNum || !catSubIdNum) {
        await conn.rollback();
        return res.status(400).json({
          success: false,
          message: `Invalid cat_id/cat_sub_id format in row ${index + 2} for "${name}"`,
        });
      }

      // ✅ Validate category exists
      const [catCheck] = await conn.query(
        "SELECT id FROM product_category WHERE id = ?",
        [catIdNum],
      );
      if (catCheck.length === 0) {
        await conn.rollback();
        return res.status(400).json({
          success: false,
          message: `Row ${index + 2}: cat_id "${catIdNum}" does not exist in product_category (product: "${name}")`,
        });
      }

      // ✅ Validate sub-category exists (adjust table/column names to your schema)
      const [subCatCheck] = await conn.query(
        "SELECT id FROM product_subcategory WHERE id = ? AND category_id = ?",
        [catSubIdNum, catIdNum],
      );
      if (subCatCheck.length === 0) {
        await conn.rollback();
        return res.status(400).json({
          success: false,
          message: `Row ${index + 2}: cat_sub_id "${catSubIdNum}" is not valid for cat_id "${catIdNum}" (product: "${name}")`,
        });
      }

      // Copy images from local folder
      const f_image = await copyLocalImage(f_image_name, sourceFolder, uploadFolder);
      const image_2 = await copyLocalImage(image_2_name, sourceFolder, uploadFolder);
      const image_3 = await copyLocalImage(image_3_name, sourceFolder, uploadFolder);
      const image_4 = await copyLocalImage(image_4_name, sourceFolder, uploadFolder);

      await conn.query(
        `INSERT INTO product (
          name, sku, status, detail, product_MRP, pricing_tiers, moq,
          cat_id, cat_sub_id, f_image, image_2, image_3, image_4,
          brand, material, made_in, specification, warranty, seller_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          name,
          sku,
          status,
          detail,
          product_MRP,
          typeof pricing_tiers === "string" ? pricing_tiers : JSON.stringify(pricing_tiers),
          moq,
          catIdNum,
          catSubIdNum,
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
// export const createProduct = async (req, res) => {
//   let conn;
//   try {
//     const pool = await connectDB();
//     conn = await pool.getConnection();
//     await conn.beginTransaction();

//     const {
//       name,
//       sku,
//       status = "Inactive",
//       detail = "",
//       product_MRP,
//       pricing_tiers = [],
//       moq = 1,
//       cat_id,
//       cat_sub_id,
//       brand = "",
//       material = "",
//       made_in = "",
//       specification = "",
//       warranty = "",
//       seller_id,
//     } = req.body;

//     if (!name || !cat_id || !cat_sub_id || !seller_id) {
//       return res.status(400).json({
//         success: false,
//         message: "Missing required fields: name, cat_id, cat_sub_id, seller_id",
//       });
//     }

//     // Handle file uploads
//     const f_image = req.files?.f_image?.[0]?.filename || "";
//     const image_2 = req.files?.image_2?.[0]?.filename || "";
//     const image_3 = req.files?.image_3?.[0]?.filename || "";
//     const image_4 = req.files?.image_4?.[0]?.filename || "";

//     const [rows] = await pool.query(
//       `
//   SELECT
//       sph.*,
//       sp.max_product_add,
//       COUNT(p.id) AS total_product,
//       (sp.max_product_add - COUNT(p.id)) AS remaining_slots
//   FROM seller_packages_history sph
//   JOIN subscription_package sp ON sph.package_id = sp.id
//   LEFT JOIN product p ON p.seller_id = sph.seller_id
//   WHERE sph.status = 'active' AND sph.seller_id = ?
//   GROUP BY sph.id, sp.max_product_add;
// `,
//       [seller_id],
//     );

//     const limitInfo = rows[0];
//     if (!limitInfo) {
//       await conn.rollback();
//       return res
//         .status(400)
//         .json({ success: false, message: "No active package found" });
//     }

//     const remaining = limitInfo.remaining_slots ?? 0;

//     // 2️⃣ Check if seller exceeds limit
//     if (remaining == 0) {
//       return res.status(400).json({
//         success: false,
//         message: `Upload limit exceeded.`,
//       });
//     }

//     const query = `
//       INSERT INTO product (
//         name, sku, status, detail, product_MRP, pricing_tiers, moq,
//         cat_id, cat_sub_id, f_image, image_2, image_3, image_4,
//         brand, material, made_in, specification, warranty, seller_id
//       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
//     `;

//     const [result] = await conn.query(query, [
//       name,
//       sku,
//       status,
//       detail,
//       product_MRP,
//       JSON.stringify(pricing_tiers), // store pricing JSON
//       moq,
//       cat_id,
//       cat_sub_id,
//       f_image,
//       image_2,
//       image_3,
//       image_4,
//       brand,
//       material,
//       made_in,
//       specification,
//       warranty,
//       seller_id,
//     ]);

//     await conn.commit();
//     return res.status(201).json({
//       success: true,
//       message: "Product created successfully",
//       product_id: result.insertId,
//     });
//   } catch (err) {
//     if (conn) await conn.rollback();
//     console.error("Error creating product:", err);
//     return res
//       .status(500)
//       .json({ success: false, message: "Server error", error: err.message });
//   } finally {
//     if (conn) conn.release();
//   }
// };

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
      quantity = 0,
      cat_id,
      cat_sub_id,
      brand = "",
      material = "",
      made_in = "",
      specification = "",
      warranty = "",
      seller_id,
      color_id = null,
      finish_id = null,
      gst = 0,
    } = req.body;

    if (!name || !cat_id || !cat_sub_id || !seller_id) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: name, cat_id, cat_sub_id, seller_id",
      });
    }

    const f_image = req.files?.f_image?.[0]?.filename || "";
    const image_2 = req.files?.image_2?.[0]?.filename || "";
    const image_3 = req.files?.image_3?.[0]?.filename || "";
    const image_4 = req.files?.image_4?.[0]?.filename || "";

    const [rows] = await pool.query(
      `SELECT sph.*, sp.max_product_add,
              COUNT(p.id) AS total_product,
              (sp.max_product_add - COUNT(p.id)) AS remaining_slots
       FROM seller_packages_history sph
       JOIN subscription_package sp ON sph.package_id = sp.id
       LEFT JOIN product p ON p.seller_id = sph.seller_id
       WHERE sph.status = 'active' AND sph.seller_id = ?
       GROUP BY sph.id, sp.max_product_add`,
      [seller_id],
    );

    const limitInfo = rows[0];
    if (!limitInfo) {
      await conn.rollback();
      return res
        .status(400)
        .json({ success: false, message: "No active package found" });
    }
    if ((limitInfo.remaining_slots ?? 0) == 0) {
      await conn.rollback();
      return res
        .status(400)
        .json({ success: false, message: "Upload limit exceeded." });
    }

    const [result] = await conn.query(
      `INSERT INTO product
         (name, sku, status, detail, product_MRP, pricing_tiers, moq, quantity,
          cat_id, cat_sub_id, f_image, image_2, image_3, image_4,
          brand, material, made_in, specification, warranty, seller_id,
          color_id, finish_id, gst)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        sku,
        status,
        detail,
        product_MRP,
        JSON.stringify(pricing_tiers),
        moq,
        Number(quantity),
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
        color_id,
        finish_id,
        Number(gst),
      ],
    );

    const product_id = result.insertId;
    const qty = Number(quantity);

    if (qty > 0) {
      await conn.query(
        `INSERT INTO product_inventory
           (product_id, seller_id, change_type, quantity_change,
            quantity_before, quantity_after, order_type, note)
         VALUES (?, ?, 'add', ?, 0, ?, 'manual', 'Initial stock on product creation')`,
        [product_id, seller_id, qty, qty],
      );
    }

    await conn.commit();
    return res.status(201).json({
      success: true,
      message: "Product created successfully",
      product_id,
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
// export const updateProduct = async (req, res) => {
//   let conn;
//   try {
//     const { id } = req.params;
//     const updates = { ...req.body };

//     if (!id)
//       return res
//         .status(400)
//         .json({ success: false, message: "Product ID required" });

//     // Handle file uploads
//     if (req.files?.f_image) updates.f_image = req.files.f_image[0].filename;
//     if (req.files?.image_2) updates.image_2 = req.files.image_2[0].filename;
//     if (req.files?.image_3) updates.image_3 = req.files.image_3[0].filename;
//     if (req.files?.image_4) updates.image_4 = req.files.image_4[0].filename;
//     if (req.files?.product_catalogue)
//       updates.product_catalogue = req.files.product_catalogue[0].filename;
//     if (req.files?.product_catelogs)
//       updates.product_catelogs = req.files.product_catelogs[0].filename;
//     // Convert pricing_tiers to JSON string
//     if (updates.pricing_tiers)
//       updates.pricing_tiers = JSON.stringify(updates.pricing_tiers);

//     const pool = await connectDB();
//     conn = await pool.getConnection();
//     await conn.beginTransaction();

//     const fields = Object.keys(updates)
//       .map((key) => `${key} = ?`)
//       .join(", ");
//     const values = Object.values(updates);
//     values.push(id);

//     const query = `UPDATE product SET ${fields} WHERE id = ?`;
//     const [result] = await conn.query(query, values);

//     if (result.affectedRows === 0) {
//       await conn.rollback();
//       return res
//         .status(404)
//         .json({ success: false, message: "Product not found" });
//     }

//     await conn.commit();
//     return res
//       .status(200)
//       .json({ success: true, message: "Product updated successfully" });
//   } catch (err) {
//     if (conn) await conn.rollback();
//     console.error("Error updating product:", err);
//     return res
//       .status(500)
//       .json({ success: false, message: "Server error", error: err.message });
//   } finally {
//     if (conn) conn.release();
//   }
// };

export const updateProduct = async (req, res) => {
  let conn;
  try {
    const { id } = req.params;
    if (!id)
      return res
        .status(400)
        .json({ success: false, message: "Product ID required" });

    const updates = { ...req.body };

    if (req.files?.f_image) updates.f_image = req.files.f_image[0].filename;
    if (req.files?.image_2) updates.image_2 = req.files.image_2[0].filename;
    if (req.files?.image_3) updates.image_3 = req.files.image_3[0].filename;
    if (req.files?.image_4) updates.image_4 = req.files.image_4[0].filename;
    if (req.files?.product_catalogue)
      updates.product_catalogue = req.files.product_catalogue[0].filename;
    if (req.files?.product_catelogs)
      updates.product_catelogs = req.files.product_catelogs[0].filename;

    if (updates.pricing_tiers)
      updates.pricing_tiers = JSON.stringify(updates.pricing_tiers);

    const newQuantity =
      updates.quantity !== undefined ? Number(updates.quantity) : undefined;
    delete updates.quantity;

    const pool = await connectDB();
    conn = await pool.getConnection();
    await conn.beginTransaction();

    const [[currentProduct]] = await conn.query(
      `SELECT quantity, seller_id FROM product WHERE id = ?`,
      [id],
    );
    if (!currentProduct) {
      await conn.rollback();
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    const fieldsToUpdate = { ...updates };
    if (newQuantity !== undefined) fieldsToUpdate.quantity = newQuantity;

    if (Object.keys(fieldsToUpdate).length === 0) {
      await conn.rollback();
      return res
        .status(400)
        .json({ success: false, message: "No fields to update" });
    }

    const fields = Object.keys(fieldsToUpdate)
      .map((k) => `${k} = ?`)
      .join(", ");
    const values = [...Object.values(fieldsToUpdate), id];

    const [result] = await conn.query(
      `UPDATE product SET ${fields} WHERE id = ?`,
      values,
    );

    if (result.affectedRows === 0) {
      await conn.rollback();
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    if (newQuantity !== undefined) {
      const quantityBefore = Number(currentProduct.quantity);
      const quantityAfter = newQuantity;
      const diff = quantityAfter - quantityBefore;

      if (diff !== 0) {
        const changeType = diff > 0 ? "add" : "deduct";
        const quantityChange = Math.abs(diff);

        await conn.query(
          `INSERT INTO product_inventory
             (product_id, seller_id, change_type, quantity_change,
              quantity_before, quantity_after, order_type, note)
           VALUES (?, ?, ?, ?, ?, ?, 'manual', 'Manual quantity update')`,
          [
            id,
            currentProduct.seller_id,
            changeType,
            quantityChange,
            quantityBefore,
            quantityAfter,
          ],
        );
      }
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

export const getProductInventory = async (req, res) => {
  try {
    const pool = await connectDB();
    const { product_id } = req.params;

    if (!product_id)
      return res
        .status(400)
        .json({ success: false, message: "product_id is required" });

    const [[product]] = await pool.query(
      `SELECT id, name, sku, quantity, seller_id FROM product WHERE id = ?`,
      [product_id],
    );
    if (!product)
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });

    const [history] = await pool.query(
      `SELECT * FROM product_inventory
       WHERE product_id = ?
       ORDER BY created_at DESC`,
      [product_id],
    );

    return res.status(200).json({
      success: true,
      product: {
        id: product.id,
        name: product.name,
        sku: product.sku,
        seller_id: product.seller_id,
        current_quantity: product.quantity,
      },
      inventory_history: history,
    });
  } catch (err) {
    console.error("Error fetching product inventory:", err);
    return res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
};

export const getAllInventory = async (req, res) => {
  try {
    const pool = await connectDB();

    const [inventory] = await pool.query(
      `SELECT 
        pi.id,
        pi.product_id,
        p.name        AS product_name,
        p.sku         AS product_sku,
        p.quantity    AS current_quantity,
        pi.seller_id,
        s.name        AS seller_name,
        pi.change_type,
        pi.quantity_change,
        pi.quantity_before,
        pi.quantity_after,
        pi.order_type,
        pi.order_id,
        pi.note,
        pi.created_at
      FROM product_inventory pi
      JOIN product p ON p.id = pi.product_id
      JOIN seller  s ON s.id = pi.seller_id
      ORDER BY pi.created_at DESC`,
    );

    return res.status(200).json({
      success: true,
      total: inventory.length,
      inventory,
    });
  } catch (err) {
    console.error("Error fetching all inventory:", err);
    return res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
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
// export const getAllProducts = async (req, res) => {
//   try {
//     const pool = await connectDB();
//     const [rows] = await pool.query("SELECT * FROM product ORDER BY id DESC");
//     return res.status(200).json({ success: true, data: rows });
//   } catch (err) {
//     console.error("Error fetching products:", err);
//     return res
//       .status(500)
//       .json({ success: false, message: "Server error", error: err.message });
//   }
// };

// export const getAllProducts = async (req, res) => {
//   try {
//     const pool = await connectDB();
//     const [rows] = await pool.query(`
//       SELECT
//         p.*,
//         s.name AS seller_name,
//         c.name AS color_name,
//         f.name AS finish_name,
//         m.name AS material_name
//       FROM product p
//       LEFT JOIN sellers s ON s.id = p.seller_id
//       LEFT JOIN colors c ON c.id = p.color_id
//       LEFT JOIN finishes f ON f.id = p.finish_id
//       LEFT JOIN materials m ON m.id = p.material_id
//       ORDER BY p.id DESC
//     `);
//     return res.status(200).json({ success: true, data: rows });
//   } catch (err) {
//     console.error("Error fetching products:", err);
//     return res
//       .status(500)
//       .json({ success: false, message: "Server error", error: err.message });
//   }
// };

export const getAllProducts = async (req, res) => {
  try {
    const pool = await connectDB();

    const {
      search,
      cat_id,
      cat_sub_id,
      seller_id,
      status,
      featured,
      highlight,
      brand,
      color_id,
      finish_id,
      material_id,
      min_price,
      max_price,
    } = req.query;

    let conditions = [];
    let params = [];

    if (search) {
      conditions.push(`(p.name LIKE ? OR p.sku LIKE ? OR p.brand LIKE ?)`);
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (cat_id) {
      conditions.push(`p.cat_id = ?`);
      params.push(cat_id);
    }
    if (cat_sub_id) {
      conditions.push(`p.cat_sub_id = ?`);
      params.push(cat_sub_id);
    }
    if (seller_id) {
      conditions.push(`p.seller_id = ?`);
      params.push(seller_id);
    }
    if (status) {
      conditions.push(`p.status = ?`);
      params.push(status);
    }
    if (featured) {
      conditions.push(`p.featured = ?`);
      params.push(featured);
    }
    if (highlight) {
      conditions.push(`p.highlight = ?`);
      params.push(highlight);
    }
    if (brand) {
      conditions.push(`p.brand LIKE ?`);
      params.push(`%${brand}%`);
    }
    if (color_id) {
      conditions.push(`p.color_id = ?`);
      params.push(color_id);
    }
    if (finish_id) {
      conditions.push(`p.finish_id = ?`);
      params.push(finish_id);
    }
    if (material_id) {
      conditions.push(`p.material_id = ?`);
      params.push(material_id);
    }
    if (min_price) {
      conditions.push(`p.product_MRP >= ?`);
      params.push(min_price);
    }
    if (max_price) {
      conditions.push(`p.product_MRP <= ?`);
      params.push(max_price);
    }

    const whereClause = conditions.length
      ? `WHERE ${conditions.join(" AND ")}`
      : "";

    // const [rows] = await pool.query(`
    //   SELECT
    //     p.*,
    //     s.name AS seller_name,
    //     c.name AS color_name,
    //     f.name AS finish_name,
    //     m.name AS material_name
    //   FROM product p
    //   LEFT JOIN sellers s ON s.id = p.seller_id
    //   LEFT JOIN colors c ON c.id = p.color_id
    //   LEFT JOIN finishes f ON f.id = p.finish_id
    //   LEFT JOIN materials m ON m.id = p.material_id
    //   ${whereClause}
    //   ORDER BY p.id DESC
    // `, params);

    const [rows] = await pool.query(
      `
  SELECT 
    p.*,
    s.name AS seller_name,
    c.name AS color_name,
    f.name AS finish_name,
    m.name AS material_name,
    cat.category_name,
    sub.subcategory_name
  FROM product p
  LEFT JOIN seller s ON s.id = p.seller_id
  LEFT JOIN color_master c ON c.id = p.color_id
  LEFT JOIN finish_master f ON f.id = p.finish_id
  LEFT JOIN material_master m ON m.id = p.material_id
  LEFT JOIN product_category cat ON cat.id = p.cat_id
  LEFT JOIN product_subcategory sub ON sub.id = p.cat_sub_id
  ${whereClause}
  ORDER BY p.id DESC
`,
      params,
    );

    return res.status(200).json({ success: true, data: rows });
  } catch (err) {
    console.error("Error fetching products:", err);
    return res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
};

// export const getAllFeaturedProducts = async (req, res) => {
//   try {
//     const { buyer_id } = req.body;
//     const pool = await connectDB();
//     const [rows] = await pool.query(
//       "SELECT * FROM product WHERE `featured` = 'Yes'  ORDER BY id DESC",
//     );
//     return res.status(200).json({ success: true, data: rows });
//   } catch (err) {
//     console.error("Error fetching products:", err);
//     return res
//       .status(500)
//       .json({ success: false, message: "Server error", error: err.message });
//   }
// };

export const getAllFeaturedProducts = async (req, res) => {
  try {
    // const { buyer_id } = req.body;

    const buyer_id = req.query.buyer_id; // Get buyer_id from query parameters
    const pool = await connectDB();

    const [rows] = await pool.query(
      `
      SELECT 
        p.*,

        w.id AS wishlist_id,
        cat.category_name,
        sub.subcategory_name,

        COUNT(DISTINCT pr.id) AS total_reviews,
        COALESCE(AVG(pr.rating), 0) AS avg_rating

      FROM product p

      LEFT JOIN wishlist w
        ON w.product_id = p.id
       AND w.buyer_id = ?

      LEFT JOIN product_reviews pr
        ON pr.product_id = p.id
      LEFT JOIN product_category cat ON cat.id = p.cat_id
      LEFT JOIN product_subcategory sub ON sub.id = p.cat_sub_id

      WHERE p.featured = 'Yes'

      GROUP BY p.id
      ORDER BY p.id DESC
      `,
      [buyer_id],
    );

    return res.status(200).json({
      success: true,
      data: rows,
    });
  } catch (err) {
    console.error("Error fetching products:", err);

    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
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

// export const getProductById = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const pool = await connectDB();

//     const [rows] = await pool.query(
//       `
//       SELECT
//         p.*,
//         COUNT(pr.id) AS total_reviews,
//         COALESCE(AVG(pr.rating), 0) AS avg_rating
//       FROM product p
//       LEFT JOIN product_reviews pr ON pr.product_id = p.id
//       WHERE p.id = ?
//       GROUP BY p.id
//     `,
//       [id],
//     );

//     if (rows.length === 0)
//       return res
//         .status(404)
//         .json({ success: false, message: "Product not found" });

//     const product = {
//       ...rows[0],
//       avg_rating: parseFloat(rows[0].avg_rating).toFixed(1),
//     };

//     return res.status(200).json({ success: true, data: product });
//   } catch (err) {
//     console.error("Error fetching product by ID:", err);
//     return res
//       .status(500)
//       .json({ success: false, message: "Server error", error: err.message });
//   }
// };

export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    // Logged-in buyer id from auth middleware
    // const buyerId = req.user?.id || null;
    const { buyerId } = req.query;
    const pool = await connectDB();

    const [rows] = await pool.query(
      `
      SELECT 
        p.*,

        -- wishlist (buyer wise)
        w.id AS wishlist_id,

        -- extra names
        s.name AS seller_name,
        c.name AS color_name,
        f.name AS finish_name,
        m.name AS material_name,

        -- reviews
        COUNT(DISTINCT pr.id) AS total_reviews,
        COALESCE(AVG(pr.rating), 0) AS avg_rating

      FROM product p

      LEFT JOIN product_reviews pr
        ON pr.product_id = p.id

      LEFT JOIN wishlist w
        ON w.product_id = p.id
       AND w.buyer_id = ?

      LEFT JOIN seller s
        ON s.id = p.seller_id

      LEFT JOIN color c
        ON c.id = p.color_id

      LEFT JOIN finish f
        ON f.id = p.finish_id

      LEFT JOIN material m
        ON m.id = p.material_id

      WHERE p.id = ?

      GROUP BY p.id
      `,
      [buyerId, id],
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const product = {
      ...rows[0],
      avg_rating: parseFloat(rows[0].avg_rating).toFixed(1),
    };

    return res.status(200).json({
      success: true,
      data: product,
    });
  } catch (err) {
    console.error("Error fetching product by ID:", err);

    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};

export const getProductBySellerId = async (req, res) => {
  try {
    const { seller_id } = req.params;
    const pool = await connectDB();

    const [rows] = await pool.query(
      `
      SELECT 
        p.*,
        COUNT(pr.id) AS total_reviews,
        COALESCE(AVG(pr.rating), 0) AS avg_rating
      FROM product p
      LEFT JOIN product_reviews pr ON pr.product_id = p.id
      WHERE p.seller_id = ?
      GROUP BY p.id
      `,
      [seller_id],
    );

    if (rows.length === 0)
      return res
        .status(404)
        .json({ success: false, message: "No products found for this seller" });

    const products = rows.map((row) => ({
      ...row,
      avg_rating: parseFloat(row.avg_rating).toFixed(1),
    }));

    return res.status(200).json({ success: true, data: products });
  } catch (err) {
    console.error("Error fetching products by seller ID:", err);
    return res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
};

export const getSellerReport = async (req, res) => {
  try {
    const { seller_id, month, year } = req.query;

    if (!year) {
      return res
        .status(400)
        .json({ success: false, message: "Year is required" });
    }

    const pool = await connectDB();

    let query = `
      SELECT 
        YEAR(o.created_at)  AS year,
        MONTH(o.created_at) AS month,
        op.seller_id,
        COUNT(op.id)                                                                    AS total_orders,
        SUM(op.quantity)                                                                AS total_quantity,
        SUM(op.price)                                                                   AS total_revenue,
        SUM(CASE WHEN op.order_status = 'Delivered' THEN op.price ELSE 0 END)          AS delivered_revenue,
        SUM(CASE WHEN op.order_status = 'Confirmed' THEN op.price ELSE 0 END)          AS confirmed_revenue,
        SUM(CASE WHEN op.order_status = 'New'       THEN op.price ELSE 0 END)          AS new_revenue
      FROM order_products op
      JOIN orders o ON o.id = op.order_id
      WHERE YEAR(o.created_at) = ?
    `;

    const params = [year];

    // ── seller filter (optional) ──────────────────────────────────────────────
    if (seller_id) {
      query += ` AND op.seller_id = ?`;
      params.push(seller_id);
    }

    // ── month filter (optional) ───────────────────────────────────────────────
    if (month) {
      query += ` AND MONTH(o.created_at) = ?`;
      params.push(month);
    }

    query += `
      GROUP BY YEAR(o.created_at), MONTH(o.created_at), op.seller_id
      ORDER BY op.seller_id ASC, month ASC
    `;

    const [rows] = await pool.query(query, params);

    // ── When NO specific month requested → fill missing months with zeros ─────
    if (!month) {
      const allMonths = Array.from({ length: 12 }, (_, i) => i + 1);

      // Get unique seller ids present in the result
      const sellerIds = seller_id
        ? [seller_id]
        : [...new Set(rows.map((r) => r.seller_id))];

      const filledData = [];

      for (const sid of sellerIds) {
        const sellerRows = rows.filter(
          (r) => String(r.seller_id) === String(sid),
        );

        const monthlyMap = {};
        sellerRows.forEach((r) => {
          monthlyMap[r.month] = r;
        });

        // Build 12-month array, zero-fill missing months
        const monthly = allMonths.map((m) => ({
          year: Number(year),
          month: m,
          seller_id: sid,
          total_orders: monthlyMap[m]?.total_orders ?? 0,
          total_quantity: monthlyMap[m]?.total_quantity ?? 0,
          total_revenue: monthlyMap[m]?.total_revenue ?? 0,
          delivered_revenue: monthlyMap[m]?.delivered_revenue ?? 0,
          confirmed_revenue: monthlyMap[m]?.confirmed_revenue ?? 0,
          new_revenue: monthlyMap[m]?.new_revenue ?? 0,
        }));

        // Yearly totals for this seller
        const yearly_total = {
          total_orders: monthly.reduce((s, r) => s + Number(r.total_orders), 0),
          total_quantity: monthly.reduce(
            (s, r) => s + Number(r.total_quantity),
            0,
          ),
          total_revenue: monthly.reduce(
            (s, r) => s + Number(r.total_revenue),
            0,
          ),
          delivered_revenue: monthly.reduce(
            (s, r) => s + Number(r.delivered_revenue),
            0,
          ),
          confirmed_revenue: monthly.reduce(
            (s, r) => s + Number(r.confirmed_revenue),
            0,
          ),
          new_revenue: monthly.reduce((s, r) => s + Number(r.new_revenue), 0),
        };

        filledData.push({
          seller_id: sid,
          year: Number(year),
          monthly,
          yearly_total,
        });
      }

      // If nothing at all found
      if (filledData.length === 0) {
        return res
          .status(404)
          .json({ success: false, message: "No data found" });
      }

      return res.status(200).json({
        success: true,
        // Unwrap single seller → plain object (seller panel); keep array for admin panel
        data: seller_id ? filledData[0] : filledData,
      });
    }

    // ── Specific month requested → return raw rows as-is ─────────────────────
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "No data found" });
    }

    return res.status(200).json({ success: true, data: rows });
  } catch (err) {
    console.error("Error fetching seller report:", err);
    return res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
};



export const getVendorReport = async (req, res) => {
  try {
    const { seller_id, year, month, start_date, end_date } = req.query;
 
    if (!seller_id) {
      return res
        .status(400)
        .json({ success: false, message: "seller_id is required" });
    }
    if (!year && !(start_date && end_date)) {
      return res.status(400).json({
        success: false,
        message: "Either year, or start_date & end_date, is required",
      });
    }
 
    const pool = await connectDB();
 
    // ── Build shared WHERE clause + params (reused across all sub-queries) ────
    let whereClause = ` WHERE op.seller_id = ? `;
    const baseParams = [seller_id];
 
    if (start_date && end_date) {
      whereClause += ` AND o.created_at BETWEEN ? AND ? `;
      baseParams.push(`${start_date} 00:00:00`, `${end_date} 23:59:59`);
    } else {
      whereClause += ` AND YEAR(o.created_at) = ? `;
      baseParams.push(year);
      if (month) {
        whereClause += ` AND MONTH(o.created_at) = ? `;
        baseParams.push(month);
      }
    }
 
    // ── 1. SUMMARY ──────────────────────────────────────────────────────────
    const [summaryRows] = await pool.query(
      `
      SELECT
        COUNT(DISTINCT op.order_id)                          AS total_orders,
        COALESCE(SUM(op.price * op.quantity), 0)             AS total_revenue,
        COUNT(DISTINCT DATE(o.created_at))                   AS active_days,
        COUNT(DISTINCT o.buyer_id)                            AS unique_buyers,
        COUNT(DISTINCT op.product_id)                        AS unique_products
      FROM order_products op
      JOIN orders o ON o.id = op.order_id
      ${whereClause}
      `,
      baseParams,
    );
 
    const s = summaryRows[0] || {};
    const total_orders = Number(s.total_orders) || 0;
    const total_revenue = Number(s.total_revenue) || 0;
 
    const summary = {
      total_orders,
      total_revenue,
      avg_order_value:
        total_orders > 0
          ? Number((total_revenue / total_orders).toFixed(2))
          : 0,
      active_days: Number(s.active_days) || 0,
      unique_buyers: Number(s.unique_buyers) || 0,
      unique_products: Number(s.unique_products) || 0,
    };
 
    // ── 2. MONTHLY BREAKDOWN ───────────────────────────────────────────────
    const [monthlyRows] = await pool.query(
      `
      SELECT
        MONTH(o.created_at) AS month,
        YEAR(o.created_at)  AS year,
        COUNT(DISTINCT op.order_id)               AS total_orders,
        COALESCE(SUM(op.price * op.quantity), 0)  AS revenue,
        COUNT(DISTINCT o.buyer_id)                 AS unique_buyers,
        COUNT(DISTINCT op.product_id)              AS unique_products
      FROM order_products op
      JOIN orders o ON o.id = op.order_id
      ${whereClause}
      GROUP BY YEAR(o.created_at), MONTH(o.created_at)
      ORDER BY year ASC, month ASC
      `,
      baseParams,
    );
 
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December",
    ];
 
    const monthly_breakdown = monthlyRows.map((r) => ({
      month: r.month,
      year: r.year,
      month_name: monthNames[r.month - 1],
      total_orders: Number(r.total_orders),
      revenue: Number(r.revenue),
      unique_buyers: Number(r.unique_buyers),
      unique_products: Number(r.unique_products),
    }));
 
    // ── 3. DAILY BREAKDOWN ─────────────────────────────────────────────────
    const [dailyRows] = await pool.query(
      `
      SELECT
        DATE(o.created_at) AS date,
        COUNT(DISTINCT op.order_id)               AS total_orders,
        COALESCE(SUM(op.price * op.quantity), 0)  AS revenue,
        COUNT(DISTINCT o.buyer_id)                 AS unique_buyers
      FROM order_products op
      JOIN orders o ON o.id = op.order_id
      ${whereClause}
      GROUP BY DATE(o.created_at)
      ORDER BY date ASC
      `,
      baseParams,
    );
 
    const daily_breakdown = dailyRows.map((r) => ({
      date: r.date,
      total_orders: Number(r.total_orders),
      revenue: Number(r.revenue),
      unique_buyers: Number(r.unique_buyers),
    }));
 
    // ── 4. PRODUCTS ─────────────────────────────────────────────────────────
    const [productRows] = await pool.query(
      `
      SELECT
        op.product_id,
        p.name                                     AS product_name,
        COUNT(DISTINCT op.order_id)                AS total_orders,
        SUM(op.quantity)                            AS total_quantity,
        COALESCE(SUM(op.price * op.quantity), 0)    AS revenue
      FROM order_products op
      JOIN orders o ON o.id = op.order_id
      LEFT JOIN product p ON p.id = op.product_id
      ${whereClause}
      GROUP BY op.product_id, p.name
      ORDER BY revenue DESC
      `,
      baseParams,
    );
 
    const products = productRows.map((r) => ({
      product_id: r.product_id,
      product_name: r.product_name || null,
      total_orders: Number(r.total_orders),
      total_quantity: Number(r.total_quantity),
      revenue: Number(r.revenue),
    }));
 
    // ── 5. BUYERS ───────────────────────────────────────────────────────────
    const [buyerRows] = await pool.query(
      `
      SELECT
        o.buyer_id,
        COUNT(DISTINCT op.order_id)                AS total_orders,
        COALESCE(SUM(op.price * op.quantity), 0)   AS total_spent
      FROM order_products op
      JOIN orders o ON o.id = op.order_id
      ${whereClause}
      GROUP BY o.buyer_id
      ORDER BY total_spent DESC
      `,
      baseParams,
    );
 
    const buyers = buyerRows.map((r) => ({
      buyer_id: r.buyer_id,
      total_orders: Number(r.total_orders),
      total_spent: Number(r.total_spent),
    }));
 
    // ── 6. STATUS BREAKDOWN ────────────────────────────────────────────────
    const [statusRows] = await pool.query(
      `
      SELECT
        op.order_status                            AS status,
        COUNT(DISTINCT op.order_id)                AS total_orders,
        COALESCE(SUM(op.price * op.quantity), 0)   AS revenue
      FROM order_products op
      JOIN orders o ON o.id = op.order_id
      ${whereClause}
      GROUP BY op.order_status
      ORDER BY total_orders DESC
      `,
      baseParams,
    );
 
    const status_breakdown = statusRows.map((r) => ({
      status: r.status,
      total_orders: Number(r.total_orders),
      revenue: Number(r.revenue),
    }));
 
    // ── 7. ORDERS (raw list, capped to avoid huge payloads) ────────────────
    const [orderRows] = await pool.query(
      `
      SELECT
        op.order_id,
        op.product_id,
        p.name          AS product_name,
        o.buyer_id,
b.name           AS buyer_name,
        o.shipment_cost,
        o.order_address,
        o.order_type,
        op.quantity,
        op.price,
        op.order_status,
        op.payment_status,
        o.created_at
      FROM order_products op
      JOIN orders o ON o.id = op.order_id
      LEFT JOIN product p ON p.id = op.product_id
      LEFT JOIN buyer b ON b.id = o.buyer_id
      ${whereClause}
      ORDER BY o.created_at DESC
      LIMIT 500
      `,
      baseParams,
    );

    // Group flat rows by order_id, nesting products under each order
const ordersMap = new Map();

for (const r of orderRows) {
  if (!ordersMap.has(r.order_id)) {
    ordersMap.set(r.order_id, {
      order_id: r.order_id,
      buyer_id: r.buyer_id,
      buyer_name: r.buyer_name || null,
      shipping_cost: r.shipment_cost != null ? Number(r.shipment_cost) : null,
      shipping_address: r.order_address || null,
      order_type: r.order_type || null,
      order_status: r.order_status,
      payment_status: r.payment_status,
      created_at: r.created_at,
      total_quantity: 0,
      total_price: 0,
      products: [],
    });
  }

  const orderEntry = ordersMap.get(r.order_id);

  orderEntry.products.push({
    product_id: r.product_id,
    product_name: r.product_name || null,
    quantity: Number(r.quantity),
    price: Number(r.price),
    order_status: r.order_status,
  });

  orderEntry.total_quantity += Number(r.quantity);
  orderEntry.total_price += Number(r.quantity) * Number(r.price);
}

const orders = Array.from(ordersMap.values());

    // ── FINAL RESPONSE ──────────────────────────────────────────────────────
    return res.status(200).json({
      success: true,
      data: {
        summary,
        monthly_breakdown,
        daily_breakdown,
        products,
        buyers,
        status_breakdown,
        orders,
        filters: {
          seller_id: Number(seller_id),
          year: year ? Number(year) : null,
          month: month ? Number(month) : null,
          start_date: start_date || null,
          end_date: end_date || null,
          total_orders,
        },
      },
    });
  } catch (err) {
    console.error("Error fetching vendor report:", err);
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

// export const getProductsBySubCategory = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const pool = await connectDB();
//     const [rows] = await pool.query(
//       "SELECT * FROM product WHERE cat_sub_id = ?",
//       [id],
//     );
//     return res.status(200).json({ success: true, data: rows });
//   } catch (err) {
//     console.error("Error fetching products by subcategory:", err);
//     return res
//       .status(500)
//       .json({ success: false, message: "Server error", error: err.message });
//   }
// };

// export const getProductsBySubCategory = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const pool = await connectDB();
//     const [rows] = await pool.query(
//       `
//       SELECT
//         p.*,
//         s.name AS seller_name,
//         c.name AS color_name,
//         f.name AS finish_name,
//         m.name AS material_name
//       FROM product p
//       LEFT JOIN seller s ON s.id = p.seller_id
//       LEFT JOIN color_master c ON c.id = p.color_id
//       LEFT JOIN finish_master f ON f.id = p.finish_id
//       LEFT JOIN material_master m ON m.id = p.material_id
//       WHERE p.cat_sub_id = ?
//       ORDER BY p.id DESC
//       `,
//       [id]
//     );
//     return res.status(200).json({ success: true, data: rows });
//   } catch (err) {
//     console.error("Error fetching products by subcategory:", err);
//     return res
//       .status(500)
//       .json({ success: false, message: "Server error", error: err.message });
//   }
// };

export const getProductsBySubCategory = async (req, res) => {
  try {
    const { id } = req.params;
    // const buyerId = req.user?.id || null;
    const { buyerId } = req.query;
    const pool = await connectDB();

    const [rows] = await pool.query(
      `
      SELECT 
        p.*,

        s.name AS seller_name,
        c.name AS color_name,
        f.name AS finish_name,
        m.name AS material_name,
        cat.category_name,
        sub.subcategory_name,

        w.id AS wishlist_id,

        COUNT(DISTINCT pr.id) AS total_reviews,
        COALESCE(AVG(pr.rating), 0) AS avg_rating

      FROM product p

      LEFT JOIN seller s ON s.id = p.seller_id
      LEFT JOIN color_master c ON c.id = p.color_id
      LEFT JOIN finish_master f ON f.id = p.finish_id
      LEFT JOIN material_master m ON m.id = p.material_id
      LEFT JOIN product_category cat ON cat.id = p.cat_id
      LEFT JOIN product_subcategory sub ON sub.id = p.cat_sub_id

      LEFT JOIN wishlist w 
        ON w.product_id = p.id
       AND w.buyer_id = ?

      LEFT JOIN product_reviews pr
        ON pr.product_id = p.id

      WHERE p.cat_sub_id = ?

      GROUP BY p.id
      ORDER BY p.id DESC
      `,
      [buyerId, id],
    );

    return res.status(200).json({
      success: true,
      data: rows,
    });
  } catch (err) {
    console.error("Error fetching products by subcategory:", err);

    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
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
