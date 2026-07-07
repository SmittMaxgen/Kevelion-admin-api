import { connectDB } from "../../connection/db.js";

// ======================= CREATE SUBSCRIPTION PACKAGE ===========================
export const createSubscriptionPackage = async (req, res) => {
  try {
    const pool = await connectDB();
    const {
      package_name,
      total_sales = 0,
      max_product_add = 0,
      payment_time = 10,
      package_price = 0,
      validity_days = 30,
      product_high_priority = "No",
      product_top_search = "No",
      product_supplier_tag = "No",
      package_created_by = null,
      package_status = "Active",
      is_free_plan = false,
    } = req.body;

    if (package_created_by) {
      await pool.query(
        `UPDATE subscription_package SET package_status = 'Inactive' WHERE package_created_by = ? AND package_status = 'Active'`,
        [package_created_by],
      );
    }

    const [result] = await pool.query(
      `INSERT INTO subscription_package
        (package_name, total_sales, max_product_add, payment_time, package_price, 
         validity_days, product_high_priority, product_top_search, product_supplier_tag, 
         package_created_by, package_status, is_free_plan)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        package_name,
        total_sales,
        max_product_add,
        payment_time,
        package_price,
        validity_days,
        product_high_priority,
        product_top_search,
        product_supplier_tag,
        package_created_by,
        package_status,
        is_free_plan,
      ],
    );

    res.status(201).json({
      message: "Subscription package created",
      package_id: result.insertId,
    });
  } catch (err) {
    console.error("Error creating subscription package:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ======================= GET ALL SUBSCRIPTION PACKAGES ===========================
export const getAllSubscriptionPackages = async (req, res) => {
  try {
    const pool = await connectDB();
    const [rows] = await pool.query(
      `SELECT * FROM subscription_package ORDER BY id DESC`,
    );
    res.status(200).json(rows);
  } catch (err) {
    console.error("Error fetching subscription packages:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ======================= GET SUBSCRIPTION PACKAGE BY ID ===========================
export const getSubscriptionPackageById = async (req, res) => {
  try {
    const pool = await connectDB();
    const { id } = req.params;

    const [rows] = await pool.query(
      `SELECT * FROM subscription_package WHERE id = ?`,
      [id],
    );
    if (rows.length === 0)
      return res
        .status(404)
        .json({ message: "Subscription package not found" });

    res.status(200).json(rows[0]);
  } catch (err) {
    console.error("Error fetching subscription package:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ======================= UPDATE SUBSCRIPTION PACKAGE ===========================
export const updateSubscriptionPackage = async (req, res) => {
  try {
    const pool = await connectDB();
    const { id } = req.params;
    const updates = req.body;

    const [existing] = await pool.query(
      `SELECT * FROM subscription_package WHERE id = ?`,
      [id],
    );
    if (existing.length === 0)
      return res
        .status(404)
        .json({ message: "Subscription package not found" });

    // Dynamically build the update query
    const fields = Object.keys(updates)
      .map((key) => `${key} = ?`)
      .join(", ");
    const values = Object.keys(updates).map(
      (key) => updates[key] ?? existing[0][key],
    );
    values.push(id);

    const query = `UPDATE subscription_package SET ${fields} WHERE id = ?`;
    await pool.query(query, values);

    res
      .status(200)
      .json({ message: "Subscription package updated successfully" });
  } catch (err) {
    console.error("Error updating subscription package:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const setFreePlanPackage = async (req, res) => {
  try {
    const pool = await connectDB();
    const { id } = req.params;

    // check if package exists
    const [existing] = await pool.query(
      `SELECT id FROM subscription_package WHERE id = ?`,
      [id],
    );

    if (existing.length === 0) {
      return res.status(404).json({ message: "Subscription package not found" });
    }

    // Step 1: set all packages to is_free_plan = false
    await pool.query(
      `UPDATE subscription_package SET is_free_plan = 0`
    );

    // Step 2: set only the selected package to is_free_plan = true
    await pool.query(
      `UPDATE subscription_package SET is_free_plan = 1 WHERE id = ?`,
      [id],
    );

    res.status(200).json({
      message: `Package ID ${id} set as the free plan. All others updated to false.`,
    });
  } catch (err) {
    console.error("Error updating free plan flag:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ======================= DELETE SUBSCRIPTION PACKAGE ===========================
export const deleteSubscriptionPackage = async (req, res) => {
  try {
    const pool = await connectDB();
    const { id } = req.params;

    const [existing] = await pool.query(
      `SELECT * FROM subscription_package WHERE id = ?`,
      [id],
    );
    if (existing.length === 0)
      return res
        .status(404)
        .json({ message: "Subscription package not found" });

    await pool.query(`DELETE FROM subscription_package WHERE id = ?`, [id]);
    res
      .status(200)
      .json({ message: "Subscription package deleted successfully" });
  } catch (err) {
    console.error("Error deleting subscription package:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
