// import { connectDB } from "../../connection/db.js";
// import bcrypt from "bcrypt";

// //pid 68da4c56922dd5bc816126f9
// // //.pid2  68da4c51922dd5bc816126f5
// //buyer id :68d4deffde6c966bf42d56df
// //seller id : 68d4f5a31788865eb5be9d3e
// //order id : 68da638fe69e13874b77efce
// /*

// {
//     "buyer_id": "68d4deffde6c966bf42d56df",
//     "order_type": "Order",
//     "products": [
//     {
//       "product_id": "68da4c56922dd5bc816126f9",
//       "seller_id" : "68d4f5a31788865eb5be9d3e",
//       "quantity": 2,
//       "price": 49.99,
//       "order_status" : "New",
//       "payment_status" : "Pending"
//     },
//     {
//       "product_id": "68da4c51922dd5bc816126f5",
//       "seller_id": "68d4f5a31788865eb5be9d3e",
//       "quantity": 1,
//       "price": 100.00,
//       "order_status" : "New",
//       "payment_status" : "Pending"
//     }
//     ]
// }*/

// // ======================= CREATE ORDER ===========================
// export const createOrder = async (req, res) => {
//   try {
//     const pool = await connectDB();
//     const { buyer_id, order_type = "Order", products } = req.body;

//     if (!buyer_id || !products || products.length === 0) {
//       return res.status(400).json({ message: "buyer_id and products are required" });
//     }

//     // Create main order
//     const [orderResult] = await pool.query(
//       `INSERT INTO orders (buyer_id, order_type) VALUES (?, ?)`,
//       [buyer_id, order_type]
//     );

//     const orderId = orderResult.insertId;

//     // Insert products for the order
//     for (const p of products) {
//       await pool.query(
//         `INSERT INTO order_products (order_id, product_id, seller_id, quantity, price, order_status, payment_status)
//          VALUES (?, ?, ?, ?, ?, ?, ?)`,
//         [
//           orderId,
//           p.product_id,
//           p.seller_id || "",
//           p.quantity || 1,
//           p.price,
//           p.order_status || "New",
//           p.payment_status || "Pending",
//         ]
//       );
//     }

//     res.status(201).json({ message: "Order created successfully", order_id: orderId });
//   } catch (err) {
//     console.error("Error creating order:", err);
//     res.status(500).json({ message: "Server error", error: err.message });
//   }
// };

// // ======================= UPDATE ORDER ===========================
// export const updateOrder = async (req, res) => {
//   try {
//     const pool = await connectDB();
//     const { id } = req.params;
//     const { buyer_id, order_type, products } = req.body;

//     // Update order table
//     await pool.query(
//       `UPDATE orders SET buyer_id = ?, order_type = ?, updated_at = NOW() WHERE id = ?`,
//       [buyer_id, order_type, id]
//     );

//     // Delete old product rows and reinsert
//     if (products && products.length > 0) {
//       await pool.query(`DELETE FROM order_products WHERE order_id = ?`, [id]);
//       for (const p of products) {
//         await pool.query(
//           `INSERT INTO order_products (order_id, product_id, seller_id, quantity, price, order_status, payment_status)
//            VALUES (?, ?, ?, ?, ?, ?, ?)`,
//           [
//             id,
//             p.product_id,
//             p.seller_id,
//             p.quantity || 1,
//             p.price,
//             p.order_status || "New",
//             p.payment_status || "Pending",
//           ]
//         );
//       }
//     }

//     res.status(200).json({ message: "Order updated successfully" });
//   } catch (err) {
//     console.error("Error updating order:", err);
//     res.status(500).json({ message: "Server error", error: err.message });
//   }
// };

// // ======================= UPDATE ORDER product status ===========================
// export const updateOrderProductStatus = async (req, res) => {
//   try {
//     const pool = await connectDB();
//     const { order_product_id } = req.params;
//     const {order_status } = req.body;

//     // Update order product status
//     await pool.query(
//       `UPDATE order_products SET order_status = ? WHERE id = ?`,
//       [order_status,order_product_id]
//     );

//     res.status(200).json({ message: "Order Product status updated successfully" });
//   } catch (err) {
//     console.error("Error updating order:", err);
//     res.status(500).json({ message: "Server error", error: err.message });
//   }
// };

// // ======================= GET ALL ORDERS ===========================
// export const getAllOrder = async (req, res) => {
//   try {
//     const pool = await connectDB();
//    // const [orders] = await pool.query(`SELECT * FROM orders ORDER BY id DESC`);
//     const [orders] = await pool.query(`SELECT o.*, b.name AS buyer_name, b.email AS buyer_email, b.mobile AS buyer_mobile
//   FROM orders o
//   LEFT JOIN buyer b ON o.buyer_id = b.id ORDER BY id DESC`);

//     for (const order of orders) {
//   //   const [products] = await pool.query(`SELECT * FROM order_products WHERE order_id = ?`, [order.id]);
//      const [products] = await pool.query( `
//       SELECT
//         op.*,p.*,sh.*,

//         -- product details
//         p.name AS product_name,
//         p.brand AS product_brand,
//         p.material AS product_material,
//         p.f_image AS product_f_image,
//         p.cat_id AS product_cat_id,
//         p.cat_sub_id AS product_cat_sub_id,

//         -- seller details
//         s.name AS seller_name,
//         s.mobile AS seller_phone

//       FROM order_products op
//       LEFT JOIN product p ON op.product_id = p.id
//       LEFT JOIN seller s ON op.seller_id = s.id
//       LEFT JOIN shipping sh on sh.product_id = p.id AND sh.order_id = op.order_id
//       WHERE op.order_id = ?
//     `, [order.id]);

//     // 👉 FORMAT EXACT STRUCTURE YOU WANT
//       order.products = products.map((p) => {
//         // ---- STATUS LOGIC ----
//   const status = (p.order_status || "").toLowerCase();

// const isNewOrPending = ["new", "pending"].includes(status);
//   const isConfirmed = ["confirmed", "shipped", "out for delivery", "delivered"].includes(status);
//   const isShipped = ["shipped", "out for delivery", "delivered"].includes(status);
//   const isOutForDelivery = ["out for delivery", "delivered"].includes(status);
//   const isDelivered = status === "delivered";
//   const isCancelled = status === "cancelled";

//   // ---- RETURN STRUCTURED PRODUCT ----
//   return {

//         id: p.id,
//         order_id: p.order_id,
//         product_id: p.product_id,
//         seller_id: p.seller_id,
//         quantity: p.quantity,
//         price: p.price,
//         order_status: p.order_status,
//         payment_status: p.payment_status,
//         trackingId:p.tracking_number,
//         expectedDate:p.estimated_delivery_date,
//         deliveredOn:p.actual_delivery_date,
//         cancelledOn:p.cancelled_date,
//         partnerName:p.courier_name,
//         partnerCompany:p.courier_company_name,
//         partnerPhone:p.courier_mobile,

//         // 👉 Add new status fields
//         status: p.order_status,
//         isConfirmed,
//         isShipped,
//         isOutForDelivery,
//         isDelivered,
//         isCancelled,

//         product_details: {
//           name: p.product_name,
//           sku: p.sku,
//           status: p.status,
//           detail: p.product_name,
//           product_MRP:p.product_MRP,
//           moq: p.moq,
//           brand: p.product_brand,
//           material: p.product_material,
//           f_image: p.product_f_image,
//           image_2 : p.image_2,
//           image_3 :p.image_3,
//           image_4 : p.image_4,
//           made_in :p.made_in,
//           specification :p.specification,
//           warranty:p.warranty,
//           cat_id: p.product_cat_id,
//           cat_sub_id: p.product_cat_sub_id
//         },

//         seller_details: {
//           seller_name: p.seller_name,
//           seller_phone: p.seller_phone
//         }
//   }
//       });

//       // 🔥 ADD buyer_details & order_details STRUCTURE
//       order.buyer_details = {
//         buyer_id : order.buyer_id,
//         buyer_name: order.buyer_name,
//         buyer_email: order.buyer_email,
//         buyer_mobile: order.buyer_mobile,
//       };

//       // REMOVE FLAT BUYER FIELDS FROM ORDER
//       delete order.buyer_id;
//       delete order.buyer_name;
//       delete order.buyer_email;
//       delete order.buyer_mobile;

//     }
//     res.status(200).json(orders);
//   } catch (err) {
//     console.error("Error fetching orders:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// };

// // ======================= GET ORDER BY ID ===========================
// export const getDataById = async (req, res) => {
//   try {
//     const pool = await connectDB();
//     const { id } = req.params;

//      const [orders] = await pool.query(`SELECT o.*, b.name AS buyer_name, b.email AS buyer_email, b.mobile AS buyer_mobile
//   FROM orders o
//   LEFT JOIN buyer b ON o.buyer_id = b.id WHERE o.id = ? ORDER BY id DESC`,[id]);

//     for (const order of orders) {
//   //   const [products] = await pool.query(`SELECT * FROM order_products WHERE order_id = ?`, [order.id]);
//      const [products] = await pool.query( `
//       SELECT
//         op.*,p.*,sh.*,

//         -- product details
//         p.name AS product_name,
//         p.brand AS product_brand,
//         p.material AS product_material,
//         p.f_image AS product_f_image,
//         p.cat_id AS product_cat_id,
//         p.cat_sub_id AS product_cat_sub_id,

//         -- seller details
//         s.name AS seller_name,
//         s.mobile AS seller_phone

//       FROM order_products op
//       LEFT JOIN product p ON op.product_id = p.id
//       LEFT JOIN seller s ON op.seller_id = s.id
//       LEFT JOIN shipping sh on sh.product_id = p.id AND sh.order_id = op.order_id
//       WHERE op.order_id = ?
//     `, [order.id]);

//     // 👉 FORMAT EXACT STRUCTURE YOU WANT
//       order.products = products.map((p) => {
//         // ---- STATUS LOGIC ----
//   const status = (p.order_status || "").toLowerCase();

//   const isConfirmed = ["confirmed", "shipped", "out for delivery", "delivered"].includes(status);
//   const isShipped = ["shipped", "out for delivery", "delivered"].includes(status);
//   const isOutForDelivery = ["out for delivery", "delivered"].includes(status);
//   const isDelivered = status === "delivered";
//   const isCancelled = status === "cancelled";

//   // ---- RETURN STRUCTURED PRODUCT ----
//   return {

//         id: p.id,
//         order_id: p.order_id,
//         product_id: p.product_id,
//         seller_id: p.seller_id,
//         quantity: p.quantity,
//         price: p.price,
//         order_status: p.order_status,
//         payment_status: p.payment_status,
//         trackingId:p.tracking_number,
//         expectedDate:p.estimated_delivery_date,
//         deliveredOn:p.actual_delivery_date,
//         cancelledOn:p.cancelled_date,
//         partnerName:p.courier_name,
//         partnerCompany:p.courier_company_name,
//         partnerPhone:p.courier_mobile,

//         //  Add new status fields
//         status: p.order_status,
//         isConfirmed,
//         isShipped,
//         isOutForDelivery,
//         isDelivered,
//         isCancelled,

//         product_details: {
//           name: p.product_name,
//           sku: p.sku,
//           status: p.status,
//           detail: p.product_name,
//           product_MRP:p.product_MRP,
//           moq: p.moq,
//           brand: p.product_brand,
//           material: p.product_material,
//           f_image: p.product_f_image,
//           image_2 : p.image_2,
//           image_3 :p.image_3,
//           image_4 : p.image_4,
//           made_in :p.made_in,
//           specification :p.specification,
//           warranty:p.warranty,
//           cat_id: p.product_cat_id,
//           cat_sub_id: p.product_cat_sub_id
//         },

//         seller_details: {
//           seller_name: p.seller_name,
//           seller_phone: p.seller_phone
//         }
//   }
//       });

//       //  ADD buyer_details & order_details STRUCTURE
//       order.buyer_details = {
//         buyer_id : order.buyer_id,
//         buyer_name: order.buyer_name,
//         buyer_email: order.buyer_email,
//         buyer_mobile: order.buyer_mobile,
//       };

