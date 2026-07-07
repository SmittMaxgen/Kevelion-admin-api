import bcrypt from "bcrypt";
import { connectDB } from "../../connection/db.js";
import jwt from "jsonwebtoken";
//import jwt from "jsonwebtoken"; // ✅ Make sure this line exists

//const JWT_SECRET = "your_secret_key"; // ✅ define JWT secret key

import Razorpay from "razorpay";
import crypto from "crypto";

const RAZORPAY_KEY_ID = "rzp_test_SOEyd37AsrERPN";
const RAZORPAY_KEY_SECRET = "7m80crPTmM70cVUVMGJZolAJ";

const razorpay = new Razorpay({
  key_id: RAZORPAY_KEY_ID,
  key_secret: RAZORPAY_KEY_SECRET,
});

// ======================= CREATE SELLER + FREE TRIAL===========================
// ======================= CREATE SELLER + FREE TRIAL===========================
export const createSeller = async (req, res) => {
  try {
    const pool = await connectDB();

    // Step 1: Parse body data correctly
    let bodyData = {};

    if (req.headers["content-type"]?.includes("multipart/form-data")) {
      // For form-data → all text fields come as req.body (already strings)
      bodyData = req.body;
    } else {
      bodyData = req.body; // JSON
    }

    // Extract fields from bodyData
    const {
      name,
      mobile,
      email,
      password,
      device_token,
      company_name,
      company_type,
      company_GST_number,
      company_website,
      IEC_code,
      annual_turnover,
      facebook_link,
      linkedin_link,
      insta_link,
      city,
      state,
      pincode,
      aadhar_number,
      bank_name,
      bank_IFSC_code,
      account_number,
      account_type,
    } = bodyData;

    if (!email || !password)
      return res.status(400).json({ message: "email and password are required fields" });

    const [existingSeller] = await pool.query(
      "SELECT id FROM seller WHERE email = ? OR mobile = ?",
      [email, mobile],
    );
    if (existingSeller.length > 0)
      return res
        .status(400)
        .json({ message: "Email or Mobile already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const [sellerResult] = await pool.query(
      `INSERT INTO seller 
      (name, mobile, email, password, status, approve_status, device_token, subscription, current_package_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        mobile,
        email,
        hashedPassword,
        "Inactive",
        "Pending",
        device_token || "",
        false,
        null,
      ],
    );

    const sellerId = sellerResult.insertId;
    const getFilePath = (field) =>
      req.files?.[field]?.[0] ? `/uploads/${req.files[field][0].filename}` : "";

    // company
    await pool.query(
      `INSERT INTO seller_company_details 
      (seller_id, company_name, company_type, company_GST_number, company_logo, company_website, IEC_code, annual_turnover, facebook_link, linkedin_link, insta_link, city, state, pincode)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        sellerId,
        company_name || "",
        company_type || "other",
        company_GST_number || "",
        getFilePath("company_logo"),
        company_website || "",
        IEC_code || "",
        annual_turnover || "below 20 lakh",
        facebook_link || "",
        linkedin_link || "",
        insta_link || "",
        city || "",
        state || "",
        pincode || "",
      ],
    );

    // kyc
    await pool.query(
      `INSERT INTO seller_kyc_details 
      (seller_id, aadhar_number, aadhar_front, aadhar_back, company_registration, company_pan_card, gst_certificate)
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        sellerId,
        aadhar_number || "",
        getFilePath("aadhar_front"),
        getFilePath("aadhar_back"),
        getFilePath("company_registration"),
        getFilePath("company_pan_card"),
        getFilePath("gst_certificate"),
      ],
    );

    // bank
    await pool.query(
      `INSERT INTO seller_bank_details 
      (seller_id, cancelled_cheque_photo, bank_name, bank_IFSC_code, account_number, account_type)
      VALUES (?, ?, ?, ?, ?, ?)`,
      [
        sellerId,
        getFilePath("cancelled_cheque_photo"),
        bank_name || "",
        bank_IFSC_code || "",
        account_number || "",
        account_type || "",
      ],
    );

    // 🎁 Assign FREE TRIAL (dynamic package based on is_free_plan flag)
    const [freePlanRows] = await pool.query(
      `SELECT id, validity_days FROM subscription_package WHERE is_free_plan = 1 LIMIT 1`,
    );

    if (freePlanRows.length === 0) {
      return res.status(400).json({ message: "No free plan package is configured" });
    }

    const freePlanPackageId = freePlanRows[0].id;
    const trialDays = freePlanRows[0].validity_days || 90;

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + trialDays);

    const [sellerPackageResult] = await pool.query(
      `INSERT INTO seller_packages_history 
      (seller_id, package_id, package_start_date, package_end_date, amount_paid,payment_status, payment_mode)
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [sellerId, freePlanPackageId, startDate, endDate, 0, "paid", "free_trial"],
    );

    const sellerCurrentPackageId = sellerPackageResult.insertId;

    await pool.query(
      `UPDATE seller SET current_package_id=?, subscription=?, current_package_start=?, current_package_end=?, join_date=? WHERE id=?`,
      [sellerCurrentPackageId, freePlanPackageId, startDate, endDate, startDate, sellerId],
    );

    res.status(201).json({
      message: "Seller created successfully with 3-month free trial",
      seller_id: sellerId,
    });
  } catch (err) {
    console.error("❌ Error creating seller:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

/*
export const createSeller = async (req, res) => {
  try {
    const pool = await connectDB();

    let body = req.body;
    //if (typeof body === "string") body = JSON.parse(body);
    if (body.data && typeof body.data === "string") {
            body = JSON.parse(body.data);
    }

    const { seller = {}, company = {}, kyc = {}, bank = {} } = body;

    if (!seller.name || !seller.mobile || !seller.email || !seller.password)
      return res.status(400).json({ message: "Missing required fields" });

    const [existingSeller] = await pool.query(
      "SELECT id FROM seller WHERE email = ? OR mobile = ?",
      [seller.email, seller.mobile]
    ); 
    if (existingSeller.length > 0)
      return res.status(400).json({ message: "Email or Mobile already exists" });

    const hashedPassword = await bcrypt.hash(seller.password, 10);

    const [sellerResult] = await pool.query(
      `INSERT INTO seller 
      (name, mobile, email, password, status, approve_status, device_token, subscription, current_package_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        seller.name,
        seller.mobile,
        seller.email,
        hashedPassword,
        "Inactive",
        "Pending",
        seller.device_token || "",
        false,
        null,
      ]
    );

    const sellerId = sellerResult.insertId;
    const getFilePath = (field) =>
      req.files?.[field]?.[0] ? `/uploads/${req.files[field][0].filename}` : "";

    // company
    await pool.query(
      `INSERT INTO seller_company_details 
      (seller_id, company_name, company_type, company_GST_number, company_logo, company_website, IEC_code, annual_turnover, facebook_link, linkedin_link, insta_link, city, state, pincode)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        sellerId,
        company.company_name || "",
        company.company_type || "other",
        company.company_GST_number || "",
        getFilePath("company_logo"),
        company.company_website || "",
        company.IEC_code || "",
        company.annual_turnover || "below 20 lakh",
        company.facebook_link || "",
        company.linkedin_link || "",
        company.insta_link || "",
        company.city || "",
        company.state || "",
        company.pincode || "",
      ]
    );

    // kyc
    await pool.query(
      `INSERT INTO seller_kyc_details 
      (seller_id, aadhar_number, aadhar_front, aadhar_back, company_registration, company_pan_card, gst_certificate)
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        sellerId,
        kyc.aadhar_number || "",
        getFilePath("aadhar_front"),
        getFilePath("aadhar_back"),
        getFilePath("company_registration"),
        getFilePath("company_pan_card"),
        getFilePath("gst_certificate"),
      ]
    );

    // bank
    await pool.query(
      `INSERT INTO seller_bank_details 
      (seller_id, cancelled_cheque_photo, bank_name, bank_IFSC_code, account_number, account_type)
      VALUES (?, ?, ?, ?, ?, ?)`,
      [
        sellerId,
        getFilePath("cancelled_cheque_photo"),
        bank.bank_name || "",
        bank.bank_IFSC_code || "",
        bank.account_number || "",
        bank.account_type || "",
      ]
    );

    // 🎁 Assign FREE TRIAL (3 months)
    const trialDays = 90;
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + trialDays);

   const [sellerPackageResult] =  await pool.query(
      `INSERT INTO seller_packages_history 
      (seller_id, package_id, package_start_date, package_end_date, amount_paid,payment_status, payment_mode)
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [sellerId, 1, startDate, endDate, 0, "paid", "free_trial"]
    );

const sellerCurrentPackageId = sellerPackageResult.insertId;

    await pool.query(
      `UPDATE seller SET current_package_id=?, subscription=?, current_package_start=?, current_package_end=?, join_date=? WHERE id=?`,
      [sellerCurrentPackageId, 1,startDate, endDate,startDate, sellerId]
    );
    


    res.status(201).json({
      message: "Seller created successfully with 3-month free trial",
      seller_id: sellerId,
    });
  } catch (err) {
    console.error("❌ Error creating seller:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};*/

// ======================= GET ALL SELLERS ===========================
// export const getAllSellers = async (req, res) => {
//   try {
//     const pool = await connectDB();
//     // const [rows] = await pool.query(
//     //   `SELECT s.id, s.name, s.email, s.mobile, s.status, s.approve_status,
//     //   s.current_package_id,s.current_package_start,s.current_package_end,
//     //    c.company_name, c.city, c.state, c.pincode
//     //    FROM seller s
//     //    LEFT JOIN seller_company_details c ON s.id = c.seller_id
//     //    ORDER BY s.id DESC`,
//     // );
//     const [rows] = await pool.query(
//       `SELECT
//       s.id,
//       s.name,
//       s.email,
//       s.mobile,
//       s.status,
//       s.approve_status,
//       s.device_token,
//       s.join_date,
//       s.subscription,
//       s.current_package_id,
//       s.current_package_start,
//       s.current_package_end,
//       s.created_at,
//       s.updated_at,
//       s.address,

//       c.company_name,
//       c.city,
//       c.state,
//       c.pincode

//    FROM seller s
//    LEFT JOIN seller_company_details c
//      ON s.id = c.seller_id

//    ORDER BY s.id DESC`,
//     );
//     res.status(200).json(rows);
//   } catch (err) {
//     console.error("Error fetching sellers:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// };

export const getAllSellers = async (req, res) => {
  try {
    const pool = await connectDB();

    const [rows] = await pool.query(`
      SELECT 
        s.id,
        s.name,
        s.mobile,
        s.email,
        s.password,
        s.status,
        s.approve_status,
        s.device_token,
        s.join_date,
        s.subscription,
        s.current_package_id,
        s.current_package_start,
        s.current_package_end,
        s.created_at,
        s.updated_at,
        s.otp_code,
        s.otp_expiry,
        s.address,

        c.id AS company_id,
        c.seller_id AS company_seller_id,
        c.company_name,
        c.company_type,
        c.company_GST_number,
        c.company_logo,
        c.company_website,
        c.IEC_code,
        c.annual_turnover,
        c.facebook_link,
        c.linkedin_link,
        c.insta_link,
        c.city,
        c.state,
        c.pincode,
        c.created_at AS company_created_at,
        c.updated_at AS company_updated_at,

        k.id AS kyc_id,
        k.seller_id AS kyc_seller_id,
        k.aadhar_number,
        k.aadhar_front,
        k.aadhar_back,
        k.company_registration,
        k.company_pan_card,
        k.gst_certificate,

        b.id AS bank_id,
        b.seller_id AS bank_seller_id,
        b.cancelled_cheque_photo,
        b.bank_name,
        b.bank_IFSC_code,
        b.account_number,
        b.account_type

      FROM seller s

      LEFT JOIN seller_company_details c 
        ON s.id = c.seller_id

      LEFT JOIN seller_kyc_details k
        ON s.id = k.seller_id

      LEFT JOIN seller_bank_details b
        ON s.id = b.seller_id

      ORDER BY s.id DESC
    `);

    const formattedData = rows.map((row) => ({
      seller: {
        id: row.id,
        name: row.name,
        mobile: row.mobile,
        email: row.email,
        password: row.password,
        status: row.status,
        approve_status: row.approve_status,
        device_token: row.device_token,
        join_date: row.join_date,
        subscription: row.subscription,
        current_package_id: row.current_package_id,
        current_package_start: row.current_package_start,
        current_package_end: row.current_package_end,
        created_at: row.created_at,
        updated_at: row.updated_at,
        otp_code: row.otp_code,
        otp_expiry: row.otp_expiry,
        address: row.address,
      },

      company: {
        id: row.company_id,
        seller_id: row.company_seller_id,
        company_name: row.company_name,
        company_type: row.company_type,
        company_GST_number: row.company_GST_number,
        company_logo: row.company_logo,
        company_website: row.company_website,
        IEC_code: row.IEC_code,
        annual_turnover: row.annual_turnover,
        facebook_link: row.facebook_link,
        linkedin_link: row.linkedin_link,
        insta_link: row.insta_link,
        city: row.city,
        state: row.state,
        pincode: row.pincode,
        created_at: row.company_created_at,
        updated_at: row.company_updated_at,
      },

      kyc: {
        id: row.kyc_id,
        seller_id: row.kyc_seller_id,
        aadhar_number: row.aadhar_number,
        aadhar_front: row.aadhar_front,
        aadhar_back: row.aadhar_back,
        company_registration: row.company_registration,
        company_pan_card: row.company_pan_card,
        gst_certificate: row.gst_certificate,
      },

      bank: {
        id: row.bank_id,
        seller_id: row.bank_seller_id,
        cancelled_cheque_photo: row.cancelled_cheque_photo,
        bank_name: row.bank_name,
        bank_IFSC_code: row.bank_IFSC_code,
        account_number: row.account_number,
        account_type: row.account_type,
      },
    }));

    res.status(200).json(formattedData);
  } catch (err) {
    console.error("Error fetching sellers:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ======================= GET ALL SELLERS with Subscription Package ===========================
export const getAllSellerswithPackage = async (req, res) => {
  try {
    const pool = await connectDB();
    const [rows] = await pool.query(
      `SELECT s.id, s.name, s.email, s.mobile,s.approve_status, 
       c.company_name, c.city, c.state, c.pincode, ph.status, ph.package_end_date, ph.package_id, sp.package_name 
       FROM seller s 
       LEFT JOIN seller_company_details c ON s.id = c.seller_id
       LEFT JOIN seller_packages_history ph ON s.id = ph.seller_id 
       LEFT JOIN subscription_package sp ON sp.id = ph.package_id 
       WHERE ph.status = "Active"
       ORDER BY s.id DESC`,
    );
    res.status(200).json(rows);
  } catch (err) {
    console.error("Error fetching sellers:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ======================= GET SELLER BY ID ===========================
export const getSellerById = async (req, res) => {
  try {
    const pool = await connectDB();
    const { id } = req.params;

    const [sellerData] = await pool.query(`SELECT * FROM seller WHERE id = ?`, [
      id,
    ]);
    if (sellerData.length === 0)
      return res.status(404).json({ message: "Seller not found" });

    const [company] = await pool.query(
      `SELECT * FROM seller_company_details WHERE seller_id = ?`,
      [id],
    );
    const [kyc] = await pool.query(
      `SELECT * FROM seller_kyc_details WHERE seller_id = ?`,
      [id],
    );
    const [bank] = await pool.query(
      `SELECT * FROM seller_bank_details WHERE seller_id = ?`,
      [id],
    );

    res.status(200).json({
      seller: sellerData[0],
      company: company[0],
      kyc: kyc[0],
      bank: bank[0],
    });
  } catch (err) {
    console.error("Error fetching seller:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ======================= DELETE SELLER ===========================
export const deleteSeller = async (req, res) => {
  try {
    const pool = await connectDB();
    const { id } = req.params;

    const [seller] = await pool.query(`SELECT id FROM seller WHERE id = ?`, [
      id,
    ]);
    if (seller.length === 0)
      return res.status(404).json({ message: "Seller not found" });

    await pool.query(`DELETE FROM seller_bank_details WHERE seller_id = ?`, [
      id,
    ]);
    await pool.query(`DELETE FROM seller_kyc_details WHERE seller_id = ?`, [
      id,
    ]);
    await pool.query(`DELETE FROM seller_company_details WHERE seller_id = ?`, [
      id,
    ]);
    await pool.query(`DELETE FROM seller WHERE id = ?`, [id]);

    res.status(200).json({ message: "Seller deleted successfully" });
  } catch (err) {
    console.error("Error deleting seller:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ======================= GET ALL PENDING SELLERS ===========================
export const getAllPendingSellers = async (req, res) => {
  try {
    const pool = await connectDB();
    const [rows] = await pool.query(
      `SELECT s.id, s.name, s.email, s.mobile, s.status, s.approve_status, 
       c.company_name, c.city, c.state, c.pincode 
       FROM seller s 
       LEFT JOIN seller_company_details c ON s.id = c.seller_id
       WHERE s.approve_status = 'Pending'
       ORDER BY s.id DESC`,
    );
    res.status(200).json(rows);
  } catch (err) {
    console.error("Error fetching sellers:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ======================= UPDATE SELLER ===========================
export const updateSeller = async (req, res) => {
  try {
    const pool = await connectDB();
    const { id } = req.params;

    // Step 1: Parse body data correctly
    let bodyData = {};

    if (req.headers["content-type"]?.includes("multipart/form-data")) {
      // For form-data → all text fields come as req.body (already strings)
      bodyData = req.body;
    } else {
      bodyData = req.body; // JSON
    }

    // Extract fields from bodyData
    const {
      name,
      mobile,
      email,
      password,
      address,
      approve_status,
      device_token,
      subscription,
      current_package_id,
      company_name,
      company_type,
      company_GST_number,
      company_website,
      IEC_code,
      annual_turnover,
      facebook_link,
      linkedin_link,
      insta_link,
      city,
      state,
      pincode,
      aadhar_number,
      bank_name,
      bank_IFSC_code,
      account_number,
      account_type,
    } = bodyData;

    const [sellerRows] = await pool.query("SELECT * FROM seller WHERE id = ?", [
      id,
    ]);
    if (sellerRows.length === 0)
      return res.status(404).json({ message: "Seller not found" });

    const hashedPassword = password
      ? await bcrypt.hash(password, 10)
      : sellerRows[0].password;

    // ✅ Auto-calculate package start/end dates from validity_days
    let newPackageStart = sellerRows[0].current_package_start;
    let newPackageEnd = sellerRows[0].current_package_end;
    let resolvedPackageId = current_package_id ?? sellerRows[0].current_package_id;

    // If no package id passed from FE, fallback to the free plan package
    if (!current_package_id) {
      const [freePlanRows] = await pool.query(
        "SELECT id FROM subscription_package WHERE is_free_plan = 1 LIMIT 1",
      );

      if (freePlanRows.length > 0) {
        resolvedPackageId = freePlanRows[0].id;
      }
    }

    if (resolvedPackageId && resolvedPackageId !== sellerRows[0].current_package_id) {
      const [packageRows] = await pool.query(
        "SELECT validity_days FROM subscription_package WHERE id = ?",
        [resolvedPackageId],
      );

      if (packageRows.length === 0) {
        return res.status(400).json({ message: "Invalid subscription package id" });
      }

      const validityDays = packageRows[0].validity_days || 30;

      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(startDate.getDate() + validityDays);

      newPackageStart = startDate;
      newPackageEnd = endDate;
    }

    const getFilePath = (field) =>
      req.files?.[field]?.[0]
        ? `/uploads/${req.files[field][0].filename}`
        : null;

    // await pool.query(
    //   `UPDATE seller SET name=?, mobile=?, email=?, password=?, approve_status=?, device_token=?, subscription=?, current_package_id=? WHERE id=?`,
    //   [
    //     name || sellerRows[0].name,
    //     mobile || sellerRows[0].mobile,
    //     email || sellerRows[0].email,
    //     hashedPassword,
    //     approve_status || sellerRows[0].approve_status,
    //     device_token || sellerRows[0].device_token,
    //     subscription ?? sellerRows[0].subscription,
    //     current_package_id ?? sellerRows[0].current_package_id,
    //     id,
    //   ],
    // );

    await pool.query(
      `UPDATE seller SET name=?, mobile=?, email=?, password=?, address=? ,approve_status=?, device_token=?, subscription=?, current_package_id=? WHERE id=?`,
      [
        name || sellerRows[0].name,
        mobile || sellerRows[0].mobile,
        email || sellerRows[0].email,
        hashedPassword || sellerRows[0].password, // ✅ Fix 1: fallback to existing password
        address || sellerRows[0].address,
        approve_status ?? sellerRows[0].approve_status, // ✅ Fix 2: ?? instead of ||
        device_token || sellerRows[0].device_token,
        subscription ?? sellerRows[0].subscription,
        resolvedPackageId,
        newPackageStart,
        newPackageEnd,
        id,
      ],
    );
    // ✅ Update company
    const [companyRows] = await pool.query(
      "SELECT * FROM seller_company_details WHERE seller_id = ?",
      [id],
    );
    const testquery = await pool.query(
      `UPDATE seller_company_details SET 
        company_name=?, company_type=?, company_GST_number=?, company_logo=?, 
        company_website=?, IEC_code=?, annual_turnover=?, facebook_link=?, 
        linkedin_link=?, insta_link=?, city=?, state=?, pincode=? 
        WHERE seller_id=?`,
      [
        company_name || companyRows[0].company_name,
        company_type || companyRows[0].company_type,
        company_GST_number || companyRows[0].company_GST_number,
        getFilePath("company_logo") || companyRows[0].company_logo,
        company_website || companyRows[0].company_website,
        IEC_code || companyRows[0].IEC_code,
        annual_turnover || companyRows[0].annual_turnover,
        facebook_link || companyRows[0].facebook_link,
        linkedin_link || companyRows[0].linkedin_link,
        insta_link || companyRows[0].insta_link,
        city || companyRows[0].city,
        state || companyRows[0].state,
        pincode || companyRows[0].pincode,
        id,
      ],
    );

    // ✅ Update KYC
    const [kycRows] = await pool.query(
      "SELECT * FROM seller_kyc_details WHERE seller_id=?",
      [id],
    );
    await pool.query(
      `UPDATE seller_kyc_details SET aadhar_number=?, aadhar_front=?, aadhar_back=?, company_registration=?, company_pan_card=?, gst_certificate=? WHERE seller_id=?`,
      [
        aadhar_number || kycRows[0].aadhar_number,
        getFilePath("aadhar_front") || kycRows[0].aadhar_front,
        getFilePath("aadhar_back") || kycRows[0].aadhar_back,
        getFilePath("company_registration") || kycRows[0].company_registration,
        getFilePath("company_pan_card") || kycRows[0].company_pan_card,
        getFilePath("gst_certificate") || kycRows[0].gst_certificate,
        id,
      ],
    );

    // ✅ Update Bank
    const [bankRows] = await pool.query(
      "SELECT * FROM seller_bank_details WHERE seller_id=?",
      [id],
    );
    await pool.query(
      `UPDATE seller_bank_details SET cancelled_cheque_photo=?, bank_name=?, bank_IFSC_code=?, account_number=?, account_type=? WHERE seller_id=?`,
      [
        getFilePath("cancelled_cheque_photo") ||
          bankRows[0].cancelled_cheque_photo,
        bank_name || bankRows[0].bank_name,
        bank_IFSC_code || bankRows[0].bank_IFSC_code,
        account_number || bankRows[0].account_number,
        account_type || bankRows[0].account_type,
        id,
      ],
    );

    res.status(200).json({ message: "Seller updated successfully" });
  } catch (err) {
    console.error("Error updating seller:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ======================= RENEW OR UPGRADE PACKAGE ===========================
export const renewOrUpgradePackage = async (req, res) => {
  try {
    const pool = await connectDB();
    //const { seller_id, new_package_id, type } = req.body; // type = 'renew' or 'upgrade'
    const { seller_id, new_package_id } = req.body;

    const [pkg] = await pool.query(
      `SELECT * FROM subscription_package WHERE id=?`,
      [new_package_id],
    );
    if (pkg.length === 0)
      return res.status(404).json({ message: "Package not found" });

    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(startDate.getMonth() + pkg[0].duration_months);

    await pool.query(
      `UPDATE seller_packages_history SET status='Expired' WHERE seller_id=? AND status='Active'`,
      [seller_id],
    );

    const [sellerPackageResult] = await pool.query(
      `INSERT INTO seller_packages_history (seller_id, package_id, package_start_date, package_end_date, amount_paid, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [seller_id, new_package_id, startDate, endDate, pkg[0].price, "Active"],
    );

    const sellerCurrentPackageId = sellerPackageResult.insertId;
    await pool.query(
      `UPDATE seller SET current_package_id=?, subscription=? WHERE id=?`,
      [sellerCurrentPackageId, true, seller_id],
    );

    res.status(200).json({ message: `Package ${type} successful` });
  } catch (err) {
    console.error("Error renewing/upgrading package:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ======================= GET VENDOR PACKAGE HISTORY ===========================
export const getVendorPackages = async (req, res) => {
  try {
    const pool = await connectDB();
    const { seller_id } = req.params;

    const [rows] = await pool.query(
      `SELECT  sp.*,
    sp.id AS package_history_id ,
    p.package_name AS package_name, p.package_price,
    COALESCE(SUM(op.quantity * op.price), 0) AS total_sales
FROM 
    seller_packages_history sp
LEFT JOIN orders o
    ON o.created_at BETWEEN sp.package_start_date AND sp.package_end_date
LEFT JOIN order_products op
    ON op.order_id = o.id 
    AND op.seller_id = sp.seller_id
LEFT JOIN subscription_package p ON sp.package_id = p.id
WHERE 
    sp.seller_id = ?
GROUP BY 
    sp.id, sp.package_id, sp.package_start_date, sp.package_end_date
ORDER BY 
    sp.package_start_date DESC`,
      [seller_id],
    );

    /*SELECT  sp.*,
    sp.id AS package_history_id ,
    p.package_name AS package_name, p.package_price,
    COALESCE(SUM(op.quantity * op.price), 0) AS total_sales
FROM 
    seller_packages_history sp
LEFT JOIN orders o
    ON o.created_at BETWEEN sp.package_start_date AND sp.package_end_date
LEFT JOIN order_products op
    ON op.order_id = o.id 
    AND op.seller_id = sp.seller_id
LEFT JOIN subscription_package p ON sp.package_id = p.id
WHERE 
    sp.seller_id = ?
GROUP BY 
    sp.id, sp.package_id, sp.package_start_date, sp.package_end_date
ORDER BY 
    sp.package_start_date DESC;
    */

    res.status(200).json(rows);
    console(rows);
  } catch (err) {
    console.error("Error fetching vendor packages:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ======================= CREATE VENDOR PACKAGE HISTORY ===========================

// export const createVendorPackage = async (req, res) => {
//   try {
//     const pool = await connectDB();
//     const { seller_id } = req.params;
//     const { package_id, package_start_date, package_end_date } = req.body;

//     // Validate required fields
//     if (!package_id || !package_start_date || !package_end_date) {
//       return res.status(400).json({
//         message:
//           "package_id, package_start_date, and package_end_date are required.",
//       });
//     }

//     // Check if the package exists
//     const [packageExists] = await pool.query(
//       `SELECT id FROM subscription_package WHERE id = ?`,
//       [package_id],
//     );

//     if (packageExists.length === 0) {
//       return res
//         .status(404)
//         .json({ message: "Subscription package not found." });
//     }

//     // Check for overlapping active packages for this seller
//     const [overlap] = await pool.query(
//       `SELECT id FROM seller_packages_history
//        WHERE seller_id = ?
//          AND package_start_date < ?
//          AND package_end_date > ?`,
//       [seller_id, package_end_date, package_start_date],
//     );

//     if (overlap.length > 0) {
//       return res.status(409).json({
//         message:
//           "Seller already has an active package overlapping this date range.",
//       });
//     }

//     // Insert the new subscription
//     const [result] = await pool.query(
//       `INSERT INTO seller_packages_history (seller_id, package_id, package_start_date, package_end_date)
//        VALUES (?, ?, ?, ?)`,
//       [seller_id, package_id, package_start_date, package_end_date],
//     );

//     res.status(201).json({
//       message: "Subscription created successfully.",
//       package_history_id: result.insertId,
//     });
//   } catch (err) {
//     console.error("Error creating vendor package:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// };

export const createVendorPackage = async (req, res) => {
  try {
    const pool = await connectDB();
    const { seller_id } = req.params;
    const { package_id, package_start_date, package_end_date } = req.body;

    if (!package_id || !package_start_date || !package_end_date) {
      return res.status(400).json({
        message:
          "package_id, package_start_date, and package_end_date are required.",
      });
    }

    // Fetch package — update 'price' if your column name is different
    const [packages] = await pool.query(
      `SELECT id, package_name, package_price FROM subscription_package WHERE id = ?`,
      [package_id],
    );

    if (packages.length === 0) {
      return res
        .status(404)
        .json({ message: "Subscription package not found." });
    }

    const pkg = packages[0];

    // Check overlapping
    const [overlap] = await pool.query(
      `SELECT id FROM seller_packages_history
       WHERE seller_id = ?
         AND package_start_date < ?
         AND package_end_date > ?`,
      [seller_id, package_end_date, package_start_date],
    );

    if (overlap.length > 0) {
      return res.status(409).json({
        message:
          "Seller already has an active package overlapping this date range.",
      });
    }

    // Create Razorpay order
    const order = await razorpay.orders.create({
      amount: Math.round(parseFloat(pkg.package_price) * 100),
      currency: "INR",
      receipt: `SUB-${Date.now()}`,
      notes: {
        seller_id: String(seller_id),
        package_id: String(package_id),
        package_name: String(pkg.package_name || ""),
        package_start_date: String(package_start_date),
        package_end_date: String(package_end_date),
      },
    });

    res.status(200).json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      key_id: RAZORPAY_KEY_ID,
      notes: order.notes,
    });
  } catch (err) {
    console.error("Error creating vendor package:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const verifyVendorPackagePayment = async (req, res) => {
  try {
    const { seller_id } = req.params;
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        message:
          "razorpay_order_id, razorpay_payment_id, and razorpay_signature are required.",
      });
    }

    // Verify signature
    const expectedSignature = crypto
      .createHmac("sha256", RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: "Invalid payment signature" });
    }

    // Fetch from Razorpay
    const payment = await razorpay.payments.fetch(razorpay_payment_id);
    const order = await razorpay.orders.fetch(razorpay_order_id);

    const { package_id, package_name, package_start_date, package_end_date } =
      order.notes;

    const pool = await connectDB();

    // Save to payment_transactions
    await pool.query(
      `INSERT INTO payment_transactions
        (order_id, payment_id, signature, amount, currency, status, method, email, contact, name, seller_id, buyer_id, product_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        payment.amount / 100,
        payment.currency,
        payment.status,
        payment.method,
        payment.email || null,
        payment.contact || null,
        package_name || null,
        seller_id,
        null,
        package_id || null,
      ],
    );

    // Activate subscription
    // const [result] = await pool.query(
    //   `INSERT INTO seller_packages_history
    //     (seller_id, package_id, package_start_date, package_end_date, payment_id)
    //    VALUES (?, ?, ?, ?, ?)`,
    //   [
    //     seller_id,
    //     package_id,
    //     package_start_date,
    //     package_end_date,
    //     razorpay_payment_id,
    //   ],
    // );

    // ✅ Expire all previous active packages of this seller
    await pool.query(
      `UPDATE seller_packages_history 
   SET status = 'Expired'
   WHERE seller_id = ? AND status = 'Active'`,
      [seller_id],
    );

    // ✅ Insert new active package
    const [result] = await pool.query(
      `INSERT INTO seller_packages_history
    (
      seller_id,
      package_id,
      package_start_date,
      package_end_date,
      payment_id,
      status
    )
   VALUES (?, ?, ?, ?, ?, ?)`,
      [
        seller_id,
        package_id,
        package_start_date,
        package_end_date,
        razorpay_payment_id,
        "Active",
      ],
    );

    // ✅ Update seller current package
    await pool.query(
      `UPDATE seller 
   SET current_package_id = ?, subscription = 1
   WHERE id = ?`,
      [result.insertId, seller_id],
    );

    res.status(200).json({
      status: "Payment Successful",
      message: "Subscription activated successfully.",
      package_history_id: result.insertId,
      order_id: razorpay_order_id,
      payment_id: razorpay_payment_id,
      amount: payment.amount / 100,
      currency: payment.currency || null,
      method: payment.method || null,
      seller_id,
      package_id,
      package_start_date,
      package_end_date,
    });
  } catch (error) {
    console.error("Error verifying vendor package payment:", error);
    res
      .status(500)
      .json({ message: "Verification failed", error: error.message });
  }
};

export const deleteVendorPackage = async (req, res) => {
  try {
    const pool = await connectDB();
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: "Id required !" });
    }

    const [existing] = await pool.query(
      `SELECT id FROM seller_packages_history WHERE id = ?`,
      [id],
    );

    if (existing.length === 0) {
      return res.status(404).json({ message: "Package history not found." });
    }

    await pool.query(`DELETE FROM seller_packages_history WHERE id = ?`, [id]);

    res.status(200).json({ message: "Package history deleted successfully." });
  } catch (err) {
    console.error("Error deleting vendor package:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ======================= ADMIN APPROVE / ACTIVATE VENDOR PACKAGE ===========================
export const approveVendorPackage = async (req, res) => {
  try {
    const pool = await connectDB();
    const { seller_id, package_id } = req.body;

    const [pkg] = await pool.query(
      `SELECT * FROM subscription_package WHERE id=?`,
      [package_id],
    );
    if (pkg.length === 0)
      return res.status(404).json({ message: "Package not found" });

    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(startDate.getMonth() + pkg[0].duration_months);

    const [sellerPackageResult] = await pool.query(
      `INSERT INTO seller_packages_history (seller_id, package_id, package_start_date, package_end_date, amount_paid, approval_status, payment_mode)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        seller_id,
        package_id,
        startDate,
        endDate,
        pkg[0].package_price,
        "approved",
        "online",
      ],
    );

    const sellerCurrentPackageId = sellerPackageResult.insertId;

    await pool.query(
      `UPDATE seller SET current_package_id=?, subscription=?, approve_status=? WHERE id=?`,
      [sellerCurrentPackageId, 1, "Approved", seller_id],
    );

    res.status(200).json({ message: "Vendor package approved and activated" });
  } catch (err) {
    console.error("Error approving package:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
//============================ Send OTP=================================
export const sendLoginOtp = async (req, res) => {
  try {
    const pool = await connectDB();
    const { mobile } = req.body;

    if (!mobile) {
      return res.status(400).json({ message: "Mobile number is required" });
    }

    // Check seller exists
    const [user] = await pool.query("SELECT * FROM seller WHERE mobile = ?", [
      mobile,
    ]);

    if (user.length === 0) {
      return res.status(404).json({ message: "Seller not found" });
    }

    // Generate OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    // Set expiry for 5 minutes
    const expiry = new Date(Date.now() + 5 * 60 * 1000);

    // Save to DB
    await pool.query(
      "UPDATE seller SET otp_code = ?, otp_expiry = ? WHERE mobile = ?",
      [otp, expiry, mobile],
    );

    // TODO: Send SMS using SMS API like Twilio, MSG91, etc.
    console.log(`OTP for ${mobile} = ${otp}`);

    res.json({
      message: `OTP sent to ${mobile}`,
      success: true,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server Error123", error: error.message });
  }
};

//====================== verify otp=============================
export const verifyOtp = async (req, res) => {
  try {
    const pool = await connectDB();
    const { mobile, otp } = req.body;

    if (!mobile || !otp) {
      return res.status(400).json({ message: "Mobile & OTP required" });
    }

    const [user] = await pool.query("SELECT * FROM seller WHERE mobile = ?", [
      mobile,
    ]);

    if (user.length === 0) {
      return res.status(404).json({ message: "Seller not found" });
    }

    const seller = user[0];

    // Check OTP correctness
    if (seller.otp_code !== otp) {
      return res.status(401).json({ message: "Invalid OTP" });
    }

    // Check expiry
    if (new Date(seller.otp_expiry) < new Date()) {
      return res.status(401).json({ message: "OTP expired" });
    }

    // OTP Success → Generate Token
    const token = jwt.sign(
      {
        seller_id: seller.id,
        mobile: seller.mobile,
      },
      "SECRET_KEY", // change this to secure key
      { expiresIn: "7d" },
    );
    // Check token
    if (token == "") {
      return res
        .status(401)
        .json({ message: "token not generate", data: seller.id });
    }

    // Clear OTP
    await pool.query(
      "UPDATE seller SET otp_code = NULL, otp_expiry = NULL WHERE id = ?",
      [seller.id],
    );

    res.json({
      message: "Login successful",
      token,
      seller,
      success: true,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server Error 123", error: error.message });
  }
};

//=======================seller login  ===========================
/**
 * Fields: email, password
 */
export const sellerLogin = async (req, res) => {
  try {
    const pool = await connectDB();
    const { email, password } = req.body;

    // Basic validation
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required." });
    }

    // Find user by email
    const [sellerRows] = await pool.query(
      "SELECT * FROM seller WHERE email = ?",
      [email],
    );
    if (sellerRows.length === 0) {
      return res
        .status(404)
        .json({ message: "Seller with this email id not found" });
    }

    const seller = sellerRows[0];

    // 2️⃣ Compare password using bcrypt
    const isMatch = await bcrypt.compare(password, seller.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const [rows] = await pool.query(
      `
  SELECT 
      sp.max_product_add, 
      COUNT(p.id) AS total_product,
      (sp.max_product_add - COUNT(p.id)) AS remaining_slots
  FROM seller_packages_history sph
  JOIN subscription_package sp ON sph.package_id = sp.id
  LEFT JOIN product p ON p.seller_id = sph.seller_id
  WHERE sph.status = 'active' AND sph.seller_id = ?
  GROUP BY sph.id, sp.max_product_add;
`,
      [seller.id],
    );

    // const limitInfo = rows[0];

    // const remaining = limitInfo.remaining_slots ?? 0;

    const limitInfo = rows[0] ?? null;

    const remaining = limitInfo?.remaining_slots ?? 0;
    /*
     // 3️⃣ Generate JWT token
    const token = jwt.sign(
      { id: seller.id, email: seller.email, role: "seller" },
      JWT_SECRET,
      { expiresIn: "7d" }
    );*/

    // 4️⃣ Return success response
    res.json({
      message: "Login successful",
      //token,
      seller: {
        id: seller.id,
        name: seller.name,
        email: seller.email,
        mobile: seller.mobile,
        status: seller.status,
        approve_status: seller.approve_status,
        remaining_product: remaining,
      },
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ======================= CHANGE PASSWORD ===========================
export const changeSellerPassword = async (req, res) => {
  try {
    const pool = await connectDB();
    const { id } = req.params;
    const { old_password, new_password, confirm_password } = req.body;

    // ── 1. Input validation ──────────────────────────────────────────
    if (!old_password || !new_password || !confirm_password) {
      return res.status(400).json({
        success: false,
        message:
          "old_password, new_password, and confirm_password are required.",
      });
    }

    if (new_password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 8 characters long.",
      });
    }

    if (new_password !== confirm_password) {
      return res.status(400).json({
        success: false,
        message: "new_password and confirm_password do not match.",
      });
    }

    if (old_password === new_password) {
      return res.status(400).json({
        success: false,
        message: "New password must be different from the current password.",
      });
    }

    // ── 2. Fetch seller ──────────────────────────────────────────────
    const [sellerRows] = await pool.query(
      "SELECT id, password FROM seller WHERE id = ?",
      [id],
    );

    if (sellerRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Seller not found.",
      });
    }

    const seller = sellerRows[0];

    // ── 3. Verify old password ───────────────────────────────────────
    const isMatch = await bcrypt.compare(old_password, seller.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect.",
      });
    }

    // ── 4. Hash & update ─────────────────────────────────────────────
    const hashedPassword = await bcrypt.hash(new_password, 10);

    await pool.query(
      "UPDATE seller SET password = ?, updated_at = NOW() WHERE id = ?",
      [hashedPassword, id],
    );

    return res.status(200).json({
      success: true,
      message: "Password changed successfully.",
    });
  } catch (err) {
    console.error("❌ Error changing seller password:", err);
    return res.status(500).json({
      success: false,
      message: "Server error.",
      error: err.message,
    });
  }
};

// ======================= FORGOT PASSWORD (Direct) ===========================
export const forgotSellerPassword = async (req, res) => {
  try {
    const pool = await connectDB();
    const { email, new_password, confirm_password } = req.body;

    // ── 1. Input validation ──────────────────────────────────────────
    if (!email || !new_password || !confirm_password) {
      return res.status(400).json({
        success: false,
        message: "email, new_password, and confirm_password are required.",
      });
    }

    if (new_password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 8 characters long.",
      });
    }

    if (new_password !== confirm_password) {
      return res.status(400).json({
        success: false,
        message: "new_password and confirm_password do not match.",
      });
    }

    // ── 2. Check email exists ────────────────────────────────────────
    const [sellerRows] = await pool.query(
      "SELECT id FROM seller WHERE email = ?",
      [email],
    );

    if (sellerRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No seller account found with this email.",
      });
    }

    // ── 3. Hash & update ─────────────────────────────────────────────
    const hashedPassword = await bcrypt.hash(new_password, 10);

    await pool.query(
      "UPDATE seller SET password = ?, updated_at = NOW() WHERE email = ?",
      [hashedPassword, email],
    );

    return res.status(200).json({
      success: true,
      message: "Password reset successfully.",
    });
  } catch (err) {
    console.error("❌ Error in forgot password:", err);
    return res.status(500).json({
      success: false,
      message: "Server error.",
      error: err.message,
    });
  }
};
/*export const updateSeller = async (req, res) => {
  try {
    const pool = await connectDB();
    const { id } = req.params;
    const updates = req.body;

    // Parse JSON string if content-type is not application/json
    // (Some clients send as string)
    let parsedBody = updates;
    if (typeof updates === "string") {
      parsedBody = JSON.parse(updates);
    }

    const { seller = {}, company = {}, kyc = {}, bank = {} } = parsedBody;

    // Get existing data
    const [sellerRows] = await pool.query("SELECT * FROM seller WHERE id = ?", [id]);
    if (sellerRows.length === 0)
      return res.status(404).json({ message: "Seller not found" });

    // 🔒 Hash password if new one provided
    const hashedPassword = seller.password
      ? await bcrypt.hash(seller.password, 10)
      : sellerRows[0].password;

    // ✅ Update Seller Table
    await pool.query(
      `UPDATE seller SET name=?, mobile=?, email=?, password=?, status=?, approve_status=?, device_token=?, subscription=?, subscription_package_id=? WHERE id=?`,
      [
        seller.name || sellerRows[0].name,
        seller.mobile || sellerRows[0].mobile,
        seller.email || sellerRows[0].email,
        hashedPassword,
        seller.status || sellerRows[0].status,
        seller.approve_status || sellerRows[0].approve_status,
        seller.device_token || sellerRows[0].device_token,
        seller.subscription ?? sellerRows[0].subscription,
        seller.subscription_package_id ?? sellerRows[0].subscription_package_id,
        id,
      ]
    );

    // ✅ Update Company Details
    const [companyRows] = await pool.query(
      "SELECT * FROM seller_company_details WHERE seller_id=?",
      [id]
    );

    await pool.query(
      `UPDATE seller_company_details SET company_name=?, company_type=?, company_GST_number=?, company_logo=?, company_website=?, IEC_code=?, annual_turnover=?, facebook_link=?, linkedin_link=?, insta_link=?, city=?, state=?, pincode=? WHERE seller_id=?`,
      [
        company.company_name || companyRows[0].company_name,
        company.company_type || companyRows[0].company_type,
        company.company_GST_number || companyRows[0].company_GST_number,
        company.company_logo || companyRows[0].company_logo,
        company.company_website || companyRows[0].company_website,
        company.IEC_code || companyRows[0].IEC_code,
        company.annual_turnover || companyRows[0].annual_turnover,
        company.facebook_link || companyRows[0].facebook_link,
        company.linkedin_link || companyRows[0].linkedin_link,
        company.insta_link || companyRows[0].insta_link,
        company.city || companyRows[0].city,
        company.state || companyRows[0].state,
        company.pincode || companyRows[0].pincode,
        id,
      ]
    );
    

    // ✅ Update KYC Details
    const [kycRows] = await pool.query(
      "SELECT * FROM seller_kyc_details WHERE seller_id=?",
      [id]
    );
    await pool.query(
      `UPDATE seller_kyc_details SET aadhar_number=?, aadhar_front=?, aadhar_back=?, company_registration=?, company_pan_card=?, gst_certificate=? WHERE seller_id=?`,
      [
        kyc.aadhar_number || kycRows[0].aadhar_number,
        kyc.aadhar_front || kycRows[0].aadhar_front,
        kyc.aadhar_back || kycRows[0].aadhar_back,
        kyc.company_registration || kycRows[0].company_registration,
        kyc.company_pan_card || kycRows[0].company_pan_card,
        kyc.gst_certificate || kycRows[0].gst_certificate,
        id,
      ]
    );

    // ✅ Update Bank Details
    const [bankRows] = await pool.query(
      "SELECT * FROM seller_bank_details WHERE seller_id=?",
      [id]
    );
    await pool.query(
      `UPDATE seller_bank_details SET cancelled_cheque_photo=?, bank_name=?, bank_IFSC_code=?, account_number=?, account_type=? WHERE seller_id=?`,
      [
        bank.cancelled_cheque_photo || bankRows[0].cancelled_cheque_photo,
        bank.bank_name || bankRows[0].bank_name,
        bank.bank_IFSC_code || bankRows[0].bank_IFSC_code,
        bank.account_number || bankRows[0].account_number,
        bank.account_type || bankRows[0].account_type,
        id,
      ]
    );

    res.status(200).json({ message: "Seller updated successfully" });
  } catch (err) {
    console.error("Error updating seller:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};*/

/*
export const updateSeller = async (req, res) => {
  try {
    const pool = await connectDB();
    const { id } = req.params;
    const updates = req.body;

    // Get existing seller
    const [sellerRows] = await pool.query("SELECT * FROM seller WHERE id = ?", [id]);
    if (sellerRows.length === 0) return res.status(404).json({ message: "Seller not found" });

    // Hash password if updated
    const hashedPassword = updates.password ? await bcrypt.hash(updates.password, 10) : sellerRows[0].password;

    // Update main seller table
    await pool.query(
      `UPDATE seller SET name=?, mobile=?, email=?, password=?, status=?, approve_status=?, device_token=?, subscription=?, subscription_package_id=? WHERE id=?`,
      [
        updates.name || sellerRows[0].name,
        updates.mobile || sellerRows[0].mobile,
        updates.email || sellerRows[0].email,
        hashedPassword,
        updates.status || sellerRows[0].status,
        updates.approve_status || sellerRows[0].approve_status,
        updates.device_token || sellerRows[0].device_token,
        updates.subscription ?? sellerRows[0].subscription,
        updates.subscription_package_id ?? sellerRows[0].subscription_package_id,
        id,
      ]
    );

    // Update company, KYC, bank tables similarly
    const [companyRows] = await pool.query("SELECT * FROM seller_company_details WHERE seller_id=?", [id]);
   // if (companyRows.length > 0) {
      await pool.query(
        `UPDATE seller_company_details SET company_name=?, company_type=?, company_GST_number=?, company_logo=?, company_website=?, IEC_code=?, annual_turnover=?, facebook_link=?, linkedin_link=?, insta_link=?, city=?, state=?, pincode=? WHERE seller_id=?`,
        [
          updates.company_name || companyRows[0].company_name,
          updates.company_type || companyRows[0].company_type,
          updates.company_GST_number || companyRows[0].company_GST_number,
          updates.company_logo || companyRows[0].company_logo,
          updates.company_website || companyRows[0].company_website,
          updates.IEC_code || companyRows[0].IEC_code,
          updates.annual_turnover || companyRows[0].annual_turnover,
          updates.facebook_link || companyRows[0].facebook_link,
          updates.linkedin_link || companyRows[0].linkedin_link,
          updates.insta_link || companyRows[0].insta_link,
          updates.city || companyRows[0].city,
          updates.state || companyRows[0].state,
          updates.pincode || companyRows[0].pincode,
          id,
        ]
      );
    //}

    const [kycRows] = await pool.query("SELECT * FROM seller_kyc_details WHERE seller_id=?", [id]);
    //if (kycRows.length > 0) {
      await pool.query(
        `UPDATE seller_kyc_details SET aadhar_number=?, aadhar_front=?, aadhar_back=?, company_registration=?, company_pan_card=?, gst_certificate=? WHERE seller_id=?`,
        [
          updates.aadhar_number || kycRows[0].aadhar_number,
          updates.aadhar_front || kycRows[0].aadhar_front,
          updates.aadhar_back || kycRows[0].aadhar_back,
          updates.company_registration || kycRows[0].company_registration,
          updates.company_pan_card || kycRows[0].company_pan_card,
          updates.gst_certificate || kycRows[0].gst_certificate,
          id,
        ]
      );
   // }

    const [bankRows] = await pool.query("SELECT * FROM seller_bank_details WHERE seller_id=?", [id]);
    //if (bankRows.length > 0) {
      await pool.query(
        `UPDATE seller_bank_details SET cancelled_cheque_photo=?, bank_name=?, bank_IFSC_code=?, account_number=?, account_type=? WHERE seller_id=?`,
        [
          updates.cancelled_cheque_photo || bankRows[0].cancelled_cheque_photo,
          updates.bank_name || bankRows[0].bank_name,
          updates.bank_IFSC_code || bankRows[0].bank_IFSC_code,
          updates.account_number || bankRows[0].account_number,
          updates.account_type || bankRows[0].account_type,
          id,
        ]
      );
   // }

    res.status(200).json({ message: "Seller updated successfully" });
  } catch (err) {
    console.error("Error updating seller:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};*/
