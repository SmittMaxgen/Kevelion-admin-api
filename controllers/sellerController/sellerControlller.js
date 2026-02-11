import bcrypt from "bcrypt";
import { connectDB } from "../../connection/db.js";
import jwt from "jsonwebtoken";
//import jwt from "jsonwebtoken"; // ✅ Make sure this line exists

//const JWT_SECRET = "your_secret_key"; // ✅ define JWT secret key


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
      account_type
    } = bodyData;


    if (!name || !mobile || !email || !password)
      return res.status(400).json({ message: "Missing required fields" });

    const [existingSeller] = await pool.query(
      "SELECT id FROM seller WHERE email = ? OR mobile = ?",
      [email, mobile]
    ); 
    if (existingSeller.length > 0)
      return res.status(400).json({ message: "Email or Mobile already exists" });

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
      ]
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
        bank_name || "",
        bank_IFSC_code || "",
        account_number || "",
        account_type || "",
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
export const getAllSellers = async (req, res) => {
  try {
    const pool = await connectDB();
    const [rows] = await pool.query(
      `SELECT s.id, s.name, s.email, s.mobile, s.status, s.approve_status, 
      s.current_package_id,s.current_package_start,s.current_package_end,
       c.company_name, c.city, c.state, c.pincode 
       FROM seller s 
       LEFT JOIN seller_company_details c ON s.id = c.seller_id
       ORDER BY s.id DESC`
    );
    res.status(200).json(rows);
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
       ORDER BY s.id DESC`
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

    const [sellerData] = await pool.query(`SELECT * FROM seller WHERE id = ?`, [id]);
    if (sellerData.length === 0)
      return res.status(404).json({ message: "Seller not found" });

    const [company] = await pool.query(`SELECT * FROM seller_company_details WHERE seller_id = ?`, [id]);
    const [kyc] = await pool.query(`SELECT * FROM seller_kyc_details WHERE seller_id = ?`, [id]);
    const [bank] = await pool.query(`SELECT * FROM seller_bank_details WHERE seller_id = ?`, [id]);

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

    const [seller] = await pool.query(`SELECT id FROM seller WHERE id = ?`, [id]);
    if (seller.length === 0)
      return res.status(404).json({ message: "Seller not found" });

    await pool.query(`DELETE FROM seller_bank_details WHERE seller_id = ?`, [id]);
    await pool.query(`DELETE FROM seller_kyc_details WHERE seller_id = ?`, [id]);
    await pool.query(`DELETE FROM seller_company_details WHERE seller_id = ?`, [id]);
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
       ORDER BY s.id DESC`
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
      account_type
    } = bodyData;






    const [sellerRows] = await pool.query("SELECT * FROM seller WHERE id = ?", [id]);
    if (sellerRows.length === 0)
      return res.status(404).json({ message: "Seller not found" });

    const hashedPassword = password
      ? await bcrypt.hash(password, 10)
      : sellerRows[0].password;

    const getFilePath = (field) =>
      req.files?.[field]?.[0] ? `/uploads/${req.files[field][0].filename}` : null;

    await pool.query(
      `UPDATE seller SET name=?, mobile=?, email=?, password=?, approve_status=?, device_token=?, subscription=?, current_package_id=? WHERE id=?`,
      [
        name || sellerRows[0].name,
        mobile || sellerRows[0].mobile,
        email || sellerRows[0].email,
        hashedPassword,
        approve_status || sellerRows[0].approve_status,
        device_token || sellerRows[0].device_token,
        subscription ?? sellerRows[0].subscription,
        current_package_id ?? sellerRows[0].current_package_id,
        id,
      ]
    );

    
    // ✅ Update company
    const [companyRows] = await pool.query(
      "SELECT * FROM seller_company_details WHERE seller_id = ?",
      [id]
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
      ]
    );

    // ✅ Update KYC
    const [kycRows] = await pool.query(
      "SELECT * FROM seller_kyc_details WHERE seller_id=?",
      [id]
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
      ]
    );

    // ✅ Update Bank
    const [bankRows] = await pool.query(
      "SELECT * FROM seller_bank_details WHERE seller_id=?",
      [id]
    );
    await pool.query(
      `UPDATE seller_bank_details SET cancelled_cheque_photo=?, bank_name=?, bank_IFSC_code=?, account_number=?, account_type=? WHERE seller_id=?`,
      [
        getFilePath("cancelled_cheque_photo") || bankRows[0].cancelled_cheque_photo,
        bank_name || bankRows[0].bank_name,
        bank_IFSC_code || bankRows[0].bank_IFSC_code,
        account_number || bankRows[0].account_number,
        account_type || bankRows[0].account_type,
        id,
      ]
    );




    res.status(200).json({ message: "Seller updated successfully"});
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

    const [pkg] = await pool.query(`SELECT * FROM subscription_package WHERE id=?`, [new_package_id]);
    if (pkg.length === 0) return res.status(404).json({ message: "Package not found" });

    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(startDate.getMonth() + pkg[0].duration_months);

    await pool.query(
      `UPDATE seller_packages_history SET status='Expired' WHERE seller_id=? AND status='Active'`,
      [seller_id]
    );

    const [sellerPackageResult] =await pool.query(
      `INSERT INTO seller_packages_history (seller_id, package_id, package_start_date, package_end_date, amount_paid, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [seller_id, new_package_id, startDate, endDate, pkg[0].price, "Active"]
    );

    const sellerCurrentPackageId = sellerPackageResult.insertId;
    await pool.query(
      `UPDATE seller SET current_package_id=?, subscription=? WHERE id=?`,
      [sellerCurrentPackageId, true, seller_id]
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
      [seller_id]
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

// ======================= ADMIN APPROVE / ACTIVATE VENDOR PACKAGE ===========================
export const approveVendorPackage = async (req, res) => {
  try {
    const pool = await connectDB();
    const { seller_id, package_id } = req.body;

    const [pkg] = await pool.query(`SELECT * FROM subscription_package WHERE id=?`, [package_id]);
    if (pkg.length === 0) return res.status(404).json({ message: "Package not found" });

    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(startDate.getMonth() + pkg[0].duration_months);

   const [sellerPackageResult] =  await pool.query(
      `INSERT INTO seller_packages_history (seller_id, package_id, package_start_date, package_end_date, amount_paid, approval_status, payment_mode)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [seller_id, package_id, startDate, endDate, pkg[0].package_price, "approved", "online"]
    );

 const sellerCurrentPackageId = sellerPackageResult.insertId;

    await pool.query(
      `UPDATE seller SET current_package_id=?, subscription=?, approve_status=? WHERE id=?`,
      [sellerCurrentPackageId, 1, "Approved", seller_id]
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
        const [user] = await pool.query(
            "SELECT * FROM seller WHERE mobile = ?",
            [mobile]
        );

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
            [otp, expiry, mobile]
        );

        // TODO: Send SMS using SMS API like Twilio, MSG91, etc.
        console.log(`OTP for ${mobile} = ${otp}`);

        res.json({
            message: `OTP sent to ${mobile}`,
            success: true
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server Error123",error : error.message });
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

        const [user] = await pool.query(
            "SELECT * FROM seller WHERE mobile = ?",
            [mobile]
        );

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
            "SECRET_KEY",   // change this to secure key
            { expiresIn: "7d" }
        );
        // Check token
        if (token == "") {
            return res.status(401).json({ message: "token not generate" ,data: seller.id});
        }
        
        
        // Clear OTP
        await pool.query(
            "UPDATE seller SET otp_code = NULL, otp_expiry = NULL WHERE id = ?",
            [seller.id]
        );

        res.json({
            message: "Login successful",
            token,
            seller,
            success: true
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server Error 123",error: error.message });
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
      return res.status(400).json({ message: "Email and password are required." });
    }
    
    // Find user by email
    const [sellerRows] = await pool.query("SELECT * FROM seller WHERE email = ?", [email]);
    if (sellerRows.length === 0) {
      return res.status(404).json({ message: "Seller with this email id not found" });
    }
    
    const seller = sellerRows[0];

    // 2️⃣ Compare password using bcrypt
    const isMatch = await bcrypt.compare(password, seller.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    
    const [rows] = await pool.query(`
  SELECT 
      sp.max_product_add, 
      COUNT(p.id) AS total_product,
      (sp.max_product_add - COUNT(p.id)) AS remaining_slots
  FROM seller_packages_history sph
  JOIN subscription_package sp ON sph.package_id = sp.id
  LEFT JOIN product p ON p.seller_id = sph.seller_id
  WHERE sph.status = 'active' AND sph.seller_id = ?
  GROUP BY sph.id, sp.max_product_add;
`, [seller.id]);

    const limitInfo = rows[0];

  const remaining = limitInfo.remaining_slots ?? 0;
    
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
        remaining_product :remaining,
      },
    });
    
  }catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
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