//       // REMOVE FLAT BUYER FIELDS FROM ORDER
//       delete order.buyer_id;
//       delete order.buyer_name;
//       delete order.buyer_email;
//       delete order.buyer_mobile;

//     }
//     res.status(200).json(orders);
//   } catch (err) {
//     console.error("Error fetching order:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// };

// /*export const getDataById = async (req, res) => {
//   try {
//     const pool = await connectDB();
//     const { id } = req.params;

//     const [orders] = await pool.query(`SELECT * FROM orders WHERE id = ?`, [id]);
//     if (orders.length === 0) return res.status(404).json({ message: "Order not found" });

//     const order = orders[0];
//     const [products] = await pool.query(`SELECT * FROM order_products WHERE order_id = ?`, [id]);
//     order.products = products;

//     res.status(200).json(order);
//   } catch (err) {
//     console.error("Error fetching order:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// };*/

// // ======================= DELETE ORDER ===========================
// export const deleteOrder = async (req, res) => {
//   try {
//     const pool = await connectDB();
//     const { id } = req.params;

//     await pool.query(`DELETE FROM orders WHERE id = ?`, [id]);

//     res.status(200).json({ message: "Order deleted successfully" });
//   } catch (err) {
//     console.error("Error deleting order:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// };

// // ======================= FILTER: BY BUYER ID ===========================
// // ======================= FILTER: BY BUYER ID ===========================
// export const getAllOrderByBuyer = async (req, res) => {
//   try {
//     const pool = await connectDB();
//     const { buyer_id } = req.params;

//     // ===== GET ORDERS =====
//     const [orders] = await pool.query(`
//       SELECT
//         o.*,
//         b.name AS buyer_name,
//         b.email AS buyer_email,
//         b.mobile AS buyer_mobile
//       FROM orders o
//       LEFT JOIN buyer b ON o.buyer_id = b.id
//       WHERE o.buyer_id = ?
//       ORDER BY o.id DESC
//     `, [buyer_id]);

//     // ===== LOOP ORDERS =====
//     for (const order of orders) {

//       const [products] = await pool.query(`
//         SELECT
//           op.*,
//           p.*,
//           sh.*,

//           -- product details
//           p.name AS product_name,
//           p.brand AS product_brand,
//           p.material AS product_material,
//           p.f_image AS product_f_image,
//           p.cat_id AS product_cat_id,
//           p.cat_sub_id AS product_cat_sub_id,

//           -- seller details
//           s.name AS seller_name,
//           s.mobile AS seller_phone

//         FROM order_products op
//         LEFT JOIN product p ON op.product_id = p.id
//         LEFT JOIN seller s ON op.seller_id = s.id
//         LEFT JOIN shipping sh
//           ON sh.product_id = p.id
//           AND sh.order_id = op.order_id
//         WHERE op.order_id = ?
//       `, [order.id]);

//       // ===== FORMAT PRODUCTS =====
//       order.products = products.map((p) => {

//         const status = (p.order_status || "").toLowerCase();

//         const isConfirmed = ["confirmed", "shipped", "out for delivery", "delivered"].includes(status);
//         const isShipped = ["shipped", "out for delivery", "delivered"].includes(status);
//         const isOutForDelivery = ["out for delivery", "delivered"].includes(status);
//         const isDelivered = status === "delivered";
//         const isCancelled = status === "cancelled";

//         return {
//           id: p.id,
//           order_id: p.order_id,
//           product_id: p.product_id,
//           seller_id: p.seller_id,
//           quantity: p.quantity,
//           price: p.price,
//           order_status: p.order_status,
//           payment_status: p.payment_status,

//           trackingId: p.tracking_number,
//           expectedDate: p.estimated_delivery_date,
//           deliveredOn: p.actual_delivery_date,
//           cancelledOn: p.cancelled_date,
//           partnerName: p.courier_name,
//           partnerCompany: p.courier_company_name,
//           partnerPhone: p.courier_mobile,

//           status: p.order_status,
//           isConfirmed,
//           isShipped,
//           isOutForDelivery,
//           isDelivered,
//           isCancelled,

//           product_details: {
//             name: p.product_name,
//             sku: p.sku,
//             status: p.status,
//             detail: p.product_name,
//             product_MRP: p.product_MRP,
//             moq: p.moq,
//             brand: p.product_brand,
//             material: p.product_material,
//             f_image: p.product_f_image,
//             image_2: p.image_2,
//             image_3: p.image_3,
//             image_4: p.image_4,
//             made_in: p.made_in,
//             specification: p.specification,
//             warranty: p.warranty,
//             cat_id: p.product_cat_id,
//             cat_sub_id: p.product_cat_sub_id
//           },

//           seller_details: {
//             seller_name: p.seller_name,
//             seller_phone: p.seller_phone
//           }
//         };
//       });

//       // ===== BUYER DETAILS STRUCTURE =====
//       order.buyer_details = {
//         buyer_id: order.buyer_id,
//         buyer_name: order.buyer_name,
//         buyer_email: order.buyer_email,
//         buyer_mobile: order.buyer_mobile,
//       };

//       // REMOVE FLAT BUYER FIELDS
//       delete order.buyer_id;
//       delete order.buyer_name;
//       delete order.buyer_email;
//       delete order.buyer_mobile;
//     }

//     res.status(200).json(orders);

//   } catch (err) {
//     console.error("Error fetching orders:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// };

// /*// date 7/2/26
// export const getAllOrderByBuyer = async (req, res) => {
//   try {
//     const pool = await connectDB();

//     const { buyer_id } = req.params;

//     //const [orders] = await pool.query(`SELECT * FROM orders WHERE buyer_id = ?`, [buyer_id]);
//    // const [orders] = await pool.query(`SELECT * FROM orders ORDER BY id DESC`);
//     const [orders] = await pool.query(`SELECT o.*, b.name AS buyer_name, b.email AS buyer_email, b.mobile AS buyer_mobile
//   FROM orders o
//   LEFT JOIN buyer b ON o.buyer_id = b.id WHERE o.buyer_id = ? ORDER BY id DESC`,[buyer_id]);

//     for (const order of orders) {
//   //   const [products] = await pool.query(`SELECT * FROM order_products WHERE order_id = ?`, [order.id]);
//      const [products] = await pool.query( `
//       SELECT
//         op.*,p.*,sh.*,

//         -- product details
//         p.name AS product_name,
//         p.brand AS product_brand,
//         p.material AS product_material,
//         p.f_image AS product_f_image,
//         p.cat_id AS product_cat_id,
//         p.cat_sub_id AS product_cat_sub_id,

//         -- seller details
//         s.name AS seller_name,
//         s.mobile AS seller_phone

//       FROM order_products op
//       LEFT JOIN product p ON op.product_id = p.id
//       LEFT JOIN seller s ON op.seller_id = s.id
//       LEFT JOIN shipping sh on sh.product_id = p.id AND sh.order_id = op.order_id
//       WHERE op.order_id = ?
//     `, [order.id]);

//     // 👉 FORMAT EXACT STRUCTURE YOU WANT
//       order.products = products.map((p) => {
//         // ---- STATUS LOGIC ----
//   const status = (p.order_status || "").toLowerCase();

//   const isConfirmed = ["confirmed", "shipped", "out for delivery", "delivered"].includes(status);
//   const isShipped = ["shipped", "out for delivery", "delivered"].includes(status);
//   const isOutForDelivery = ["out for delivery", "delivered"].includes(status);
//   const isDelivered = status === "delivered";
//   const isCancelled = status === "cancelled";

//   // ---- RETURN STRUCTURED PRODUCT ----
//   return {

//         id: p.id,
//         order_id: op.order_id,
//         product_id: p.id,
//         seller_id: p.seller_id,
//         quantity: op.quantity,
//         price: op.price,
//         order_status: op.order_status,
//         payment_status: op.payment_status,
//         trackingId:sh.tracking_number,
//         expectedDate:sh.estimated_delivery_date,
//         deliveredOn:sh.actual_delivery_date,
//         cancelledOn:sh.cancelled_date,
//         partnerName:sh.courier_name,
//         partnerCompany:sh.courier_company_name,
//         partnerPhone:sh.courier_mobile,

//         // 👉 Add new status fields
//         status: p.order_status,
//         isConfirmed,
//         isShipped,
//         isOutForDelivery,
//         isDelivered,
//         isCancelled,

//         product_details: {
//           name: p.product_name,
//           sku: p.sku,
//           status: p.status,
//           detail: p.product_name,
//           product_MRP:p.product_MRP,
//           moq: p.moq,
//           brand: p.product_brand,
//           material: p.product_material,
//           f_image: p.product_f_image,
//           image_2 : p.image_2,
//           image_3 :p.image_3,
//           image_4 : p.image_4,
//           made_in :p.made_in,
//           specification :p.specification,
//           warranty:p.warranty,
//           cat_id: p.product_cat_id,
//           cat_sub_id: p.product_cat_sub_id
//         },

//         seller_details: {
//           seller_name: s.seller_name,
//           seller_phone: s.seller_phone
//         }
//   }
//       });

//       // 🔥 ADD buyer_details & order_details STRUCTURE
//       order.buyer_details = {
//         buyer_id : order.buyer_id,
//         buyer_name: order.buyer_name,
//         buyer_email: order.buyer_email,
//         buyer_mobile: order.buyer_mobile,
//       };

//       // REMOVE FLAT BUYER FIELDS FROM ORDER
//       delete order.buyer_id;
//       delete order.buyer_name;
//       delete order.buyer_email;
//       delete order.buyer_mobile;

//     }
//     res.status(200).json(orders);
//   } catch (err) {
//     console.error("Error fetching orders:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// };

// */

// /*export const getAllOrderByBuyer = async (req, res) => {
//   try {
//     const pool = await connectDB();
//     const { buyer_id } = req.params;

//     const [orders] = await pool.query(`SELECT * FROM orders WHERE buyer_id = ?`, [buyer_id]);
//     if (orders.length === 0) return res.status(404).json({ message: "No orders found for this buyer" });

//     for (const order of orders) {
//       const [products] = await pool.query(`SELECT * FROM order_products WHERE order_id = ?`, [order.id]);
//       order.products = products;
//     }

//     res.status(200).json(orders);
//   } catch (err) {
//     console.error("Error fetching buyer orders:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// };*/

// // ======================= FILTER: BY SELLER ID ===========================
// export const getAllOrderBySeller = async (req, res) => {
//   try {
//     const pool = await connectDB();
//     const { seller_id } = req.params;

//     const [products] = await pool.query(`SELECT * FROM order_products WHERE seller_id = ?`, [seller_id]);
//     if (products.length === 0) return res.status(404).json({ message: "No orders found for this seller" });

//     // Fetch all orders those products belong to
//     const orderIds = [...new Set(products.map(p => p.order_id))];
//     const [orders] = await pool.query(`SELECT * FROM orders WHERE id IN (?)`, [orderIds]);

//     for (const order of orders) {
//       order.products = products.filter(p => p.order_id === order.id);
//     }

//     res.status(200).json(orders);
//   } catch (err) {
//     console.error("Error fetching seller orders:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// };

// // ======================= FILTER: INQUIRY ORDERS ===========================
// export const getAllOrderInquiry = async (req, res) => {
//   try {
//     const pool = await connectDB();

//     const [orders] = await pool.query(`SELECT * FROM orders WHERE order_type = 'Inquiry' ORDER BY id DESC`);
//     if (orders.length === 0) return res.status(404).json({ message: "No inquiries found" });

//     for (const order of orders) {
//       const [products] = await pool.query(`SELECT * FROM order_products WHERE order_id = ?`, [order.id]);
//       order.products = products;
//     }

//     res.status(200).json(orders);
//   } catch (err) {
//     console.error("Error fetching inquiries:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// };

// // ======================= FILTER: ORder type ORDERS ===========================
// export const getAllOrderOrdertype = async (req, res) => {
//   try {
//     const pool = await connectDB();

//     const [orders] = await pool.query(`SELECT * FROM orders WHERE order_type = 'Order' ORDER BY id DESC`);
//     if (orders.length === 0) return res.status(404).json({ message: "No inquiries found" });

