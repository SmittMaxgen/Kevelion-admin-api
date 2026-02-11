import bcrypt from "bcrypt";
import { connectDB } from "../../connection/db.js";

// ======================= CREATE SELLER ===========================

export const createSeller = async (req, res) => {
  try {
    const pool = await connectDB();

    // 🧠 Handle both raw JSON and form-data
    let body = req.body;
    if (typeof body === "string") {
      body = JSON.parse(body);
    }

    const {
      seller = {},
      company = {},
      kyc = {},
      bank = {},
    } = body;

    // 🧾 Validate required fields
    if (!seller.name || !seller.mobile || !seller.email || !seller.password)
      return res.status(400).json({ message: "Missing required fields" });

    // 🧩 Check if email or mobile already exists
    const [existingSeller] = await pool.query(
      "SELECT id FROM seller WHERE email = ? OR mobile = ?",
      [seller.email, seller.mobile]
    );
    if (existingSeller.length > 0)
      return res.status(400).json({ message: "Email or Mobile already exists" });

    // 🔒 Hash password
    const hashedPassword = await bcrypt.hash(seller.password, 10);

    // 🧱 Insert main seller
    const [sellerResult] = await pool.query(
      `INSERT INTO seller 
      (name, mobile, email, password, status, approve_status, device_token, subscription, subscription_package_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        seller.name,
        seller.mobile,
        seller.email,
        hashedPassword,
        seller.status || "Inactive",
        seller.approve_status || "Pending",
        seller.device_token || "",
        seller.subscription || false,
        seller.subscription_package_id || null,
      ]
    );

    const sellerId = sellerResult.insertId;

    // 📂 Helper to get uploaded file path
    const getFilePath = (field) =>
      req.files?.[field]?.[0]
        ? `/uploads/${req.files[field][0].filename}`
        : "";

    // 🏢 Insert company details
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
        company.annual_turnover || "below_20_lakh",
        company.facebook_link || "",
        company.linkedin_link || "",
        company.insta_link || "",
        company.city || "",
        company.state || "",
        company.pincode || "",
      ]
    );

    // 🪪 Insert KYC details
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

    // 🏦 Insert Bank details
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

    res.status(201).json({
      message: "Seller created successfully",
      seller_id: sellerId,
    });
  } catch (err) {
    console.error("❌ Error creating seller:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};




/*export const createSeller = async (req, res) => {
  try {
    const pool = await connectDB();
    const {
      name,
      mobile,
      email,
      password,
      status = "Inactive",
      approve_status = "Pending",
      device_token = "",
      company_name = "",
      company_type = "other",
      company_GST_number = "",
      company_website = "",
      IEC_code = "",
      annual_turnover = "below_20_lakh",
      facebook_link = "",
      linkedin_link = "",
      insta_link = "",
      city = "",
      state = "",
      pincode = "",
      subscription = false,
      subscription_package_id = null,
      kyc_detail = {},
      bank_detail = {},
    } = req.body;

    if (!name || !mobile || !email || !password)
      return res.status(400).json({ message: "Missing required fields" });

    // Check if email or mobile already exists
    const [existingSeller] = await pool.query(
      "SELECT id FROM seller WHERE email = ? OR mobile = ?",
      [email, mobile]
    );
    if (existingSeller.length > 0)
      return res.status(400).json({ message: "Email or Mobile already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert into seller table
    const [sellerResult] = await pool.query(
      `INSERT INTO seller 
      (name, mobile, email, password, status, approve_status, device_token, subscription, subscription_package_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        mobile,
        email,
        hashedPassword,
        status,
        approve_status,
        device_token,
        subscription,
        subscription_package_id,
      ]
    );

    const sellerId = sellerResult.insertId;

    // Helper to get file path
    const getFilePath = (field) =>
      req.files?.[field]?.[0] ? `/uploads/${req.files[field][0].filename}` : "";

    // Insert company details
    await pool.query(
      `INSERT INTO seller_company_details 
      (seller_id, company_name, company_type, company_GST_number, company_logo, company_website, IEC_code, annual_turnover, facebook_link, linkedin_link, insta_link, city, state, pincode)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        sellerId,
        company_name,
        company_type,
        company_GST_number,
        getFilePath("company_logo"),
        company_website,
        IEC_code,
        annual_turnover,
        facebook_link,
        linkedin_link,
        insta_link,
        city,
        state,
        pincode,
      ]
    );

    // Insert KYC details
    await pool.query(
      `INSERT INTO seller_kyc_details 
      (seller_id, aadhar_number, aadhar_front, aadhar_back, company_registration, company_pan_card, gst_certificate)
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        sellerId,
        kyc_detail.aadhar_number || "",
        getFilePath("aadhar_front"),
        getFilePath("aadhar_back"),
        getFilePath("company_registration"),
        getFilePath("company_pan_card"),
        getFilePath("gst_certificate"),
      ]
    );

    // Insert bank details
    await pool.query(
      `INSERT INTO seller_bank_details 
      (seller_id, cancelled_cheque_photo, bank_name, bank_IFSC_code, account_number, account_type)
      VALUES (?, ?, ?, ?, ?, ?)`,
      [
        sellerId,
        getFilePath("cancelled_cheque_photo"),
        bank_detail.bank_name || "",
        bank_detail.bank_IFSC_code || "",
        bank_detail.account_number || "",
        bank_detail.account_type || "",
      ]
    );

    res.status(201).json({ message: "Seller created successfully", seller_id: sellerId });
  } catch (err) {
    console.error("Error creating seller:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};*/

// ======================= GET ALL SELLERS ===========================
export const getAllSellers = async (req, res) => {
  try {
    const pool = await connectDB();
    const [rows] = await pool.query(
      `SELECT s.id, s.name, s.email, s.mobile, s.status, s.approve_status, 
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
 
    // Parse nested objects if form-data is sent
    let seller = {};
    let company = {};
    let kyc = {};
    let bank = {};

    if (req.headers["content-type"]?.includes("multipart/form-data")) {
      // If form-data, fields come as strings — parse manually
      seller = JSON.parse(req.body.seller || "{}");
      company = JSON.parse(req.body.company || "{}");
      kyc = JSON.parse(req.body.kyc || "{}");
      bank = JSON.parse(req.body.bank || "{}");
    } else {
      // If raw JSON, req.body already structured
      ({ seller = {}, company = {}, kyc = {}, bank = {} } = req.body);
    }

    const [sellerRows] = await pool.query("SELECT * FROM seller WHERE id = ?", [id]);
    if (sellerRows.length === 0) {
      return res.status(404).json({ message: "Seller not found" });
    }

    const hashedPassword = seller.password
      ? await bcrypt.hash(seller.password, 10)
      : sellerRows[0].password;

    const getFilePath = (field) =>
      req.files?.[field]?.[0] ? `/uploads/${req.files[field][0].filename}` : null;

    // ✅ Update seller table
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
    
    



    // ✅ Update company
    const [companyRows] = await pool.query(
      "SELECT * FROM seller_company_details WHERE seller_id = ?",
      [id]
    );
    await pool.query(
      `UPDATE seller_company_details SET 
        company_name=?, company_type=?, company_GST_number=?, company_logo=?, 
        company_website=?, IEC_code=?, annual_turnover=?, facebook_link=?, 
        linkedin_link=?, insta_link=?, city=?, state=?, pincode=? 
        WHERE seller_id=?`,
      [
        company.company_name || companyRows[0].company_name,
        company.company_type || companyRows[0].company_type,
        company.company_GST_number || companyRows[0].company_GST_number,
        getFilePath("company_logo") || companyRows[0].company_logo,
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

    // ✅ Update KYC
    const [kycRows] = await pool.query(
      "SELECT * FROM seller_kyc_details WHERE seller_id=?",
      [id]
    );
    await pool.query(
      `UPDATE seller_kyc_details SET aadhar_number=?, aadhar_front=?, aadhar_back=?, company_registration=?, company_pan_card=?, gst_certificate=? WHERE seller_id=?`,
      [
        kyc.aadhar_number || kycRows[0].aadhar_number,
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
        bank.bank_name || bankRows[0].bank_name,
        bank.bank_IFSC_code || bankRows[0].bank_IFSC_code,
        bank.account_number || bankRows[0].account_number,
        bank.account_type || bankRows[0].account_type,
        id,
      ]
    );

    res.status(200).json({ message: "Seller updated successfully"});
  } catch (err) {
    console.error("Error updating seller:", err);
    res.status(500).json({ message: "Server error", error: err.message });
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
