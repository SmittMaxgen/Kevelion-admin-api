import { connectDB } from "../../connection/db.js";
import bcrypt from "bcrypt";


//pid 68da4c56922dd5bc816126f9
// //.pid2  68da4c51922dd5bc816126f5
//buyer id :68d4deffde6c966bf42d56df
//seller id : 68d4f5a31788865eb5be9d3e
//order id : 68da638fe69e13874b77efce
/*

{
    "buyer_id": "68d4deffde6c966bf42d56df",
    "order_type": "Order",
    "products": [
    {
      "product_id": "68da4c56922dd5bc816126f9",
      "seller_id" : "68d4f5a31788865eb5be9d3e",
      "quantity": 2,
      "price": 49.99,
      "order_status" : "New",
      "payment_status" : "Pending"
    },
    { 
      "product_id": "68da4c51922dd5bc816126f5",
      "seller_id": "68d4f5a31788865eb5be9d3e",
      "quantity": 1,
      "price": 100.00,
      "order_status" : "New",
      "payment_status" : "Pending"
    }
    ]
}*/

// ======================= CREATE ORDER ===========================
export const createOrder = async (req, res) => {
  try {
    const pool = await connectDB();
    const { buyer_id, order_type = "Order", products } = req.body;

    if (!buyer_id || !products || products.length === 0) {
      return res.status(400).json({ message: "buyer_id and products are required" });
    }

    // Create main order
    const [orderResult] = await pool.query(
      `INSERT INTO orders (buyer_id, order_type) VALUES (?, ?)`,
      [buyer_id, order_type]
    );

    const orderId = orderResult.insertId;

    // Insert products for the order
    for (const p of products) {
      await pool.query(
        `INSERT INTO order_products (order_id, product_id, seller_id, quantity, price, order_status, payment_status)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          orderId,
          p.product_id,
          p.seller_id || "",
          p.quantity || 1,
          p.price,
          p.order_status || "New",
          p.payment_status || "Pending",
        ]
      );
    }

    res.status(201).json({ message: "Order created successfully", order_id: orderId });
  } catch (err) {
    console.error("Error creating order:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ======================= UPDATE ORDER ===========================
export const updateOrder = async (req, res) => {
  try {
    const pool = await connectDB();
    const { id } = req.params;
    const { buyer_id, order_type, products } = req.body;

    // Update order table
    await pool.query(
      `UPDATE orders SET buyer_id = ?, order_type = ?, updated_at = NOW() WHERE id = ?`,
      [buyer_id, order_type, id]
    );

    // Delete old product rows and reinsert
    if (products && products.length > 0) {
      await pool.query(`DELETE FROM order_products WHERE order_id = ?`, [id]);
      for (const p of products) {
        await pool.query(
          `INSERT INTO order_products (order_id, product_id, seller_id, quantity, price, order_status, payment_status)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            id,
            p.product_id,
            p.seller_id,
            p.quantity || 1,
            p.price,
            p.order_status || "New",
            p.payment_status || "Pending",
          ]
        );
      }
    }

    res.status(200).json({ message: "Order updated successfully" });
  } catch (err) {
    console.error("Error updating order:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ======================= UPDATE ORDER product status ===========================
export const updateOrderProductStatus = async (req, res) => {
  try {
    const pool = await connectDB();
    const { order_product_id } = req.params;
    const {order_status } = req.body;

    // Update order product status
    await pool.query(
      `UPDATE order_products SET order_status = ? WHERE id = ?`,
      [order_status,order_product_id]
    );

    res.status(200).json({ message: "Order Product status updated successfully" });
  } catch (err) {
    console.error("Error updating order:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};






// ======================= GET ALL ORDERS ===========================
export const getAllOrder = async (req, res) => {
  try {
    const pool = await connectDB();
   // const [orders] = await pool.query(`SELECT * FROM orders ORDER BY id DESC`);
    const [orders] = await pool.query(`SELECT o.*, b.name AS buyer_name, b.email AS buyer_email, b.mobile AS buyer_mobile
  FROM orders o
  LEFT JOIN buyer b ON o.buyer_id = b.id ORDER BY id DESC`);
  
  

    for (const order of orders) {
  //   const [products] = await pool.query(`SELECT * FROM order_products WHERE order_id = ?`, [order.id]);
     const [products] = await pool.query( `
      SELECT 
        op.*,p.*,sh.*,

        -- product details
        p.name AS product_name,
        p.brand AS product_brand,
        p.material AS product_material,
        p.f_image AS product_f_image,
        p.cat_id AS product_cat_id,
        p.cat_sub_id AS product_cat_sub_id,

        -- seller details
        s.name AS seller_name,
        s.mobile AS seller_phone

      FROM order_products op
      LEFT JOIN product p ON op.product_id = p.id
      LEFT JOIN seller s ON op.seller_id = s.id
      LEFT JOIN shipping sh on sh.product_id = p.id AND sh.order_id = op.order_id
      WHERE op.order_id = ?
    `, [order.id]);
 
    
    // 👉 FORMAT EXACT STRUCTURE YOU WANT
      order.products = products.map((p) => {
        // ---- STATUS LOGIC ----
  const status = (p.order_status || "").toLowerCase();



const isNewOrPending = ["new", "pending"].includes(status);
  const isConfirmed = ["confirmed", "shipped", "out for delivery", "delivered"].includes(status);
  const isShipped = ["shipped", "out for delivery", "delivered"].includes(status);
  const isOutForDelivery = ["out for delivery", "delivered"].includes(status);
  const isDelivered = status === "delivered";
  const isCancelled = status === "cancelled";
  

  

  // ---- RETURN STRUCTURED PRODUCT ----
  return {
          
        id: p.id,
        order_id: p.order_id,
        product_id: p.product_id,
        seller_id: p.seller_id,
        quantity: p.quantity,
        price: p.price,
        order_status: p.order_status,
        payment_status: p.payment_status,
        trackingId:p.tracking_number,
        expectedDate:p.estimated_delivery_date,
        deliveredOn:p.actual_delivery_date,
        cancelledOn:p.cancelled_date,
        partnerName:p.courier_name,
        partnerCompany:p.courier_company_name,
        partnerPhone:p.courier_mobile,
        
        
        // 👉 Add new status fields
        status: p.order_status,
        isConfirmed,
        isShipped,
        isOutForDelivery,
        isDelivered,
        isCancelled,
        

        product_details: {
          name: p.product_name,
          sku: p.sku,
          status: p.status,
          detail: p.product_name,
          product_MRP:p.product_MRP,
          moq: p.moq,
          brand: p.product_brand,
          material: p.product_material,
          f_image: p.product_f_image,
          image_2 : p.image_2,
          image_3 :p.image_3,
          image_4 : p.image_4,
          made_in :p.made_in,
          specification :p.specification,
          warranty:p.warranty,
          cat_id: p.product_cat_id,
          cat_sub_id: p.product_cat_sub_id
        },

        seller_details: {
          seller_name: p.seller_name,
          seller_phone: p.seller_phone
        }
  }
      });
      
      // 🔥 ADD buyer_details & order_details STRUCTURE
      order.buyer_details = {
        buyer_id : order.buyer_id,  
        buyer_name: order.buyer_name,
        buyer_email: order.buyer_email,
        buyer_mobile: order.buyer_mobile,
      };
      
      // REMOVE FLAT BUYER FIELDS FROM ORDER
      delete order.buyer_id;
      delete order.buyer_name;
      delete order.buyer_email;
      delete order.buyer_mobile;
      
    }
    res.status(200).json(orders);
  } catch (err) {
    console.error("Error fetching orders:", err);
    res.status(500).json({ message: "Server error" });
  }
};


// ======================= GET ORDER BY ID ===========================
export const getDataById = async (req, res) => {
  try {
    const pool = await connectDB();
    const { id } = req.params;

     const [orders] = await pool.query(`SELECT o.*, b.name AS buyer_name, b.email AS buyer_email, b.mobile AS buyer_mobile
  FROM orders o
  LEFT JOIN buyer b ON o.buyer_id = b.id WHERE o.id = ? ORDER BY id DESC`,[id]);
  
  

    for (const order of orders) {
  //   const [products] = await pool.query(`SELECT * FROM order_products WHERE order_id = ?`, [order.id]);
     const [products] = await pool.query( `
      SELECT 
        op.*,p.*,sh.*,

        -- product details
        p.name AS product_name,
        p.brand AS product_brand,
        p.material AS product_material,
        p.f_image AS product_f_image,
        p.cat_id AS product_cat_id,
        p.cat_sub_id AS product_cat_sub_id,

        -- seller details
        s.name AS seller_name,
        s.mobile AS seller_phone

      FROM order_products op
      LEFT JOIN product p ON op.product_id = p.id
      LEFT JOIN seller s ON op.seller_id = s.id
      LEFT JOIN shipping sh on sh.product_id = p.id AND sh.order_id = op.order_id
      WHERE op.order_id = ?
    `, [order.id]);
 
    
    // 👉 FORMAT EXACT STRUCTURE YOU WANT
      order.products = products.map((p) => {
        // ---- STATUS LOGIC ----
  const status = (p.order_status || "").toLowerCase();



  const isConfirmed = ["confirmed", "shipped", "out for delivery", "delivered"].includes(status);
  const isShipped = ["shipped", "out for delivery", "delivered"].includes(status);
  const isOutForDelivery = ["out for delivery", "delivered"].includes(status);
  const isDelivered = status === "delivered";
  const isCancelled = status === "cancelled";

  // ---- RETURN STRUCTURED PRODUCT ----
  return {
          
        id: p.id,
        order_id: p.order_id,
        product_id: p.product_id,
        seller_id: p.seller_id,
        quantity: p.quantity,
        price: p.price,
        order_status: p.order_status,
        payment_status: p.payment_status,
        trackingId:p.tracking_number,
        expectedDate:p.estimated_delivery_date,
        deliveredOn:p.actual_delivery_date,
        cancelledOn:p.cancelled_date,
        partnerName:p.courier_name,
        partnerCompany:p.courier_company_name,
        partnerPhone:p.courier_mobile,
        
    
        //  Add new status fields
        status: p.order_status,
        isConfirmed,
        isShipped,
        isOutForDelivery,
        isDelivered,
        isCancelled,
        

        product_details: {
          name: p.product_name,
          sku: p.sku,
          status: p.status,
          detail: p.product_name,
          product_MRP:p.product_MRP,
          moq: p.moq,
          brand: p.product_brand,
          material: p.product_material,
          f_image: p.product_f_image,
          image_2 : p.image_2,
          image_3 :p.image_3,
          image_4 : p.image_4,
          made_in :p.made_in,
          specification :p.specification,
          warranty:p.warranty,
          cat_id: p.product_cat_id,
          cat_sub_id: p.product_cat_sub_id
        },

        seller_details: {
          seller_name: p.seller_name,
          seller_phone: p.seller_phone
        }
  }
      });
      
      //  ADD buyer_details & order_details STRUCTURE
      order.buyer_details = {
        buyer_id : order.buyer_id,  
        buyer_name: order.buyer_name,
        buyer_email: order.buyer_email,
        buyer_mobile: order.buyer_mobile,
      };
      
      // REMOVE FLAT BUYER FIELDS FROM ORDER
      delete order.buyer_id;
      delete order.buyer_name;
      delete order.buyer_email;
      delete order.buyer_mobile;
      
    }
    res.status(200).json(orders);
  } catch (err) {
    console.error("Error fetching order:", err);
    res.status(500).json({ message: "Server error" });
  }
};



/*export const getDataById = async (req, res) => {
  try {
    const pool = await connectDB();
    const { id } = req.params;

    const [orders] = await pool.query(`SELECT * FROM orders WHERE id = ?`, [id]);
    if (orders.length === 0) return res.status(404).json({ message: "Order not found" });

    const order = orders[0];
    const [products] = await pool.query(`SELECT * FROM order_products WHERE order_id = ?`, [id]);
    order.products = products;

    res.status(200).json(order);
  } catch (err) {
    console.error("Error fetching order:", err);
    res.status(500).json({ message: "Server error" });
  }
};*/

// ======================= DELETE ORDER ===========================
export const deleteOrder = async (req, res) => {
  try {
    const pool = await connectDB();
    const { id } = req.params;

    await pool.query(`DELETE FROM orders WHERE id = ?`, [id]);

    res.status(200).json({ message: "Order deleted successfully" });
  } catch (err) {
    console.error("Error deleting order:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ======================= FILTER: BY BUYER ID ===========================
// ======================= FILTER: BY BUYER ID ===========================
export const getAllOrderByBuyer = async (req, res) => {
  try {
    const pool = await connectDB();
    const { buyer_id } = req.params;

    // ===== GET ORDERS =====
    const [orders] = await pool.query(`
      SELECT 
        o.*, 
        b.name AS buyer_name, 
        b.email AS buyer_email, 
        b.mobile AS buyer_mobile
      FROM orders o
      LEFT JOIN buyer b ON o.buyer_id = b.id 
      WHERE o.buyer_id = ?
      ORDER BY o.id DESC
    `, [buyer_id]);

    // ===== LOOP ORDERS =====
    for (const order of orders) {

      const [products] = await pool.query(`
        SELECT 
          op.*,
          p.*,
          sh.*,

          -- product details
          p.name AS product_name,
          p.brand AS product_brand,
          p.material AS product_material,
          p.f_image AS product_f_image,
          p.cat_id AS product_cat_id,
          p.cat_sub_id AS product_cat_sub_id,

          -- seller details
          s.name AS seller_name,
          s.mobile AS seller_phone

        FROM order_products op
        LEFT JOIN product p ON op.product_id = p.id
        LEFT JOIN seller s ON op.seller_id = s.id
        LEFT JOIN shipping sh 
          ON sh.product_id = p.id 
          AND sh.order_id = op.order_id
        WHERE op.order_id = ?
      `, [order.id]);

      // ===== FORMAT PRODUCTS =====
      order.products = products.map((p) => {

        const status = (p.order_status || "").toLowerCase();

        const isConfirmed = ["confirmed", "shipped", "out for delivery", "delivered"].includes(status);
        const isShipped = ["shipped", "out for delivery", "delivered"].includes(status);
        const isOutForDelivery = ["out for delivery", "delivered"].includes(status);
        const isDelivered = status === "delivered";
        const isCancelled = status === "cancelled";

        return {
          id: p.id,
          order_id: p.order_id,
          product_id: p.product_id,
          seller_id: p.seller_id,
          quantity: p.quantity,
          price: p.price,
          order_status: p.order_status,
          payment_status: p.payment_status,

          trackingId: p.tracking_number,
          expectedDate: p.estimated_delivery_date,
          deliveredOn: p.actual_delivery_date,
          cancelledOn: p.cancelled_date,
          partnerName: p.courier_name,
          partnerCompany: p.courier_company_name,
          partnerPhone: p.courier_mobile,

          status: p.order_status,
          isConfirmed,
          isShipped,
          isOutForDelivery,
          isDelivered,
          isCancelled,

          product_details: {
            name: p.product_name,
            sku: p.sku,
            status: p.status,
            detail: p.product_name,
            product_MRP: p.product_MRP,
            moq: p.moq,
            brand: p.product_brand,
            material: p.product_material,
            f_image: p.product_f_image,
            image_2: p.image_2,
            image_3: p.image_3,
            image_4: p.image_4,
            made_in: p.made_in,
            specification: p.specification,
            warranty: p.warranty,
            cat_id: p.product_cat_id,
            cat_sub_id: p.product_cat_sub_id
          },

          seller_details: {
            seller_name: p.seller_name,
            seller_phone: p.seller_phone
          }
        };
      });

      // ===== BUYER DETAILS STRUCTURE =====
      order.buyer_details = {
        buyer_id: order.buyer_id,
        buyer_name: order.buyer_name,
        buyer_email: order.buyer_email,
        buyer_mobile: order.buyer_mobile,
      };

      // REMOVE FLAT BUYER FIELDS
      delete order.buyer_id;
      delete order.buyer_name;
      delete order.buyer_email;
      delete order.buyer_mobile;
    }

    res.status(200).json(orders);

  } catch (err) {
    console.error("Error fetching orders:", err);
    res.status(500).json({ message: "Server error" });
  }
};



/*// date 7/2/26
export const getAllOrderByBuyer = async (req, res) => {
  try {
    const pool = await connectDB();
    
    const { buyer_id } = req.params;

    //const [orders] = await pool.query(`SELECT * FROM orders WHERE buyer_id = ?`, [buyer_id]);
   // const [orders] = await pool.query(`SELECT * FROM orders ORDER BY id DESC`);
    const [orders] = await pool.query(`SELECT o.*, b.name AS buyer_name, b.email AS buyer_email, b.mobile AS buyer_mobile
  FROM orders o
  LEFT JOIN buyer b ON o.buyer_id = b.id WHERE o.buyer_id = ? ORDER BY id DESC`,[buyer_id]);
  
  

    for (const order of orders) {
  //   const [products] = await pool.query(`SELECT * FROM order_products WHERE order_id = ?`, [order.id]);
     const [products] = await pool.query( `
      SELECT 
        op.*,p.*,sh.*,

        -- product details
        p.name AS product_name,
        p.brand AS product_brand,
        p.material AS product_material,
        p.f_image AS product_f_image,
        p.cat_id AS product_cat_id,
        p.cat_sub_id AS product_cat_sub_id,

        -- seller details
        s.name AS seller_name,
        s.mobile AS seller_phone

      FROM order_products op
      LEFT JOIN product p ON op.product_id = p.id
      LEFT JOIN seller s ON op.seller_id = s.id
      LEFT JOIN shipping sh on sh.product_id = p.id AND sh.order_id = op.order_id
      WHERE op.order_id = ?
    `, [order.id]);
 
    
    // 👉 FORMAT EXACT STRUCTURE YOU WANT
      order.products = products.map((p) => {
        // ---- STATUS LOGIC ----
  const status = (p.order_status || "").toLowerCase();

  const isConfirmed = ["confirmed", "shipped", "out for delivery", "delivered"].includes(status);
  const isShipped = ["shipped", "out for delivery", "delivered"].includes(status);
  const isOutForDelivery = ["out for delivery", "delivered"].includes(status);
  const isDelivered = status === "delivered";
  const isCancelled = status === "cancelled";

  // ---- RETURN STRUCTURED PRODUCT ----
  return {
          
        id: p.id,
        order_id: op.order_id,
        product_id: p.id,
        seller_id: p.seller_id,
        quantity: op.quantity,
        price: op.price,
        order_status: op.order_status,
        payment_status: op.payment_status,
        trackingId:sh.tracking_number,
        expectedDate:sh.estimated_delivery_date,
        deliveredOn:sh.actual_delivery_date,
        cancelledOn:sh.cancelled_date,
        partnerName:sh.courier_name,
        partnerCompany:sh.courier_company_name,
        partnerPhone:sh.courier_mobile,
        
        
        // 👉 Add new status fields
        status: p.order_status,
        isConfirmed,
        isShipped,
        isOutForDelivery,
        isDelivered,
        isCancelled,
        

        product_details: {
          name: p.product_name,
          sku: p.sku,
          status: p.status,
          detail: p.product_name,
          product_MRP:p.product_MRP,
          moq: p.moq,
          brand: p.product_brand,
          material: p.product_material,
          f_image: p.product_f_image,
          image_2 : p.image_2,
          image_3 :p.image_3,
          image_4 : p.image_4,
          made_in :p.made_in,
          specification :p.specification,
          warranty:p.warranty,
          cat_id: p.product_cat_id,
          cat_sub_id: p.product_cat_sub_id
        },

        seller_details: {
          seller_name: s.seller_name,
          seller_phone: s.seller_phone
        }
  }
      });
      
      // 🔥 ADD buyer_details & order_details STRUCTURE
      order.buyer_details = {
        buyer_id : order.buyer_id,  
        buyer_name: order.buyer_name,
        buyer_email: order.buyer_email,
        buyer_mobile: order.buyer_mobile,
      };
      
      // REMOVE FLAT BUYER FIELDS FROM ORDER
      delete order.buyer_id;
      delete order.buyer_name;
      delete order.buyer_email;
      delete order.buyer_mobile;
      
    }
    res.status(200).json(orders);
  } catch (err) {
    console.error("Error fetching orders:", err);
    res.status(500).json({ message: "Server error" });
  }
};

*/


/*export const getAllOrderByBuyer = async (req, res) => {
  try {
    const pool = await connectDB();
    const { buyer_id } = req.params;

    const [orders] = await pool.query(`SELECT * FROM orders WHERE buyer_id = ?`, [buyer_id]);
    if (orders.length === 0) return res.status(404).json({ message: "No orders found for this buyer" });

    for (const order of orders) {
      const [products] = await pool.query(`SELECT * FROM order_products WHERE order_id = ?`, [order.id]);
      order.products = products;
    }

    res.status(200).json(orders);
  } catch (err) {
    console.error("Error fetching buyer orders:", err);
    res.status(500).json({ message: "Server error" });
  }
};*/

// ======================= FILTER: BY SELLER ID ===========================
export const getAllOrderBySeller = async (req, res) => {
  try {
    const pool = await connectDB();
    const { seller_id } = req.params;

    const [products] = await pool.query(`SELECT * FROM order_products WHERE seller_id = ?`, [seller_id]);
    if (products.length === 0) return res.status(404).json({ message: "No orders found for this seller" });

    // Fetch all orders those products belong to
    const orderIds = [...new Set(products.map(p => p.order_id))];
    const [orders] = await pool.query(`SELECT * FROM orders WHERE id IN (?)`, [orderIds]);

    for (const order of orders) {
      order.products = products.filter(p => p.order_id === order.id);
    }

    res.status(200).json(orders);
  } catch (err) {
    console.error("Error fetching seller orders:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ======================= FILTER: INQUIRY ORDERS ===========================
export const getAllOrderInquiry = async (req, res) => {
  try {
    const pool = await connectDB();

    const [orders] = await pool.query(`SELECT * FROM orders WHERE order_type = 'Inquiry' ORDER BY id DESC`);
    if (orders.length === 0) return res.status(404).json({ message: "No inquiries found" });

    for (const order of orders) {
      const [products] = await pool.query(`SELECT * FROM order_products WHERE order_id = ?`, [order.id]);
      order.products = products;
    }

    res.status(200).json(orders);
  } catch (err) {
    console.error("Error fetching inquiries:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ======================= FILTER: ORder type ORDERS ===========================
export const getAllOrderOrdertype = async (req, res) => {
  try {
    const pool = await connectDB();

    const [orders] = await pool.query(`SELECT * FROM orders WHERE order_type = 'Order' ORDER BY id DESC`);
    if (orders.length === 0) return res.status(404).json({ message: "No inquiries found" });

    for (const order of orders) {
      const [products] = await pool.query(`SELECT * FROM order_products WHERE order_id = ?`, [order.id]);
      order.products = products;
    }

    res.status(200).json(orders);
  } catch (err) {
    console.error("Error fetching inquiries:", err);
    res.status(500).json({ message: "Server error" });
  }
};