//     for (const order of orders) {
//       const [products] = await pool.query(`SELECT * FROM order_products WHERE order_id = ?`, [order.id]);
//       order.products = products;
//     }

//     res.status(200).json(orders);
//   } catch (err) {
//     console.error("Error fetching inquiries:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// };

// import { connectDB } from "../../connection/db.js";
// import bcrypt from "bcrypt";

// //pid 68da4c56922dd5bc816126f9
// // //.pid2  68da4c51922dd5bc816126f5
// //buyer id :68d4deffde6c966bf42d56df
// //seller id : 68d4f5a31788865eb5be9d3e
// //order id : 68da638fe69e13874b77efce
// /*

// {
//     "buyer_id": "68d4deffde6c966bf42d56df",
//     "order_type": "Order",
//     "products": [
//     {
//       "product_id": "68da4c56922dd5bc816126f9",
//       "seller_id" : "68d4f5a31788865eb5be9d3e",
//       "quantity": 2,
//       "price": 49.99,
//       "order_status" : "New",
//       "payment_status" : "Pending"
//     },
//     {
//       "product_id": "68da4c51922dd5bc816126f5",
//       "seller_id": "68d4f5a31788865eb5be9d3e",
//       "quantity": 1,
//       "price": 100.00,
//       "order_status" : "New",
//       "payment_status" : "Pending"
//     }
//     ]
// }*/

// // ======================= CREATE ORDER ===========================
// // export const createOrder = async (req, res) => {
// //   try {
// //     const pool = await connectDB();
// //     const { buyer_id, order_type = "Order", products } = req.body;

// //     if (!buyer_id || !products || products.length === 0) {
// //       return res.status(400).json({ message: "buyer_id and products are required" });
// //     }

// //     // Create main order
// //     const [orderResult] = await pool.query(
// //       `INSERT INTO orders (buyer_id, order_type) VALUES (?, ?)`,
// //       [buyer_id, order_type]
// //     );

// //     const orderId = orderResult.insertId;

// //     // Insert products for the order
// //     for (const p of products) {
// //       await pool.query(
// //         `INSERT INTO order_products (order_id, product_id, seller_id, quantity, price, order_status, payment_status)
// //          VALUES (?, ?, ?, ?, ?, ?, ?)`,
// //         [
// //           orderId,
// //           p.product_id,
// //           p.seller_id || "",
// //           p.quantity || 1,
// //           p.price,
// //           p.order_status || "New",
// //           p.payment_status || "Pending",
// //         ]
// //       );
// //     }

// //     res.status(201).json({ message: "Order created successfully", order_id: orderId });
// //   } catch (err) {
// //     console.error("Error creating order:", err);
// //     res.status(500).json({ message: "Server error", error: err.message });
// //   }
// // };

// export const createOrder = async (req, res) => {
//   try {
//     const { buyer_id, order_type = "Order", products } = req.body;

//     // ── Validate top-level fields ──────────────────────────────────────────
//     if (!buyer_id) {
//       return res.status(400).json({ message: "buyer_id is required" });
//     }

//     if (!Array.isArray(products) || products.length === 0) {
//       return res.status(400).json({ message: "products must be a non-empty array" });
//     }

//     // ── Validate each product ──────────────────────────────────────────────
//     const productErrors = [];

//     products.forEach((p, index) => {
//       const errors = [];

//       if (!p.product_id) errors.push("product_id is required");
//       if (!p.seller_id)  errors.push("seller_id is required");

//       if (p.price === undefined || p.price === null) {
//         errors.push("price is required");
//       } else if (isNaN(Number(p.price)) || Number(p.price) < 0) {
//         errors.push("price must be a non-negative number");
//       }

//       if (p.quantity !== undefined && (isNaN(Number(p.quantity)) || Number(p.quantity) < 1)) {
//         errors.push("quantity must be a positive number");
//       }

//       const validOrderStatuses   = ["New", "Processing", "Shipped", "Delivered", "Cancelled"];
//       const validPaymentStatuses = ["Pending", "Paid", "Failed", "Refunded"];

//       if (p.order_status && !validOrderStatuses.includes(p.order_status)) {
//         errors.push(`order_status must be one of: ${validOrderStatuses.join(", ")}`);
//       }

//       if (p.payment_status && !validPaymentStatuses.includes(p.payment_status)) {
//         errors.push(`payment_status must be one of: ${validPaymentStatuses.join(", ")}`);
//       }

//       if (errors.length > 0) {
//         productErrors.push({ index, product_id: p.product_id ?? null, errors });
//       }
//     });

//     if (productErrors.length > 0) {
//       return res.status(400).json({ message: "Invalid product data", productErrors });
//     }

//     // ── DB operations ──────────────────────────────────────────────────────
//     const pool = await connectDB();

//     // Insert main order
//     const [orderResult] = await pool.query(
//       `INSERT INTO orders (buyer_id, order_type) VALUES (?, ?)`,
//       [buyer_id, order_type]
//     );
//     const orderId = orderResult.insertId;

//     // ✅ Loop insert — reliable across all mysql2 versions
//     for (const p of products) {
//       await pool.query(
//         `INSERT INTO order_products
//           (order_id, product_id, seller_id, quantity, price, order_status, payment_status)
//          VALUES (?, ?, ?, ?, ?, ?, ?)`,
//         [
//           orderId,
//           p.product_id,
//           p.seller_id,
//           Number(p.quantity) || 1,
//           Number(p.price),
//           p.order_status    || "New",
//           p.payment_status  || "Pending",
//         ]
//       );
//     }

//     return res.status(201).json({ message: "Order created successfully", order_id: orderId });

//   } catch (err) {
//     console.error("Error creating order:", err);
//     return res.status(500).json({ message: "Server error", error: err.message });
//   }
// };

// // ======================= UPDATE ORDER ===========================
// export const updateOrder = async (req, res) => {
//   try {
//     const pool = await connectDB();
//     const { id } = req.params;
//     const { buyer_id, order_type, products } = req.body;

//     // Update order table
//     await pool.query(
//       `UPDATE orders SET buyer_id = ?, order_type = ?, updated_at = NOW() WHERE id = ?`,
//       [buyer_id, order_type, id]
//     );

//     // Delete old product rows and reinsert
//     if (products && products.length > 0) {
//       await pool.query(`DELETE FROM order_products WHERE order_id = ?`, [id]);
//       for (const p of products) {
//         await pool.query(
//           `INSERT INTO order_products (order_id, product_id, seller_id, quantity, price, order_status, payment_status)
//           VALUES (?, ?, ?, ?, ?, ?, ?)`,
//           [
//             id,
//             p.product_id,
//             p.seller_id,
//             p.quantity || 1,
//             p.price,
//             p.order_status || "New",
//             p.payment_status || "Pending",
//           ]
//         );
//       }
//     }

//     res.status(200).json({ message: "Order updated successfully" });
//   } catch (err) {
//     console.error("Error updating order:", err);
//     res.status(500).json({ message: "Server error", error: err.message });
//   }
// };

// // ======================= UPDATE ORDER product status ===========================
// export const updateOrderProductStatus = async (req, res) => {
//   try {
//     const pool = await connectDB();
//     const { order_product_id } = req.params;
//     const {order_status } = req.body;

//     // Update order product status
//     await pool.query(
//       `UPDATE order_products SET order_status = ? WHERE id = ?`,
//       [order_status,order_product_id]
//     );

//     res.status(200).json({ message: "Order Product status updated successfully" });
//   } catch (err) {
//     console.error("Error updating order:", err);
//     res.status(500).json({ message: "Server error", error: err.message });
//   }
// };

// // ======================= GET ALL ORDERS ===========================
// export const getAllOrder = async (req, res) => {
//   try {
//     const pool = await connectDB();
//   // const [orders] = await pool.query(`SELECT * FROM orders ORDER BY id DESC`);
//     const [orders] = await pool.query(`SELECT o.*, b.name AS buyer_name, b.email AS buyer_email, b.mobile AS buyer_mobile
//   FROM orders o
//   LEFT JOIN buyer b ON o.buyer_id = b.id ORDER BY id DESC`);

//     for (const order of orders) {
//   //   const [products] = await pool.query(`SELECT * FROM order_products WHERE order_id = ?`, [order.id]);
//      const [products] = await pool.query( `
//       SELECT
//         op.*,p.*,sh.*,

//         -- product details
//         p.name AS product_name,
//         p.brand AS product_brand,
//         p.material AS product_material,
//         p.f_image AS product_f_image,
//         p.cat_id AS product_cat_id,
//         p.cat_sub_id AS product_cat_sub_id,

//         -- seller details
//         s.name AS seller_name,
//         s.mobile AS seller_phone

//       FROM order_products op
//       LEFT JOIN product p ON op.product_id = p.id
//       LEFT JOIN seller s ON op.seller_id = s.id
//       LEFT JOIN shipping sh on sh.product_id = p.id AND sh.order_id = op.order_id
//       WHERE op.order_id = ?
//     `, [order.id]);

//     // ðŸ‘‰ FORMAT EXACT STRUCTURE YOU WANT
//       order.products = products.map((p) => {
//         // ---- STATUS LOGIC ----
//   const status = (p.order_status || "").toLowerCase();

// const isNewOrPending = ["new", "pending"].includes(status);
//   const isConfirmed = ["confirmed", "shipped", "out for delivery", "delivered"].includes(status);
//   const isShipped = ["shipped", "out for delivery", "delivered"].includes(status);
//   const isOutForDelivery = ["out for delivery", "delivered"].includes(status);
//   const isDelivered = status === "delivered";
//   const isCancelled = status === "cancelled";

//   // ---- RETURN STRUCTURED PRODUCT ----
//   return {

//         id: p.id,
//         order_id: p.order_id,
//         product_id: p.product_id,
//         seller_id: p.seller_id,
//         quantity: p.quantity,
//         price: p.price,
//         order_status: p.order_status,
//         payment_status: p.payment_status,
//         trackingId:p.tracking_number,
//         expectedDate:p.estimated_delivery_date,
//         deliveredOn:p.actual_delivery_date,
//         cancelledOn:p.cancelled_date,
//         partnerName:p.courier_name,
//         partnerCompany:p.courier_company_name,
//         partnerPhone:p.courier_mobile,

//         // ðŸ‘‰ Add new status fields
//         status: p.order_status,
//         isConfirmed,
//         isShipped,
//         isOutForDelivery,
//         isDelivered,
//         isCancelled,

//         product_details: {
//           name: p.product_name,
//           sku: p.sku,
//           status: p.status,
//           detail: p.product_name,
//           product_MRP:p.product_MRP,
//           moq: p.moq,
//           brand: p.product_brand,
//           material: p.product_material,
//           f_image: p.product_f_image,
//           image_2 : p.image_2,
//           image_3 :p.image_3,
//           image_4 : p.image_4,
//           made_in :p.made_in,
//           specification :p.specification,
//           warranty:p.warranty,
//           cat_id: p.product_cat_id,
//           cat_sub_id: p.product_cat_sub_id
//         },

//         seller_details: {
//           seller_name: p.seller_name,
//           seller_phone: p.seller_phone
//         }
//   }
//       });

//       // ðŸ”¥ ADD buyer_details & order_details STRUCTURE
//       order.buyer_details = {
//         buyer_id : order.buyer_id,
//         buyer_name: order.buyer_name,
//         buyer_email: order.buyer_email,
//         buyer_mobile: order.buyer_mobile,
//       };

//       // REMOVE FLAT BUYER FIELDS FROM ORDER
//       delete order.buyer_id;
//       delete order.buyer_name;
//       delete order.buyer_email;
//       delete order.buyer_mobile;

//     }
//     res.status(200).json(orders);
//   } catch (err) {
//     console.error("Error fetching orders:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// };

// // ======================= GET ORDER BY ID ===========================
// export const getDataById = async (req, res) => {
//   try {
//     const pool = await connectDB();
//     const { id } = req.params;

//      const [orders] = await pool.query(`SELECT o.*, b.name AS buyer_name, b.email AS buyer_email, b.mobile AS buyer_mobile
//   FROM orders o
//   LEFT JOIN buyer b ON o.buyer_id = b.id WHERE o.id = ? ORDER BY id DESC`,[id]);

