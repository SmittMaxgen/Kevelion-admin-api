import bcrypt from "bcrypt";
import { connectDB } from "../../connection/db.js";

// Helper to get uploaded file path safely
const getFilePath = (req, field) =>
  req.files?.[field]?.[0] ? `/uploads/${req.files[field][0].filename}` : "";

export const createBuyer = async (req, res) => {
  try {
    const pool = await connectDB();

    // Step 1: Parse body data
    /*let bodyData = {};
    if (req.headers["content-type"]?.includes("multipart/form-data")) {
      bodyData = JSON.parse(req.body.data || "{}");
    } else {
      bodyData = req.body;
    }*/
    
    let bodyData = req.body;

    // Body fields (no nested objects)
    const {
      name,
      email,
      mobile,
      password,
      image,
      status,
      approve_status,
      address_id,
      is_online,
      device_token,

      company_name,
      company_GST_number,
      company_website,
      company_address,
      IEC_code,
      annual_turnover,
      facebook_link,
      linkedin_link,
      insta_link,
      city,
      state,
      pincode,

      aadhar_number,
      driving_license_number,
      driving_license_dob,
      aadhar_front,
      aadhar_back,
      driving_license_front,
      driving_license_back
    } = bodyData;
    
    
    // Step 2: Destructure fields
    /*const {
      buyer = {},
      company = {},
      kyc = {},
    } = bodyData;*/

    //if (!buyer.name || !buyer.mobile || !buyer.email || !buyer.password)
    //  return res.status(400).json({ message: "Missing required fields" });

    // Step 3: Check duplicate email or mobile
    /*const [existingBuyer] = await pool.query(
      "SELECT id FROM buyer WHERE email = ? OR mobile = ?",
      [email, mobile]
    ) ;  */
   
    let whereClauses = [];
    let values = [];
    
    if (email) {
      whereClauses.push("email = ?");
      values.push(email);
    }
    
    if (mobile) {
      whereClauses.push("mobile = ?");
      values.push(mobile);
    }
    
    if (whereClauses.length === 0) {
      return res.status(400).json({ message: "Email or Mobile is required" });
    }
    
    const duplicateQuery = `
      SELECT id, email, mobile 
      FROM buyer 
      WHERE ${whereClauses.join(" OR ")}
    `;
    
    const [existingBuyer] = await pool.query(duplicateQuery, values);
    
    if (existingBuyer.length > 0) {
      return res.status(400).json({ message: "Email or Mobile already exists" });
    }
     
    
    // Step 4: Hash password
    
    
    let hashedPassword = "";
    
    if(password){
         hashedPassword = await bcrypt.hash(password, 10);
    }
    // Step 5: Insert main buyer record
    const [result] = await pool.query(
      `INSERT INTO buyer 
      (name, mobile, email, password, image, status, approve_status, is_online, device_token)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        mobile,
        email,
        hashedPassword,
        getFilePath(req, "image"),
        status || "Inactive",
        approve_status || "Pending",
        address_id,
        is_online ?? false,
        device_token || "",
      ]
    );

    const buyerId = result.insertId;

    // Step 6: Insert company details
    await pool.query(
      `INSERT INTO buyer_company_details 
      (buyer_id, company_name, company_GST_number, company_website, company_address, IEC_code, annual_turnover, facebook_link, linkedin_link, insta_link, city, state, pincode)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        buyerId,
        company_name || "",
        company_GST_number || "",
        company_website || "",
        company_address || "",
        IEC_code || "",
        annual_turnover || "below_20_lakh",
        facebook_link || "",
        linkedin_link || "",
        insta_link || "",
        city || "",
        state || "",
        pincode || "",
      ]
    );

    // Step 7: Insert KYC details
    await pool.query(
      `INSERT INTO buyer_kyc_details 
      (buyer_id, aadhar_number, driving_license_number, driving_license_dob, aadhar_front, aadhar_back, driving_license_front, driving_license_back)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        buyerId,
        aadhar_number || "",
        driving_license_number || "",
        driving_license_dob || "",
        getFilePath(req, "aadhar_front"),
        getFilePath(req, "aadhar_back"),
        getFilePath(req, "driving_license_front"),
        getFilePath(req, "driving_license_back"),
      ]
    );

    res.status(201).json({ message: "Buyer created successfully", buyer_id: buyerId });
  } catch (err) {
    console.error("Error creating buyer:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ======================= GET ALL BUYERS ===========================
export const getAllBuyers = async (req, res) => {
  try {
    const pool = await connectDB();
    const [rows] = await pool.query(
      `SELECT b.*, c.*, bk.*,b.id, b.name, b.email, b.mobile, b.status, b.approve_status, 
       c.company_name,c.company_website,c.company_address, c.city, c.state, c.pincode 
       FROM buyer b 
       LEFT JOIN buyer_company_details c ON b.id = c.buyer_id 
       LEFT JOIN buyer_kyc_details bk on b.id = bk.buyer_id
       ORDER BY b.id DESC`
    );
    res.status(200).json(rows);
  } catch (err) {
    console.error("Error fetching buyers:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ======================= GET ALL Pending BUYERS ==============================
export const getAllPendingBuyers = async (req, res) => {
  try {
    const pool = await connectDB();
    const [rows] = await pool.query(
      `SELECT b.id, b.name, b.email, b.mobile, b.status, b.approve_status, 
       c.company_name,c.company_website, c.city, c.state, c.pincode 
       FROM buyer b 
       LEFT JOIN buyer_company_details c ON b.id = c.buyer_id
       WHERE b.approve_status = 'Pending'
       ORDER BY b.id DESC`
    );
    res.status(200).json(rows);
  } catch (err) {
    console.error("Error fetching buyers:", err);
    res.status(500).json({ message: "Server error" });
  }
};



// ======================= GET BUYER BY ID =====================================
export const getBuyerById = async (req, res) => {
  try {
    const pool = await connectDB();
    const { id } = req.params;

    const [buyer] = await pool.query(`SELECT 
          b.id AS buyer_id,
          b.name,
          b.email,
          b.mobile,
          b.image,
          b.status,
          b.approve_status,
          b.is_online,
          b.subscription,
          b.created_at,

          c.id AS company_id,
          c.company_name,
          c.company_GST_number,
          c.company_website,
          c.company_address,
          c.IEC_code,
          c.annual_turnover,
          c.facebook_link,
          c.linkedin_link,
          c.insta_link,
          c.city,
          c.state,
          c.pincode,

          k.id AS kyc_id,
          k.aadhar_number,
          k.aadhar_front,
          k.aadhar_back,
          k.driving_license_number,
          k.driving_license_front,
          k.driving_license_back,
          k.driving_license_dob

      FROM buyer b
      LEFT JOIN buyer_company_details c ON b.id = c.buyer_id
      LEFT JOIN buyer_kyc_details k ON b.id = k.buyer_id
      WHERE b.id = ?`, [id]);
    if (buyer.length === 0) return res.status(404).json({ message: "Buyer not found" });
    
     const row = buyer[0]; // single record after JOIN
    
    
    const response = {
      status: true,
      data: {
        // ---- BUYER FIELDS ----
        id: row.id,
        name: row.name,
        email: row.email,
        mobile: row.mobile,
        image: row.image,
        status: row.status,
        approve_status: row.approve_status,
        is_online: row.is_online,
        subscription: row.subscription,
        created_at: row.created_at,

        // ---- COMPANY NESTED ----
        company: row.company_id
          ? {
              company_id: row.company_id,
              company_name: row.company_name,
              company_GST_number: row.company_GST_number,
              company_website: row.company_website,
              company_address: row.company_address,
              IEC_code: row.IEC_code,
              annual_turnover: row.annual_turnover,
              facebook_link: row.facebook_link,
              linkedin_link: row.linkedin_link,
              insta_link: row.insta_link,
              city: row.city,
              state: row.state,
              pincode: row.pincode,
          }
          : null,
        // ---- KYC NESTED INSIDE COMPANY ----
        kyc: row.kyc_id
                ? {
                    kyc_id: row.kyc_id,
                    aadhar_number: row.aadhar_number,
                    aadhar_front: row.aadhar_front,
                    aadhar_back: row.aadhar_back,
                    driving_license_number: row.driving_license_number,
                    driving_license_front: row.driving_license_front,
                    driving_license_back: row.driving_license_back,
                    driving_license_dob: row.driving_license_dob,
                  }
                : null,
           
      },
    };
    
    

    //const [company] = await pool.query(`SELECT * FROM buyer_company_details WHERE buyer_id = ?`, [id]);
    //const [kyc] = await pool.query(`SELECT * FROM buyer_kyc_details WHERE buyer_id = ?`, [id]);

    res.status(200).json(response);
  } catch (err) {
    console.error("Error fetching buyer:", err);
    res.status(500).json({ message: "Server error" });
  }
};


//===========================GET BUYEr by mobile number ========================

export const getBuyerByMobile = async (req, res) => {
  try {
    const pool = await connectDB();
    const { mobile } = req.params;

    const [buyer] = await pool.query(`SELECT 
          b.id AS buyer_id,
          b.name,
          b.email,
          b.mobile,
          b.image,
          b.status,
          b.approve_status,
          b.is_online,
          b.subscription,
          b.created_at,

          c.id AS company_id,
          c.company_name,
          c.company_GST_number,
          c.company_website,
          c.company_address,
          c.IEC_code,
          c.annual_turnover,
          c.facebook_link,
          c.linkedin_link,
          c.insta_link,
          c.city,
          c.state,
          c.pincode,

          k.id AS kyc_id,
          k.aadhar_number,
          k.aadhar_front,
          k.aadhar_back,
          k.driving_license_number,
          k.driving_license_front,
          k.driving_license_back,
          k.driving_license_dob

      FROM buyer b
      LEFT JOIN buyer_company_details c ON b.id = c.buyer_id
      LEFT JOIN buyer_kyc_details k ON b.id = k.buyer_id
      WHERE b.mobile = ?`, [mobile]);
    if (buyer.length === 0) return res.status(404).json({ message: "Buyer not found" });
    
     const row = buyer[0]; // single record after JOIN
    
    
    const response = {
      status: true,
      data: {
        // ---- BUYER FIELDS ----
        id: row.id,
        name: row.name,
        email: row.email,
        mobile: row.mobile,
        image: row.image,
        status: row.status,
        approve_status: row.approve_status,
        is_online: row.is_online,
        subscription: row.subscription,
        created_at: row.created_at,

        // ---- COMPANY NESTED ----
        company: row.company_id
          ? {
              company_id: row.company_id,
              company_name: row.company_name,
              company_GST_number: row.company_GST_number,
              company_website: row.company_website,
              company_address: row.company_address,
              IEC_code: row.IEC_code,
              annual_turnover: row.annual_turnover,
              facebook_link: row.facebook_link,
              linkedin_link: row.linkedin_link,
              insta_link: row.insta_link,
              city: row.city,
              state: row.state,
              pincode: row.pincode,
          }
          : null,
        // ---- KYC NESTED INSIDE COMPANY ----
        kyc: row.kyc_id
                ? {
                    kyc_id: row.kyc_id,
                    aadhar_number: row.aadhar_number,
                    aadhar_front: row.aadhar_front,
                    aadhar_back: row.aadhar_back,
                    driving_license_number: row.driving_license_number,
                    driving_license_front: row.driving_license_front,
                    driving_license_back: row.driving_license_back,
                    driving_license_dob: row.driving_license_dob,
                  }
                : null,
           
      },
    };
    
    

    //const [company] = await pool.query(`SELECT * FROM buyer_company_details WHERE buyer_id = ?`, [id]);
    //const [kyc] = await pool.query(`SELECT * FROM buyer_kyc_details WHERE buyer_id = ?`, [id]);

    res.status(200).json(response);
  } catch (err) {
    console.error("Error fetching buyer:", err);
    res.status(500).json({ message: "Server error" });
  }
};



// ======================= GET ALL Company =====================================

export const getAllCompany = async (req, res) => {
  try {
    const pool = await connectDB();
    const [rows] = await pool.query(
      `SELECT * FROM buyer_company_details ORDER BY id DESC`);
    res.status(200).json(rows);
  } catch (err) {
    console.error("Error fetching buyers:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ======================= GET ALL Company BY buyer =====================================

export const getAllCompanyByBuyer = async (req, res) => {
  try {
    const pool = await connectDB();
    const { buyer_id } = req.params;
    
    const [rows] = await pool.query(
      `SELECT * FROM buyer_company_details WHERE buyer_id = ? ORDER BY id DESC`,[buyer_id]);
    res.status(200).json(rows);
  } catch (err) {
    console.error("Error fetching company:", err);
    res.status(500).json({ message: "Server error" });
  }
};
// ======================= GET ALL Company BY ID =====================================

export const getAllCompanyById = async (req, res) => {
  try {
    const pool = await connectDB();
    const { id } = req.params;
    
    const [rows] = await pool.query(
      `SELECT * FROM buyer_company_details WHERE id = ? ORDER BY id DESC`,[id]);
    res.status(200).json(rows);
  } catch (err) {
    console.error("Error fetching company:", err);
    res.status(500).json({ message: "Server error" });
  }
};



// ======================= update BUYER  =====================================

export const updateBuyer = async (req, res) => {
  try {
    const pool = await connectDB();
    const { id } = req.params;

    // Parse body data (for form-data JSON in "data" field)
    let bodyData = req.body;
    if (typeof req.body === "string") {
      bodyData = JSON.parse(req.body);
    } else if (req.body.data) {
      bodyData = JSON.parse(req.body.data);
    }
    
    const {
      name,
      mobile,
      email,
      password,
      status,
      approve_status,
      is_online,
      device_token,
      address_id,
    
      company_name,
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
      driving_license_number,
      driving_license_dob
    } = bodyData;

    // Fetch existing buyer
    const [existingBuyer] = await pool.query("SELECT * FROM buyer WHERE id = ?", [id]);
    if (existingBuyer.length === 0)
      return res.status(404).json({ message: "Buyer not found" });

    const currentBuyer = existingBuyer[0];

    // Update main buyer table
    await pool.query(
      `UPDATE buyer SET name=?, mobile=?, email=?, image=?, status=?,address_id=?, approve_status=?, is_online=?, device_token=? WHERE id=?`,
      [
        name || currentBuyer.name,
        mobile || currentBuyer.mobile,
        email || currentBuyer.email,
        getFilePath(req, "image") || currentBuyer.image,
        status || currentBuyer.status,
        address_id || currentBuyer.address_id,
        approve_status || currentBuyer.approve_status,
        is_online ?? currentBuyer.is_online,
        device_token || currentBuyer.device_token,
        id,
      ]
    );

    // Update company details
    const [companyRows] = await pool.query("SELECT * FROM buyer_company_details WHERE buyer_id=?", [id]);
    await pool.query(
      `UPDATE buyer_company_details SET company_name=?, company_GST_number=?, company_website=?, IEC_code=?, annual_turnover=?, facebook_link=?, linkedin_link=?, insta_link=?, city=?, state=?, pincode=? WHERE buyer_id=?`,
      [
        company_name || companyRows[0].company_name,
        company_GST_number || companyRows[0].company_GST_number,
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

    // Update KYC details
    const [kycRows] = await pool.query("SELECT * FROM buyer_kyc_details WHERE buyer_id=?", [id]);
    await pool.query(
      `UPDATE buyer_kyc_details SET aadhar_number=?, driving_license_number=?, driving_license_dob=?, aadhar_front=?, aadhar_back=?, driving_license_front=?, driving_license_back=? WHERE buyer_id=?`,
      [
        aadhar_number || kycRows[0].aadhar_number,
        driving_license_number || kycRows[0].driving_license_number,
        driving_license_dob || kycRows[0].driving_license_dob,
        getFilePath(req, "aadhar_front") || kycRows[0].aadhar_front,
        getFilePath(req, "aadhar_back") || kycRows[0].aadhar_back,
        getFilePath(req, "driving_license_front") || kycRows[0].driving_license_front,
        getFilePath(req, "driving_license_back") || kycRows[0].driving_license_back,
        id,
      ]
    );

    res.status(200).json({ message: "Buyer updated successfully" });
  } catch (err) {
    console.error("Error updating buyer:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};


// ======================= UPDATE BUYER ===========================
/*export const updateBuyer = async (req, res) => {
  try {
    const pool = await connectDB();
    const { id } = req.params;
    const updates = req.body;

    const [existingBuyer] = await pool.query("SELECT * FROM buyer WHERE id = ?", [id]);
    if (existingBuyer.length === 0)
      return res.status(404).json({ message: "Buyer not found" });

    const buyer = existingBuyer[0];

    const hashedPassword = updates.password
      ? await bcrypt.hash(updates.password, 10)
      : buyer.password;

    await pool.query(
      `UPDATE buyer SET name=?, mobile=?, email=?, password=?, image=?, status=?, approve_status=?, is_online=?, device_token=?, subscription=? WHERE id=?`,
      [
        updates.name || buyer.name,
        updates.mobile || buyer.mobile,
        updates.email || buyer.email,
        hashedPassword,
        getFilePath(req, "image") || buyer.image,
        updates.status || buyer.status,
        updates.approve_status || buyer.approve_status,
        updates.is_online ?? buyer.is_online,
        updates.device_token || buyer.device_token,
        updates.subscription ?? buyer.subscription,
        id,
      ]
    );

    // Update company details
    await pool.query(
      `UPDATE buyer_company_details SET company_name=?, company_GST_number=?, company_website=?, IEC_code=?, annual_turnover=?, facebook_link=?, linkedin_link=?, insta_link=?, city=?, state=?, pincode=? WHERE buyer_id=?`,
      [
        updates.company_name || buyer.company_name,
        updates.company_GST_number || buyer.company_GST_number,
        updates.company_website || buyer.company_website,
        updates.IEC_code || buyer.IEC_code,
        updates.annual_turnover || buyer.annual_turnover,
        updates.facebook_link || buyer.facebook_link,
        updates.linkedin_link || buyer.linkedin_link,
        updates.insta_link || buyer.insta_link,
        updates.city || buyer.city,
        updates.state || buyer.state,
        updates.pincode || buyer.pincode,
        id,
      ] 
    );

    // Update KYC details
    await pool.query(
      `UPDATE buyer_kyc_details SET aadhar_number=?, driving_license_number=?, driving_license_dob=?, aadhar_front=?, aadhar_back=?, driving_license_front=?, driving_license_back=? WHERE buyer_id=?`,
      [
        updates.aadhar_number || buyer.aadhar_number,
        updates.driving_license_number || buyer.driving_license_number,
        updates.driving_license_dob || buyer.driving_license_dob,
        getFilePath(req, "aadhar_front"),
        getFilePath(req, "aadhar_back"),
        getFilePath(req, "driving_license_front"),
        getFilePath(req, "driving_license_back"),
        id,
      ]
    );

    res.status(200).json({ message: "Buyer updated successfully" });
  } catch (err) {
    console.error("Error updating buyer:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
*/
// ======================= DELETE BUYER ===========================
export const deleteBuyer = async (req, res) => {
  try {
    const pool = await connectDB();
    const { id } = req.params;

    const [buyer] = await pool.query(`SELECT id FROM buyer WHERE id = ?`, [id]);
    if (buyer.length === 0)
      return res.status(404).json({ message: "Buyer not found" });

    await pool.query(`DELETE FROM buyer_kyc_details WHERE buyer_id = ?`, [id]);
    await pool.query(`DELETE FROM buyer_company_details WHERE buyer_id = ?`, [id]);
    await pool.query(`DELETE FROM buyer WHERE id = ?`, [id]);

    res.status(200).json({ message: "Buyer deleted successfully" });
  } catch (err) {
    console.error("Error deleting buyer:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