//     for (const order of orders) {
//   //   const [products] = await pool.query(`SELECT * FROM order_products WHERE order_id = ?`, [order.id]);
//      const [products] = await pool.query( `
//       SELECT
//         op.*,p.*,sh.*,

//         -- product details
//         p.name AS product_name,
//         p.brand AS product_brand,
//         p.material AS product_material,
//         p.f_image AS product_f_image,
//         p.cat_id AS product_cat_id,
//         p.cat_sub_id AS product_cat_sub_id,

//         -- seller details
//         s.name AS seller_name,
//         s.mobile AS seller_phone

//       FROM order_products op
//       LEFT JOIN product p ON op.product_id = p.id
//       LEFT JOIN seller s ON op.seller_id = s.id
//       LEFT JOIN shipping sh on sh.product_id = p.id AND sh.order_id = op.order_id
//       WHERE op.order_id = ?
//     `, [order.id]);

//     // ðŸ‘‰ FORMAT EXACT STRUCTURE YOU WANT
//       order.products = products.map((p) => {
//         // ---- STATUS LOGIC ----
//   const status = (p.order_status || "").toLowerCase();

//   const isConfirmed = ["confirmed", "shipped", "out for delivery", "delivered"].includes(status);
//   const isShipped = ["shipped", "out for delivery", "delivered"].includes(status);
//   const isOutForDelivery = ["out for delivery", "delivered"].includes(status);
//   const isDelivered = status === "delivered";
//   const isCancelled = status === "cancelled";

//   // ---- RETURN STRUCTURED PRODUCT ----
//   return {

//         id: p.id,
//         order_id: p.order_id,
//         product_id: p.product_id,
//         seller_id: p.seller_id,
//         quantity: p.quantity,
//         price: p.price,
//         order_status: p.order_status,
//         payment_status: p.payment_status,
//         trackingId:p.tracking_number,
//         expectedDate:p.estimated_delivery_date,
//         deliveredOn:p.actual_delivery_date,
//         cancelledOn:p.cancelled_date,
//         partnerName:p.courier_name,
//         partnerCompany:p.courier_company_name,
//         partnerPhone:p.courier_mobile,

//         //  Add new status fields
//         status: p.order_status,
//         isConfirmed,
//         isShipped,
//         isOutForDelivery,
//         isDelivered,
//         isCancelled,

//         product_details: {
//           name: p.product_name,
//           sku: p.sku,
//           status: p.status,
//           detail: p.product_name,
//           product_MRP:p.product_MRP,
//           moq: p.moq,
//           brand: p.product_brand,
//           material: p.product_material,
//           f_image: p.product_f_image,
//           image_2 : p.image_2,
//           image_3 :p.image_3,
//           image_4 : p.image_4,
//           made_in :p.made_in,
//           specification :p.specification,
//           warranty:p.warranty,
//           cat_id: p.product_cat_id,
//           cat_sub_id: p.product_cat_sub_id
//         },

//         seller_details: {
//           seller_name: p.seller_name,
//           seller_phone: p.seller_phone
//         }
//   }
//       });

//       //  ADD buyer_details & order_details STRUCTURE
//       order.buyer_details = {
//         buyer_id : order.buyer_id,
//         buyer_name: order.buyer_name,
//         buyer_email: order.buyer_email,
//         buyer_mobile: order.buyer_mobile,
//       };

//       // REMOVE FLAT BUYER FIELDS FROM ORDER
//       delete order.buyer_id;
//       delete order.buyer_name;
//       delete order.buyer_email;
//       delete order.buyer_mobile;

//     }
//     res.status(200).json(orders);
//   } catch (err) {
//     console.error("Error fetching order:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// };

// /*export const getDataById = async (req, res) => {
//   try {
//     const pool = await connectDB();
//     const { id } = req.params;

//     const [orders] = await pool.query(`SELECT * FROM orders WHERE id = ?`, [id]);
//     if (orders.length === 0) return res.status(404).json({ message: "Order not found" });

//     const order = orders[0];
//     const [products] = await pool.query(`SELECT * FROM order_products WHERE order_id = ?`, [id]);
//     order.products = products;

//     res.status(200).json(order);
//   } catch (err) {
//     console.error("Error fetching order:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// };*/

// // ======================= DELETE ORDER ===========================
// export const deleteOrder = async (req, res) => {
//   try {
//     const pool = await connectDB();
//     const { id } = req.params;

//     await pool.query(`DELETE FROM orders WHERE id = ?`, [id]);

//     res.status(200).json({ message: "Order deleted successfully" });
//   } catch (err) {
//     console.error("Error deleting order:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// };

// // ======================= FILTER: BY BUYER ID ===========================
// // ======================= FILTER: BY BUYER ID ===========================
// export const getAllOrderByBuyer = async (req, res) => {
//   try {
//     const pool = await connectDB();
//     const { buyer_id } = req.params;

//     // ===== GET ORDERS =====
//     const [orders] = await pool.query(`
//       SELECT
//         o.*,
//         b.name AS buyer_name,
//         b.email AS buyer_email,
//         b.mobile AS buyer_mobile
//       FROM orders o
//       LEFT JOIN buyer b ON o.buyer_id = b.id
//       WHERE o.buyer_id = ?
//       ORDER BY o.id DESC
//     `, [buyer_id]);

//     // ===== LOOP ORDERS =====
//     for (const order of orders) {

//       const [products] = await pool.query(`
//         SELECT
//           op.*,
//           p.*,
//           sh.*,

//           -- product details
//           p.name AS product_name,
//           p.brand AS product_brand,
//           p.material AS product_material,
//           p.f_image AS product_f_image,
//           p.cat_id AS product_cat_id,
//           p.cat_sub_id AS product_cat_sub_id,

//           -- seller details
//           s.name AS seller_name,
//           s.mobile AS seller_phone

//         FROM order_products op
//         LEFT JOIN product p ON op.product_id = p.id
//         LEFT JOIN seller s ON op.seller_id = s.id
//         LEFT JOIN shipping sh
//           ON sh.product_id = p.id
//           AND sh.order_id = op.order_id
//         WHERE op.order_id = ?
//       `, [order.id]);

//       // ===== FORMAT PRODUCTS =====
//       order.products = products.map((p) => {

//         const status = (p.order_status || "").toLowerCase();

//         const isConfirmed = ["confirmed", "shipped", "out for delivery", "delivered"].includes(status);
//         const isShipped = ["shipped", "out for delivery", "delivered"].includes(status);
//         const isOutForDelivery = ["out for delivery", "delivered"].includes(status);
//         const isDelivered = status === "delivered";
//         const isCancelled = status === "cancelled";

//         return {
//           id: p.id,
//           order_id: p.order_id,
//           product_id: p.product_id,
//           seller_id: p.seller_id,
//           quantity: p.quantity,
//           price: p.price,
//           order_status: p.order_status,
//           payment_status: p.payment_status,

//           trackingId: p.tracking_number,
//           expectedDate: p.estimated_delivery_date,
//           deliveredOn: p.actual_delivery_date,
//           cancelledOn: p.cancelled_date,
//           partnerName: p.courier_name,
//           partnerCompany: p.courier_company_name,
//           partnerPhone: p.courier_mobile,

//           status: p.order_status,
//           isConfirmed,
//           isShipped,
//           isOutForDelivery,
//           isDelivered,
//           isCancelled,

//           product_details: {
//             name: p.product_name,
//             sku: p.sku,
//             status: p.status,
//             detail: p.product_name,
//             product_MRP: p.product_MRP,
//             moq: p.moq,
//             brand: p.product_brand,
//             material: p.product_material,
//             f_image: p.product_f_image,
//             image_2: p.image_2,
//             image_3: p.image_3,
//             image_4: p.image_4,
//             made_in: p.made_in,
//             specification: p.specification,
//             warranty: p.warranty,
//             cat_id: p.product_cat_id,
//             cat_sub_id: p.product_cat_sub_id
//           },

//           seller_details: {
//             seller_name: p.seller_name,
//             seller_phone: p.seller_phone
//           }
//         };
//       });

//       // ===== BUYER DETAILS STRUCTURE =====
//       order.buyer_details = {
//         buyer_id: order.buyer_id,
//         buyer_name: order.buyer_name,
//         buyer_email: order.buyer_email,
//         buyer_mobile: order.buyer_mobile,
//       };

//       // REMOVE FLAT BUYER FIELDS
//       delete order.buyer_id;
//       delete order.buyer_name;
//       delete order.buyer_email;
//       delete order.buyer_mobile;
//     }

//     res.status(200).json(orders);

//   } catch (err) {
//     console.error("Error fetching orders:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// };

// /*// date 7/2/26
// export const getAllOrderByBuyer = async (req, res) => {
//   try {
//     const pool = await connectDB();

//     const { buyer_id } = req.params;

//     //const [orders] = await pool.query(`SELECT * FROM orders WHERE buyer_id = ?`, [buyer_id]);
//   // const [orders] = await pool.query(`SELECT * FROM orders ORDER BY id DESC`);
//     const [orders] = await pool.query(`SELECT o.*, b.name AS buyer_name, b.email AS buyer_email, b.mobile AS buyer_mobile
//   FROM orders o
//   LEFT JOIN buyer b ON o.buyer_id = b.id WHERE o.buyer_id = ? ORDER BY id DESC`,[buyer_id]);

//     for (const order of orders) {
//   //   const [products] = await pool.query(`SELECT * FROM order_products WHERE order_id = ?`, [order.id]);
//      const [products] = await pool.query( `
//       SELECT
//         op.*,p.*,sh.*,

//         -- product details
//         p.name AS product_name,
//         p.brand AS product_brand,
//         p.material AS product_material,
//         p.f_image AS product_f_image,
//         p.cat_id AS product_cat_id,
//         p.cat_sub_id AS product_cat_sub_id,

//         -- seller details
//         s.name AS seller_name,
//         s.mobile AS seller_phone

//       FROM order_products op
//       LEFT JOIN product p ON op.product_id = p.id
//       LEFT JOIN seller s ON op.seller_id = s.id
//       LEFT JOIN shipping sh on sh.product_id = p.id AND sh.order_id = op.order_id
//       WHERE op.order_id = ?
//     `, [order.id]);

//     // ðŸ‘‰ FORMAT EXACT STRUCTURE YOU WANT
//       order.products = products.map((p) => {
//         // ---- STATUS LOGIC ----
//   const status = (p.order_status || "").toLowerCase();

//   const isConfirmed = ["confirmed", "shipped", "out for delivery", "delivered"].includes(status);
//   const isShipped = ["shipped", "out for delivery", "delivered"].includes(status);
//   const isOutForDelivery = ["out for delivery", "delivered"].includes(status);
//   const isDelivered = status === "delivered";
//   const isCancelled = status === "cancelled";

//   // ---- RETURN STRUCTURED PRODUCT ----
//   return {

//         id: p.id,
//         order_id: op.order_id,
//         product_id: p.id,
//         seller_id: p.seller_id,
//         quantity: op.quantity,
//         price: op.price,
//         order_status: op.order_status,
//         payment_status: op.payment_status,
//         trackingId:sh.tracking_number,
//         expectedDate:sh.estimated_delivery_date,
//         deliveredOn:sh.actual_delivery_date,
//         cancelledOn:sh.cancelled_date,
//         partnerName:sh.courier_name,
//         partnerCompany:sh.courier_company_name,
//         partnerPhone:sh.courier_mobile,

//         // ðŸ‘‰ Add new status fields
//         status: p.order_status,
//         isConfirmed,
//         isShipped,
//         isOutForDelivery,
//         isDelivered,
//         isCancelled,

//         product_details: {
//           name: p.product_name,
//           sku: p.sku,
//           status: p.status,
//           detail: p.product_name,
//           product_MRP:p.product_MRP,
//           moq: p.moq,
//           brand: p.product_brand,
//           material: p.product_material,
//           f_image: p.product_f_image,
//           image_2 : p.image_2,
//           image_3 :p.image_3,
//           image_4 : p.image_4,
//           made_in :p.made_in,
//           specification :p.specification,
//           warranty:p.warranty,
//           cat_id: p.product_cat_id,
//           cat_sub_id: p.product_cat_sub_id
//         },

//         seller_details: {
//           seller_name: s.seller_name,
//           seller_phone: s.seller_phone
//         }
//   }
//       });

//       // ðŸ”¥ ADD buyer_details & order_details STRUCTURE
//       order.buyer_details = {
//         buyer_id : order.buyer_id,
//         buyer_name: order.buyer_name,
//         buyer_email: order.buyer_email,
//         buyer_mobile: order.buyer_mobile,
//       };

//       // REMOVE FLAT BUYER FIELDS FROM ORDER
//       delete order.buyer_id;
//       delete order.buyer_name;
//       delete order.buyer_email;
//       delete order.buyer_mobile;

//     }
//     res.status(200).json(orders);
//   } catch (err) {
//     console.error("Error fetching orders:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// };

// */

// /*export const getAllOrderByBuyer = async (req, res) => {
//   try {
//     const pool = await connectDB();
//     const { buyer_id } = req.params;

//     const [orders] = await pool.query(`SELECT * FROM orders WHERE buyer_id = ?`, [buyer_id]);
//     if (orders.length === 0) return res.status(404).json({ message: "No orders found for this buyer" });

//     for (const order of orders) {
//       const [products] = await pool.query(`SELECT * FROM order_products WHERE order_id = ?`, [order.id]);
//       order.products = products;
//     }

//     res.status(200).json(orders);
//   } catch (err) {
//     console.error("Error fetching buyer orders:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// };*/

// // ======================= FILTER: BY SELLER ID ===========================
// export const getAllOrderBySeller = async (req, res) => {
//   try {
//     const pool = await connectDB();
//     const { seller_id } = req.params;

//     const [products] = await pool.query(`SELECT * FROM order_products WHERE seller_id = ?`, [seller_id]);
//     if (products.length === 0) return res.status(404).json({ message: "No orders found for this seller" });

//     // Fetch all orders those products belong to
//     const orderIds = [...new Set(products.map(p => p.order_id))];
//     const [orders] = await pool.query(`SELECT * FROM orders WHERE id IN (?)`, [orderIds]);

//     for (const order of orders) {
//       order.products = products.filter(p => p.order_id === order.id);
//     }

//     res.status(200).json(orders);
//   } catch (err) {
//     console.error("Error fetching seller orders:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// };

// // ======================= FILTER: INQUIRY ORDERS ===========================
// export const getAllOrderInquiry = async (req, res) => {
//   try {
//     const pool = await connectDB();

//     const [orders] = await pool.query(`SELECT * FROM orders WHERE order_type = 'Inquiry' ORDER BY id DESC`);
//     if (orders.length === 0) return res.status(404).json({ message: "No inquiries found" });

//     for (const order of orders) {
//       const [products] = await pool.query(`SELECT * FROM order_products WHERE order_id = ?`, [order.id]);
//       order.products = products;
//     }

//     res.status(200).json(orders);
//   } catch (err) {
//     console.error("Error fetching inquiries:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// };

// // ======================= FILTER: ORder type ORDERS ===========================
// export const getAllOrderOrdertype = async (req, res) => {
//   try {
//     const pool = await connectDB();

//     const [orders] = await pool.query(`SELECT * FROM orders WHERE order_type = 'Order' ORDER BY id DESC`);
//     if (orders.length === 0) return res.status(404).json({ message: "No inquiries found" });

//     for (const order of orders) {
//       const [products] = await pool.query(`SELECT * FROM order_products WHERE order_id = ?`, [order.id]);
//       order.products = products;
//     }

//     res.status(200).json(orders);
//   } catch (err) {
//     console.error("Error fetching inquiries:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// };

import { connectDB } from "../../connection/db.js";
import { sendOrderStatusNotification } from "../../utils/orderNotification.js";

// =====================================================================
//  SHARED HELPERS
// =====================================================================

/** Reusable product SELECT — explicit aliases, no wildcards */
// const PRODUCT_SELECT_SQL = `
//   SELECT
//     op.id              AS op_id,
//     op.order_id        AS op_order_id,
//     op.product_id      AS op_product_id,
//     op.seller_id       AS op_seller_id,
//     op.quantity        AS op_quantity,
//     op.price           AS op_price,
//     op.order_status    AS op_order_status,
//     op.payment_status  AS op_payment_status,

//     p.name             AS product_name,
//     p.sku,
//     p.status,
//     p.product_MRP,
//     p.moq,
//     p.brand            AS product_brand,
//     p.material         AS product_material,
//     p.f_image          AS product_f_image,
//     p.image_2,
//     p.image_3,
//     p.image_4,
//     p.made_in,
//     p.specification,
//     p.warranty,
//     p.cat_id           AS product_cat_id,
//     p.cat_sub_id       AS product_cat_sub_id,

//     s.name             AS seller_name,
//     s.mobile           AS seller_phone,

//     sh.tracking_number,
//     sh.estimated_delivery_date,
//     sh.actual_delivery_date,
//     sh.cancelled_date,
//     sh.courier_name,
//     sh.courier_company_name,
//     sh.courier_mobile

//   FROM order_products op
//   LEFT JOIN product  p  ON op.product_id = p.id
//   LEFT JOIN seller   s  ON op.seller_id  = s.id
//   LEFT JOIN shipping sh ON sh.product_id = p.id AND sh.order_id = op.order_id
//   WHERE op.order_id = ?
// `;

const PRODUCT_SELECT_SQL = `
  SELECT 
    op.id AS op_id,
    op.order_id AS op_order_id,
    op.product_id AS op_product_id,
    op.seller_id AS op_seller_id,
    op.quantity AS op_quantity,
    op.price AS op_price,
    op.order_status AS op_order_status,
    op.payment_status AS op_payment_status,

    -- Product details (FK)
    p.name AS product_name,
    p.sku,
    p.status,
    p.product_MRP,
    p.moq,
    p.gst,
    p.brand AS product_brand,
    p.material AS product_material,
    p.f_image AS product_f_image,
    p.image_2,
    p.image_3,
    p.image_4,
    p.made_in,
    p.specification,
    p.warranty,
    p.cat_id AS product_cat_id,
    p.cat_sub_id AS product_cat_sub_id,

    -- Seller details (FK)
    s.name AS seller_name,
    s.mobile AS seller_phone

  FROM order_products op

  LEFT JOIN product p 
    ON op.product_id = p.id   -- 🔥 FK USED HERE

  LEFT JOIN seller s 
    ON op.seller_id = s.id    -- 🔥 FK USED HERE

  WHERE op.order_id = ?
`;
/** Map a raw DB product row → clean response object */
const formatProduct = (p) => {
  const status = (p.op_order_status || "").toLowerCase();

  return {
    id: p.op_id,
    order_id: p.op_order_id,
    product_id: p.op_product_id,
    seller_id: p.op_seller_id,
    quantity: p.op_quantity,
    price: p.op_price,
    order_status: p.op_order_status,
    payment_status: p.op_payment_status,

    trackingId: p.tracking_number ?? null,
    expectedDate: p.estimated_delivery_date ?? null,
    deliveredOn: p.actual_delivery_date ?? null,
    cancelledOn: p.cancelled_date ?? null,
    partnerName: p.courier_name ?? null,
    partnerCompany: p.courier_company_name ?? null,
    partnerPhone: p.courier_mobile ?? null,

    status: p.op_order_status,
    isConfirmed: [
      "confirmed",
      "shipped",
      "out for delivery",
      "delivered",
    ].includes(status),
    isShipped: ["shipped", "out for delivery", "delivered"].includes(status),
    isOutForDelivery: ["out for delivery", "delivered"].includes(status),
    isDelivered: status === "delivered",
    isCancelled: status === "cancelled",

    product_details: {
      name: p.product_name ?? null,
      sku: p.sku ?? null,
      status: p.status ?? null,
      // detail: p.product_name ?? null,
      detail: p.detail ?? null,
      product_MRP: p.product_MRP ?? null,
      moq: p.moq ?? null,
      gst: p.gst ?? null,
      brand: p.product_brand ?? null,
      material: p.product_material ?? null,
      f_image: p.product_f_image ?? null,
      image_2: p.image_2 ?? null,
      image_3: p.image_3 ?? null,
      image_4: p.image_4 ?? null,
      made_in: p.made_in ?? null,
      specification: p.specification ?? null,
      warranty: p.warranty ?? null,
      cat_id: p.product_cat_id ?? null,
      cat_sub_id: p.product_cat_sub_id ?? null,
    },

    seller_details: {
      seller_name: p.seller_name ?? null,
      seller_phone: p.seller_phone ?? null,
    },
  };
};

/** Attach formatted products + buyer_details to each order row */
// const attachOrderDetails = async (pool, orders) => {
//   for (const order of orders) {
//     const [products] = await pool.query(PRODUCT_SELECT_SQL, [order.id]);
//     order.products = products.map(formatProduct);

//     order.buyer_details = {
//       buyer_id: order.buyer_id ?? null,
//       buyer_name: order.buyer_name ?? null,
//       buyer_email: order.buyer_email ?? null,
//       buyer_mobile: order.buyer_mobile ?? null,
//     };

//     delete order.buyer_id;
//     delete order.buyer_name;
//     delete order.buyer_email;
//     delete order.buyer_mobile;
//   }
//   return orders;
// };

const attachOrderDetails = async (pool, orders) => {
  for (const order of orders) {
    const [products] = await pool.query(PRODUCT_SELECT_SQL, [order.id]);

    let total_base_amount = 0;
    let total_gst_amount = 0;
    let total_final_amount = 0;

    const formattedProducts = products.map((p) => {
      const price = Number(p.op_price) || 0;
      const quantity = Number(p.op_quantity) || 0;
      const baseAmount = price * quantity;

      const gstPercent = Number(p.gst) || 0;
      const gstAmount = (baseAmount * gstPercent) / 100;
      const finalAmount = baseAmount + gstAmount;

      // ✅ accumulate totals
      total_base_amount += baseAmount;
      total_gst_amount += gstAmount;
      total_final_amount += finalAmount;

      return formatProduct(p); // keep your existing structure
    });

    order.products = formattedProducts;

    // ✅ ADD THESE FIELDS AT ORDER LEVEL
    order.total_base_amount = total_base_amount;
    order.total_gst_amount = total_gst_amount;
    order.total_final_amount = total_final_amount;

    order.buyer_details = {
      id: order.buyer_id ?? null,
      name: order.buyer_name ?? null,
      email: order.buyer_email ?? null,
      mobile: order.buyer_mobile ?? null,
      address: order.buyer_address ?? null,
    };

    delete order.buyer_id;
    delete order.buyer_name;
    delete order.buyer_email;
    delete order.buyer_mobile;
    delete order.buyer_address; // changed
  }

  return orders;
};

// =====================================================================
//  CREATE ORDER
// =====================================================================
// export const createOrder = async (req, res) => {
//   try {
//     const { buyer_id, order_type = "Order", products } = req.body;

//     // ── Top-level validation ───────────────────────────────────────
//     if (!buyer_id) {
//       return res.status(400).json({ message: "buyer_id is required" });
//     }
//     if (!Array.isArray(products) || products.length === 0) {
//       return res
//         .status(400)
//         .json({ message: "products must be a non-empty array" });
//     }

//     // ── Per-product validation ─────────────────────────────────────
//     const VALID_ORDER_STATUSES = [
//       "New",
//       "Processing",
//       "Confirmed",
//       "Shipped",
//       "Out for Delivery",
//       "Delivered",
//       "Cancelled",
//     ];
//     const VALID_PAYMENT_STATUSES = ["Pending", "Paid", "Failed", "Refunded"];

//     const productErrors = [];
//     products.forEach((p, index) => {
//       const errors = [];

//       if (!p.product_id) errors.push("product_id is required");
//       if (!p.seller_id) errors.push("seller_id is required");
//       if (p.price === undefined || p.price === null)
//         errors.push("price is required");
//       else if (isNaN(Number(p.price)) || Number(p.price) < 0)
//         errors.push("price must be a non-negative number");
//       if (
//         p.quantity !== undefined &&
//         (isNaN(Number(p.quantity)) || Number(p.quantity) < 1)
//       )
//         errors.push("quantity must be a positive number");
//       if (p.order_status && !VALID_ORDER_STATUSES.includes(p.order_status))
//         errors.push(
//           `order_status must be one of: ${VALID_ORDER_STATUSES.join(", ")}`,
//         );
//       if (
//         p.payment_status &&
//         !VALID_PAYMENT_STATUSES.includes(p.payment_status)
//       )
//         errors.push(
//           `payment_status must be one of: ${VALID_PAYMENT_STATUSES.join(", ")}`,
//         );

//       if (errors.length > 0)
//         productErrors.push({ index, product_id: p.product_id ?? null, errors });
//     });

//     if (productErrors.length > 0) {
//       return res
//         .status(400)
//         .json({ message: "Invalid product data", productErrors });
//     }

//     // ── DB insert ──────────────────────────────────────────────────
//     const pool = await connectDB();

//     const [orderResult] = await pool.query(
//       `INSERT INTO orders (buyer_id, order_type) VALUES (?, ?)`,
//       [buyer_id, order_type],
//     );
//     const orderId = orderResult.insertId;

//     for (const p of products) {
//       await pool.query(
//         `INSERT INTO order_products
//            (order_id, product_id, seller_id, quantity, price, order_status, payment_status)
//          VALUES (?, ?, ?, ?, ?, ?, ?)`,
//         [
//           orderId,
//           p.product_id,
//           p.seller_id,
//           Number(p.quantity) || 1,
//           Number(p.price),
//           p.order_status || "New",
//           p.payment_status || "Pending",
//         ],
//       );
//     }

//     return res
//       .status(201)
//       .json({ message: "Order created successfully", order_id: orderId });
//   } catch (err) {
//     console.error("Error creating order:", err);
//     return res
//       .status(500)
//       .json({ message: "Server error", error: err.message });
//   }
// };

export const createOrder = async (req, res) => {
  try {
    const {
      buyer_id,
      order_type = "Order",
      order_address,
      order_contact,
      products,
    } = req.body;

    // ── Top-level validation ───────────────────────────────────────
    if (!buyer_id) {
      return res.status(400).json({ message: "buyer_id is required" });
    }
    if (!Array.isArray(products) || products.length === 0) {
      return res
        .status(400)
        .json({ message: "products must be a non-empty array" });
    }

    // ── Per-product validation ─────────────────────────────────────
    const VALID_ORDER_STATUSES = [
      "New",
      "Processing",
      "Confirmed",
      "Shipped",
      "Out for Delivery",
      "Delivered",
      "Cancelled",
    ];
    const VALID_PAYMENT_STATUSES = ["Pending", "Paid", "Failed", "Refunded"];

    const productErrors = [];
    products.forEach((p, index) => {
      const errors = [];

      if (!p.product_id) errors.push("product_id is required");
      if (!p.seller_id) errors.push("seller_id is required");
      if (p.price === undefined || p.price === null)
        errors.push("price is required");
      else if (isNaN(Number(p.price)) || Number(p.price) < 0)
        errors.push("price must be a non-negative number");
      if (
        p.quantity !== undefined &&
        (isNaN(Number(p.quantity)) || Number(p.quantity) < 1)
      )
        errors.push("quantity must be a positive number");
      if (p.order_status && !VALID_ORDER_STATUSES.includes(p.order_status))
        errors.push(
          `order_status must be one of: ${VALID_ORDER_STATUSES.join(", ")}`,
        );
      if (
        p.payment_status &&
        !VALID_PAYMENT_STATUSES.includes(p.payment_status)
      )
        errors.push(
          `payment_status must be one of: ${VALID_PAYMENT_STATUSES.join(", ")}`,
        );

      if (errors.length > 0)
        productErrors.push({ index, product_id: p.product_id ?? null, errors });
    });

    if (productErrors.length > 0) {
      return res
        .status(400)
        .json({ message: "Invalid product data", productErrors });
    }

    // ── DB insert ──────────────────────────────────────────────────
    const pool = await connectDB();

    const [orderResult] = await pool.query(
      `INSERT INTO orders (buyer_id, order_type, order_address, order_contact) VALUES (?, ?, ?, ?)`,
      [buyer_id, order_type, order_address, order_contact],
    );
    const orderId = orderResult.insertId;
    console.log("orderId====>>>>", orderId);
    await sendOrderStatusNotification(buyer_id, orderId, "New");

    // for (const p of products) {
    //   await pool.query(
    //     `INSERT INTO order_products
    //        (order_id, product_id, seller_id, quantity, price, order_status, payment_status)
    //      VALUES (?, ?, ?, ?, ?, ?, ?)`,
    //     [
    //       orderId,
    //       p.product_id,
    //       p.seller_id,
    //       Number(p.quantity) || 1,
    //       Number(p.price),
    //       p.order_status || "New",
    //       p.payment_status || "Pending",
    //     ],
    //   );
    // }

    for (const p of products) {
      const orderQty = Number(p.quantity) || 1;

      // ✅ Check current stock
      const [productRows] = await pool.query(
        `SELECT quantity FROM product WHERE id = ?`,
        [p.product_id],
      );

      if (productRows.length === 0) {
        return res.status(404).json({
          message: `Product not found`,
          product_id: p.product_id,
        });
      }

      const currentStock = Number(productRows[0].quantity) || 0;

      // ✅ Prevent over-ordering
      if (orderQty > currentStock) {
        return res.status(400).json({
          message: `Only ${currentStock} quantity available`,
          product_id: p.product_id,
        });
      }

      // ✅ Insert order product
      await pool.query(
        `INSERT INTO order_products
       (order_id, product_id, seller_id, quantity, price, order_status, payment_status)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          orderId,
          p.product_id,
          p.seller_id,
          orderQty,
          Number(p.price),
          p.order_status || "New",
          p.payment_status || "Pending",
        ],
      );

      // ✅ Reduce product stock
      await pool.query(
        `UPDATE product
     SET quantity = quantity - ?
     WHERE id = ?`,
        [orderQty, p.product_id],
      );
    }
    return res
      .status(201)
      .json({ message: "Order created successfully", order_id: orderId });
  } catch (err) {
    console.error("Error creating order:", err);
    return res
      .status(500)
      .json({ message: "Server error", error: err.message });
  }
};

// import admin from "../utils/firebase.js"; // adjust path as needed

import admin from "../../utils/firebase.js";

export const testPushNotification = async (req, res) => {
  try {
    const { token, title, body, data = {} } = req.body;

    if (!token || !title || !body) {
      return res.status(400).json({
        success: false,
        message: "token, title, and body are required",
      });
    }

    const message = {
      token,
      notification: { title, body },
      data: Object.fromEntries(
        Object.entries(data).map(([k, v]) => [k, String(v)]),
      ),
    };

    const response = await admin.messaging().send(message);

    return res.status(200).json({
      success: true,
      message: "Push notification sent successfully",
      fcm_response: response,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =====================================================================
//  UPDATE ORDER
// =====================================================================
// export const updateOrder = async (req, res) => {
//   try {
//     const pool = await connectDB();
//     const { id } = req.params;
//     const { buyer_id, order_type, products } = req.body;

//     if (!id) return res.status(400).json({ message: "Order id is required" });

//     // Check order exists
//     const [existing] = await pool.query(`SELECT id FROM orders WHERE id = ?`, [
//       id,
//     ]);
//     if (existing.length === 0)
//       return res.status(404).json({ message: "Order not found" });

//     await pool.query(
//       `UPDATE orders SET buyer_id = ?, order_type = ?, updated_at = NOW() WHERE id = ?`,
//       [buyer_id, order_type, id],
//     );

//     if (Array.isArray(products) && products.length > 0) {
//       await pool.query(`DELETE FROM order_products WHERE order_id = ?`, [id]);

//       for (const p of products) {
//         await pool.query(
//           `INSERT INTO order_products
//              (order_id, product_id, seller_id, quantity, price, order_status, payment_status)
//            VALUES (?, ?, ?, ?, ?, ?, ?)`,
//           [
//             id,
//             p.product_id,
//             p.seller_id,
//             Number(p.quantity) || 1,
//             Number(p.price),
//             p.order_status || "New",
//             p.payment_status || "Pending",
//           ],
//         );
//       }
//     }

//     return res.status(200).json({ message: "Order updated successfully" });
//   } catch (err) {
//     console.error("Error updating order:", err);
//     return res
//       .status(500)
//       .json({ message: "Server error", error: err.message });
//   }
// };

// export const updateOrder = async (req, res) => {
//   try {
//     const pool = await connectDB();
//     const { id } = req.params;
//     const { buyer_id, order_type, order_address, order_contact, products } =
//       req.body;

//     if (!id) return res.status(400).json({ message: "Order id is required" });

//     // Check order exists
//     const [existing] = await pool.query(`SELECT id FROM orders WHERE id = ?`, [
//       id,
//     ]);
//     if (existing.length === 0)
//       return res.status(404).json({ message: "Order not found" });

//     await pool.query(
//       `UPDATE orders SET buyer_id = ?, order_type = ?, order_address = ?, order_contact = ?, updated_at = NOW() WHERE id = ?`,
//       [buyer_id, order_type, order_address, order_contact, id],
//     );

//     if (Array.isArray(products) && products.length > 0) {
//       await pool.query(`DELETE FROM order_products WHERE order_id = ?`, [id]);

//       for (const p of products) {
//         await pool.query(
//           `INSERT INTO order_products
//              (order_id, product_id, seller_id, quantity, price, order_status, payment_status)
//            VALUES (?, ?, ?, ?, ?, ?, ?)`,
//           [
//             id,
//             p.product_id,
//             p.seller_id,
//             Number(p.quantity) || 1,
//             Number(p.price),
//             p.order_status || "New",
//             p.payment_status || "Pending",
//           ],
//         );
//       }
//     }

//     return res.status(200).json({ message: "Order updated successfully" });
//   } catch (err) {
//     console.error("Error updating order:", err);
//     return res
//       .status(500)
//       .json({ message: "Server error", error: err.message });
//   }
// };

export const updateOrder = async (req, res) => {
  try {
    const pool = await connectDB();
    const { id } = req.params;
    const { buyer_id, order_type, order_address, order_contact, products } =
      req.body;

    if (!id) return res.status(400).json({ message: "Order id is required" });

    // Check order exists
    const [existing] = await pool.query(`SELECT id FROM orders WHERE id = ?`, [
      id,
    ]);
    if (existing.length === 0)
      return res.status(404).json({ message: "Order not found" });

    await pool.query(
      `UPDATE orders SET buyer_id = ?, order_type = ?, order_address = ?, order_contact = ?, updated_at = NOW() WHERE id = ?`,
      [buyer_id, order_type, order_address, order_contact, id],
    );

    if (order_type) {
      await sendOrderStatusNotification(buyer_id, id, order_type);
    }

    if (Array.isArray(products) && products.length > 0) {
      await pool.query(`DELETE FROM order_products WHERE order_id = ?`, [id]);

      for (const p of products) {
        await pool.query(
          `INSERT INTO order_products
             (order_id, product_id, seller_id, quantity, price, order_status, payment_status)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            id,
            p.product_id,
            p.seller_id,
            Number(p.quantity) || 1,
            Number(p.price),
            p.order_status || "New",
            p.payment_status || "Pending",
          ],
        );
      }
    }

    return res.status(200).json({ message: "Order updated successfully" });
  } catch (err) {
    console.error("Error updating order:", err);
    return res
      .status(500)
      .json({ message: "Server error", error: err.message });
  }
};

// =====================================================================
//  UPDATE ORDER PRODUCT STATUS
// =====================================================================
// export const updateOrderProductStatus = async (req, res) => {
//   try {
//     const pool = await connectDB();
//     const { order_product_id } = req.params;
//     const { order_status } = req.body;

//     if (!order_product_id)
//       return res.status(400).json({ message: "order_product_id is required" });
//     if (!order_status)
//       return res.status(400).json({ message: "order_status is required" });

//     const VALID_ORDER_STATUSES = [
//       "New",
//       "Processing",
//       "Confirmed",
//       "Shipped",
//       "Out for Delivery",
//       "Delivered",
//       "Cancelled",
//     ];
//     if (!VALID_ORDER_STATUSES.includes(order_status)) {
//       return res
//         .status(400)
//         .json({
//           message: `order_status must be one of: ${VALID_ORDER_STATUSES.join(", ")}`,
//         });
//     }

//     const [existing] = await pool.query(
//       `SELECT id FROM order_products WHERE id = ?`,
//       [order_product_id],
//     );
//     if (existing.length === 0)
//       return res.status(404).json({ message: "Order product not found" });

//     await pool.query(
//       `UPDATE order_products SET order_status = ? WHERE id = ?`,
//       [order_status, order_product_id],
//     );

//     return res
//       .status(200)
//       .json({ message: "Order product status updated successfully" });
//   } catch (err) {
//     console.error("Error updating order product status:", err);
//     return res
//       .status(500)
//       .json({ message: "Server error", error: err.message });
//   }
// };

export const updateOrderProductStatus = async (req, res) => {
  let conn;
  try {
    const pool = await connectDB();
    conn = await pool.getConnection();
    await conn.beginTransaction();

    const { order_product_id } = req.params;
    const { order_status } = req.body;

    if (!order_product_id) {
      await conn.rollback();
      return res.status(400).json({ message: "order_product_id is required" });
    }
    if (!order_status) {
      await conn.rollback();
      return res.status(400).json({ message: "order_status is required" });
    }

    const VALID_ORDER_STATUSES = [
      "New",
      "Processing",
      "Confirmed",
      "Shipped",
      "Out for Delivery",
      "Delivered",
      "Cancelled",
      "Returned",
    ];
    if (!VALID_ORDER_STATUSES.includes(order_status)) {
      await conn.rollback();
      return res.status(400).json({
        message: `order_status must be one of: ${VALID_ORDER_STATUSES.join(", ")}`,
      });
    }

    // Fetch current order_product with all required fields
    const [[existing]] = await conn.query(
      `SELECT op.id, op.order_status, op.quantity, op.product_id, op.seller_id, op.order_id
       FROM order_products op
       WHERE op.id = ?`,
      [order_product_id],
    );

    if (!existing) {
      await conn.rollback();
      return res.status(404).json({ message: "Order product not found" });
    }

    const wasConfirmed = existing.order_status?.toLowerCase() === "confirmed";
    const isNowConfirmed = order_status?.toLowerCase() === "confirmed";
    const isCancelled = order_status?.toLowerCase() === "cancelled";
    const orderedQty = Number(existing.quantity);

    // Update order_products status
    await conn.query(
      `UPDATE order_products SET order_status = ? WHERE id = ?`,
      [order_status, order_product_id],
    );

    // ── Case 1: Newly confirmed → deduct stock ──────────────
    if (isNowConfirmed && !wasConfirmed) {
      const [[prod]] = await conn.query(
        `SELECT quantity, seller_id FROM product WHERE id = ? FOR UPDATE`,
        [existing.product_id],
      );
      if (prod) {
        const quantityBefore = Number(prod.quantity);
        const quantityAfter = Math.max(0, quantityBefore - orderedQty);

        await conn.query(`UPDATE product SET quantity = ? WHERE id = ?`, [
          quantityAfter,
          existing.product_id,
        ]);
        await conn.query(
          `INSERT INTO product_inventory
             (product_id, seller_id, change_type, quantity_change,
              quantity_before, quantity_after, order_type, order_id, note)
           VALUES (?, ?, 'deduct', ?, ?, ?, 'order', ?, 'Order confirmed - stock deducted')`,
          [
            existing.product_id,
            prod.seller_id,
            orderedQty,
            quantityBefore,
            quantityAfter,
            existing.order_id,
          ],
        );
      }
    }

    // ── Case 2: Was confirmed, now cancelled → restore stock ─
    if (isCancelled && wasConfirmed) {
      const [[prod]] = await conn.query(
        `SELECT quantity, seller_id FROM product WHERE id = ? FOR UPDATE`,
        [existing.product_id],
      );
      if (prod) {
        const quantityBefore = Number(prod.quantity);
        const quantityAfter = quantityBefore + orderedQty;

        await conn.query(`UPDATE product SET quantity = ? WHERE id = ?`, [
          quantityAfter,
          existing.product_id,
        ]);
        await conn.query(
          `INSERT INTO product_inventory
             (product_id, seller_id, change_type, quantity_change,
              quantity_before, quantity_after, order_type, order_id, note)
           VALUES (?, ?, 'add', ?, ?, ?, 'order', ?, 'Order cancelled - stock restored')`,
          [
            existing.product_id,
            prod.seller_id,
            orderedQty,
            quantityBefore,
            quantityAfter,
            existing.order_id,
          ],
        );
      }
    }

    await conn.commit();
    return res
      .status(200)
      .json({ message: "Order product status updated successfully" });
  } catch (err) {
    if (conn) await conn.rollback();
    console.error("Error updating order product status:", err);
    return res
      .status(500)
      .json({ message: "Server error", error: err.message });
  } finally {
    if (conn) conn.release();
  }
};

// =====================================================================
//  GET ALL ORDERS
// =====================================================================
export const getAllOrder = async (req, res) => {
  try {
    const pool = await connectDB();

    const [orders] = await pool.query(`
      SELECT o.id, o.order_type, o.created_at, o.updated_at,
             o.buyer_id,
             b.name  AS buyer_name,
             b.email AS buyer_email,
             b.mobile AS buyer_mobile,
             b.address AS buyer_address,
              o.order_address,
              o.order_contact
      FROM orders o
      LEFT JOIN buyer b ON o.buyer_id = b.id
      ORDER BY o.id DESC
    `);

    await attachOrderDetails(pool, orders);
    return res.status(200).json(orders);
  } catch (err) {
    console.error("Error fetching orders:", err);
    return res
      .status(500)
      .json({ message: "Server error", error: err.message });
  }
};

// =====================================================================
//  GET ORDER BY ID
// =====================================================================
export const getDataById = async (req, res) => {
  try {
    const pool = await connectDB();
    const { id } = req.params;

    if (!id) return res.status(400).json({ message: "Order id is required" });

    const [orders] = await pool.query(
      `
      SELECT o.id, o.order_type, o.created_at, o.updated_at,
             o.buyer_id,
             b.name  AS buyer_name,
             b.email AS buyer_email,
             b.mobile AS buyer_mobile,
                 o.order_address,
              o.order_contact
      FROM orders o
      LEFT JOIN buyer b ON o.buyer_id = b.id
      WHERE o.id = ?
    `,
      [id],
    );

    if (orders.length === 0)
      return res.status(404).json({ message: "Order not found" });

    // await attachOrderDetails(pool, orders);
    await attachOrderDetails(pool, orders);

    // ─── TEMP: inject dummy shipping_details where null (remove after testing) ───
    if (orders[0]?.products) {
      const dummyShipping = {
        courier_name: "Blue Dart",
        courier_company: "Blue Dart Express Ltd.",
        tracking_id: "BD123456789IN",
        tracking_url: "https://www.bluedart.com/tracking/BD123456789IN",
        dispatch_date: "2026-05-14T10:30:00.000Z",
        expected_delivery_date: "2026-05-17T18:00:00.000Z",
        weight_kg: 2.5,
        origin: {
          name: "Mamta Warehouse",
          address: "Plot No. 12, GIDC Industrial Area",
          city: "Rajkot",
          state: "Gujarat",
          pincode: "360002",
          phone: "7867877867",
        },
        destination: {
          name: "Jay",
          address: "rajkot.",
          city: "Rajkot",
          state: "Gujarat",
          pincode: "360001",
          phone: "9313096952",
        },
        status_timeline: [
          { status: "Order Picked Up", timestamp: "2026-05-14T10:30:00.000Z" },
          {
            status: "In Transit - Rajkot",
            timestamp: "2026-05-14T15:00:00.000Z",
          },
          { status: "Out for Delivery", timestamp: "2026-05-15T09:00:00.000Z" },
        ],
      };

      orders[0].products = orders[0].products.map((p) => ({
        ...p,
        shipping_details: p.shipping_details ?? dummyShipping,
      }));
    }
    // ─────────────────────────────────────────────────────────────────────────────

    return res.status(200).json(orders[0]);

    // return res.status(200).json(orders[0]);
  } catch (err) {
    console.error("Error fetching order:", err);
    return res
      .status(500)
      .json({ message: "Server error", error: err.message });
  }
};

import PDFDocument from "pdfkit";

export const generateOrderInvoice = async (req, res) => {
  try {
    const pool = await connectDB();
    const { orderId } = req.params;

    // Fetch order
    const [[order]] = await pool.query(
      `
      SELECT o.id, o.order_type, o.created_at, o.updated_at,
             o.order_address, o.order_contact, o.buyer_id,
             b.name AS buyer_name, b.email AS buyer_email,
             b.mobile AS buyer_mobile, b.address AS buyer_address
      FROM orders o
      LEFT JOIN buyer b ON o.buyer_id = b.id
      WHERE o.id = ?
    `,
      [orderId],
    );

    if (!order) return res.status(404).json({ message: "Order not found" });

    // Fetch products
    const [products] = await pool.query(
      `
      SELECT op.quantity, op.price, op.order_status, op.payment_status,
             p.name, p.sku, p.brand, p.gst, p.product_MRP,
             s.name AS seller_name, s.mobile AS seller_phone
      FROM order_products op
      LEFT JOIN product p ON op.product_id = p.id
      LEFT JOIN seller s ON op.seller_id = s.id
      WHERE op.order_id = ?
    `,
      [orderId],
    );

    if (!products || products.length === 0) {
      return res.status(404).json({ message: "No products found in order" });
    }

    // Calculate totals
    let totalBase = 0,
      totalGST = 0;
    products.forEach((p) => {
      const qty = parseFloat(p.quantity || 0);
      const price = parseFloat(p.price || 0);
      const lineTotal = qty * price;
      const gstAmt = lineTotal * (parseFloat(p.gst || 0) / 100);
      totalBase += lineTotal;
      totalGST += gstAmt;
    });
    const totalFinal = totalBase + totalGST;

    const doc = new PDFDocument({ margin: 40, size: "A4" });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="invoice-order-${orderId}.pdf"`,
    );
    doc.pipe(res);

    const W = 515;
    let y = 40;

    // ==================== HEADER ====================
    // doc.fontSize(22).fillColor("#1a3c6e").text("KEVELION", 40, y);
    const sellerNames = [
      ...new Set(products.map((p) => p.seller_name).filter(Boolean)),
    ].join(", ");
    doc
      .fontSize(22)
      .fillColor("#1a3c6e")
      .text(`${sellerNames ? `${sellerNames}` : ""}`, 40, y);
    y += 26;
    doc.fontSize(9).fillColor("#888").text("B2B E-Commerce Platform", 40, y);

    const sellerPhones = [
      ...new Set(products.map((p) => p.seller_phone).filter(Boolean)),
    ].join(", ");

    y += 12;
    // doc
    //   .fontSize(8)
    //   .fillColor("#444")
    //   .text(`Seller Name: ${sellerNames}`, 40, y);
    // y += 10;
    doc.fontSize(8).fillColor("#444").text(`Contact: ${sellerPhones}`, 40, y);

    doc
      .fontSize(9)
      .fillColor("#555")
      .text("Tax Invoice / Bill of Supply", 400, y - 8, {
        align: "right",
        width: 155,
      });

    y += 18;
    doc
      .moveTo(40, y)
      .lineTo(555, y)
      .lineWidth(2)
      .strokeColor("#1a3c6e")
      .stroke();
    y += 18;

    // ==================== META ====================
    const invDate = new Date(order.created_at).toLocaleDateString("en-IN");
    doc.rect(40, y, W, 36).fillColor("#f0f4fa").fill();

    doc.fontSize(7).fillColor("#666");
    ["INVOICE NO", "ORDER ID", "DATE", "ITEMS"].forEach((txt, i) => {
      doc.text(txt, 50 + i * 120, y + 6);
    });

    doc.fontSize(10).fillColor("#1a3c6e").font("Helvetica-Bold");
    doc.text(`INV-${String(order.id).padStart(5, "0")}`, 50, y + 16);
    doc.text(`#${order.id}`, 170, y + 16);
    doc.text(invDate, 290, y + 16);
    doc.text(`${products.length}`, 430, y + 16);
    doc.font("Helvetica");

    y += 52;

    // ==================== ADDRESS BOXES ====================
    const boxHeight = 85;
    const drawBox = (x, bw, title, lines) => {
      doc
        .rect(x, y, bw, boxHeight)
        .strokeColor("#d0daea")
        .lineWidth(1)
        .stroke();
      doc
        .fontSize(7)
        .fillColor("#1a3c6e")
        .font("Helvetica-Bold")
        .text(title, x + 8, y + 6);

      doc
        .moveTo(x, y + 16)
        .lineTo(x + bw, y + 16)
        .strokeColor("#d0daea")
        .stroke();

      doc.font("Helvetica").fontSize(9).fillColor("#111");
      lines.forEach((line, i) => {
        if (line) {
          doc.text(line, x + 8, y + 23 + i * 12, {
            width: bw - 16,
            ellipsis: true,
          });
        }
      });
    };

    drawBox(40, 200, "BILL TO / BUYER", [
      order.buyer_name,
      order.buyer_email,
      order.buyer_mobile,
      order.buyer_address,
    ]);

    drawBox(248, 180, "SHIP TO", [
      order.buyer_name,
      order.order_address || order.buyer_address,
      order.order_contact ? `Contact: ${order.order_contact}` : "",
    ]);

    drawBox(436, 119, "PAYMENT", ["Total:", `Rs. ${totalFinal.toFixed(2)}`]);

    y += boxHeight + 25;

    // ==================== PRODUCTS TABLE ====================
    // ==================== PRODUCTS TABLE ====================
    const rowH = 48; // Increased for better wrapping
    const tableY = y;

    // Header
    doc.rect(40, y, W, 20).fillColor("#1a3c6e").fill();
    doc.fontSize(8).fillColor("#fff").font("Helvetica-Bold");

    const columns = [
      { txt: "#", x: 46, w: 20, align: "left" },
      { txt: "PRODUCT", x: 68, w: 162, align: "left" },
      { txt: "QTY", x: 235, w: 38, align: "center" },
      { txt: "PRICE", x: 275, w: 58, align: "right" },
      { txt: "GST%", x: 335, w: 38, align: "center" },
      { txt: "GST AMT", x: 375, w: 58, align: "right" },
      { txt: "TOTAL", x: 435, w: 62, align: "right" },
      { txt: "STATUS", x: 500, w: 55, align: "left" },
    ];

    columns.forEach((col) => {
      doc.text(col.txt, col.x, y + 6, { width: col.w, align: col.align });
    });

    y += 20;

    // Table Rows
    products.forEach((p, i) => {
      const qty = parseFloat(p.quantity || 0);
      const price = parseFloat(p.price || 0);
      const lineTotal = qty * price;
      const gstAmt = lineTotal * (parseFloat(p.gst || 0) / 100);

      // New page check
      if (y + rowH > 740) {
        doc.addPage();
        y = 60;
      }

      // Background & Border
      if (i % 2 === 0) doc.rect(40, y, W, rowH).fillColor("#f8fafd").fill();
      doc.rect(40, y, W, rowH).strokeColor("#dde6f0").lineWidth(0.5).stroke();

      // Row Content
      doc.fontSize(8).fillColor("#111").font("Helvetica-Bold");
      doc.text(`${i + 1}`, 46, y + 9, { width: 20 });

      // Product Name (multi-line support)
      doc.text(p.name || "N/A", 68, y + 7, {
        width: 160,
        ellipsis: true,
        lineGap: 1,
      });

      // doc
      //   .font("Helvetica")
      //   .fontSize(7)
      //   .fillColor("#555")
      //   .text(p.seller_name || "-", 68, y + 23, { width: 160, ellipsis: true });

      // Other columns
      doc.fontSize(8).fillColor("#111");
      doc.text(qty.toString(), 235, y + 13, { width: 38, align: "center" });
      doc.text(`Rs.${price.toFixed(2)}`, 275, y + 13, {
        width: 58,
        align: "right",
      });
      doc.text(`${parseFloat(p.gst || 0).toFixed(0)}%`, 335, y + 13, {
        width: 38,
        align: "center",
      });
      doc.text(`Rs.${gstAmt.toFixed(2)}`, 375, y + 13, {
        width: 58,
        align: "right",
      });
      doc.text(`Rs.${(lineTotal + gstAmt).toFixed(2)}`, 435, y + 13, {
        width: 62,
        align: "right",
      });

      // Status
      const statusColors = {
        Delivered: "#155724",
        Shipped: "#004085",
        Confirmed: "#0c5460",
        Cancelled: "#721c24",
        New: "#856404",
      };
      doc
        .fontSize(7.5)
        .fillColor(statusColors[p.order_status] || "#333")
        .text(p.order_status || "New", 500, y + 14, { width: 55 });

      y += rowH;
    });
    // ==================== TOTALS ====================
    y += 15;
    const totalsX = 340;

    const drawTotalRow = (label, value, highlight = false) => {
      if (y > 720) {
        doc.addPage();
        y = 80;
      }
      const h = highlight ? 26 : 22;
      if (highlight) doc.rect(totalsX, y, 215, h).fillColor("#1a3c6e").fill();

      doc
        .fontSize(9)
        .font("Helvetica-Bold")
        .fillColor(highlight ? "#fff" : "#555")
        .text(label, totalsX + 8, y + 7, { width: 110 });

      doc
        .fillColor(highlight ? "#fff" : "#111")
        .text(value, totalsX + 125, y + 7, { width: 85, align: "right" });

      if (!highlight) {
        doc
          .moveTo(totalsX, y + h)
          .lineTo(totalsX + 215, y + h)
          .strokeColor("#e0e8f0")
          .stroke();
      }
      y += h + 4;
    };

    drawTotalRow("Subtotal (excl. GST)", `Rs. ${totalBase.toFixed(2)}`);
    drawTotalRow("Total GST", `Rs. ${totalGST.toFixed(2)}`);
    drawTotalRow("GRAND TOTAL", `Rs. ${totalFinal.toFixed(2)}`, true);

    // ==================== FOOTER ====================
    if (y > 680) doc.addPage();
    y = 760;

    doc
      .moveTo(40, y)
      .lineTo(555, y)
      .lineWidth(1.5)
      .strokeColor("#1a3c6e")
      .stroke();

    doc
      .fontSize(7.5)
      .fillColor("#666")
      .text("* Computer-generated invoice. All amounts in INR.", 40, y + 8)
      .text("* For queries contact: kevelion.com", 40, y + 19);

    doc
      .fontSize(8)
      .fillColor("#333")
      .font("Helvetica-Bold")
      .text("Authorized Signatory", 430, y + 16, {
        width: 125,
        align: "right",
      });

    doc.end();
  } catch (err) {
    console.error("Invoice error:", err);
    return res.status(500).json({ message: err.message });
  }
};

// =====================================================================
//  GET ALL ORDERS BY BUYER
// =====================================================================
export const getAllOrderByBuyer = async (req, res) => {
  try {
    const pool = await connectDB();
    const { buyer_id } = req.params;

    if (!buyer_id)
      return res.status(400).json({ message: "buyer_id is required" });

    const [orders] = await pool.query(
      `
      SELECT o.id, o.order_type, o.created_at, o.updated_at,
             o.buyer_id,
             b.name  AS buyer_name,
             b.email AS buyer_email,
             b.mobile AS buyer_mobile,
               o.order_address,
              o.order_contact
      FROM orders o
      LEFT JOIN buyer b ON o.buyer_id = b.id
      WHERE o.buyer_id = ?
      ORDER BY o.id DESC
    `,
      [buyer_id],
    );

    if (orders.length === 0)
      return res
        .status(404)
        .json({ message: "No orders found for this buyer" });

    await attachOrderDetails(pool, orders);
    return res.status(200).json(orders);
  } catch (err) {
    console.error("Error fetching buyer orders:", err);
    return res
      .status(500)
      .json({ message: "Server error", error: err.message });
  }
};

// =====================================================================
//  GET ALL ORDERS BY SELLER
// =====================================================================
export const getAllOrderBySeller = async (req, res) => {
  try {
    const pool = await connectDB();
    const { seller_id } = req.params;

    if (!seller_id)
      return res.status(400).json({ message: "seller_id is required" });

    const [opRows] = await pool.query(
      `SELECT DISTINCT order_id FROM order_products WHERE seller_id = ?`,
      [seller_id],
    );

    if (opRows.length === 0)
      return res
        .status(404)
        .json({ message: "No orders found for this seller" });

    const orderIds = opRows.map((r) => r.order_id);

    const [orders] = await pool.query(
      `
      SELECT o.id, o.order_type, o.created_at, o.updated_at,
             o.buyer_id,
             b.name  AS buyer_name,
             b.email AS buyer_email,
             b.mobile AS buyer_mobile
      FROM orders o
      LEFT JOIN buyer b ON o.buyer_id = b.id
      WHERE o.id IN (?)
      ORDER BY o.id DESC
    `,
      [orderIds],
    );

    await attachOrderDetails(pool, orders);
    return res.status(200).json(orders);
  } catch (err) {
    console.error("Error fetching seller orders:", err);
    return res
      .status(500)
      .json({ message: "Server error", error: err.message });
  }
};

// =====================================================================
//  GET ALL INQUIRY ORDERS
// =====================================================================
export const getAllOrderInquiry = async (req, res) => {
  try {
    const pool = await connectDB();

    const [orders] = await pool.query(`
      SELECT o.id, o.order_type, o.created_at, o.updated_at,
             o.buyer_id,
             b.name  AS buyer_name,
             b.email AS buyer_email,
             b.mobile AS buyer_mobile
      FROM orders o
      LEFT JOIN buyer b ON o.buyer_id = b.id
      WHERE o.order_type = 'Inquiry'
      ORDER BY o.id DESC
    `);

    if (orders.length === 0)
      return res.status(404).json({ message: "No inquiries found" });

    await attachOrderDetails(pool, orders);
    return res.status(200).json(orders);
  } catch (err) {
    console.error("Error fetching inquiries:", err);
    return res
      .status(500)
      .json({ message: "Server error", error: err.message });
  }
};

// =====================================================================
//  GET ALL ORDERS BY ORDER TYPE
// =====================================================================
export const getAllOrderOrdertype = async (req, res) => {
  try {
    const pool = await connectDB();

    const [orders] = await pool.query(`
      SELECT o.id, o.order_type, o.created_at, o.updated_at,
             o.buyer_id,
             b.name  AS buyer_name,
             b.email AS buyer_email,
             b.mobile AS buyer_mobile
      FROM orders o
      LEFT JOIN buyer b ON o.buyer_id = b.id
      WHERE o.order_type = 'Order'
      ORDER BY o.id DESC
    `);

    if (orders.length === 0)
      return res.status(404).json({ message: "No orders found" });

    await attachOrderDetails(pool, orders);
    return res.status(200).json(orders);
  } catch (err) {
    console.error("Error fetching orders by type:", err);
    return res
      .status(500)
      .json({ message: "Server error", error: err.message });
  }
};

// =====================================================================
//  DELETE ORDER
// =====================================================================
export const deleteOrder = async (req, res) => {
  try {
    const pool = await connectDB();
    const { id } = req.params;

    if (!id) return res.status(400).json({ message: "Order id is required" });

    const [existing] = await pool.query(`SELECT id FROM orders WHERE id = ?`, [
      id,
    ]);
    if (existing.length === 0)
      return res.status(404).json({ message: "Order not found" });

    await pool.query(`DELETE FROM order_products WHERE order_id = ?`, [id]);
    await pool.query(`DELETE FROM orders WHERE id = ?`, [id]);

    return res.status(200).json({ message: "Order deleted successfully" });
  } catch (err) {
    console.error("Error deleting order:", err);
    return res
      .status(500)
      .json({ message: "Server error", error: err.message });
  }
};
