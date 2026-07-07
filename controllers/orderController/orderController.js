import { connectDB } from "../../connection/db.js";
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

// import { connectDB } from "../../connection/db.js";
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
    const shipmentCost = Number(order.shipment_cost) || 0;

    order.total_base_amount = total_base_amount;
    order.total_gst_amount = total_gst_amount;
    order.total_final_amount = total_final_amount + shipmentCost;

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
    delete order.buyer_address;

    // Keep shipment_cost in response
    order.shipment_cost = Number(order.shipment_cost) || 0;
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
      shipment_cost = 0,
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
      `INSERT INTO orders (buyer_id, order_type, order_address, order_contact, shipment_cost) VALUES (?, ?, ?, ?, ?)`,
      [
        buyer_id,
        order_type,
        order_address,
        order_contact,
        Number(shipment_cost),
      ],
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
              o.order_contact,
              o.shipment_cost
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
             b.address AS buyer_address,
             o.order_address,
             o.order_contact,
             o.shipment_cost                  
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

// import PDFDocument from "pdfkit";

// export const generateOrderInvoice = async (req, res) => {
//   try {
//     const pool = await connectDB();
//     const { orderId } = req.params;

//     // Fetch order
//     const [[order]] = await pool.query(
//       `
//       SELECT o.id, o.order_type, o.created_at, o.updated_at,
//              o.order_address, o.order_contact, o.buyer_id,
//              b.name AS buyer_name, b.email AS buyer_email,
//              b.mobile AS buyer_mobile, b.address AS buyer_address
//       FROM orders o
//       LEFT JOIN buyer b ON o.buyer_id = b.id
//       WHERE o.id = ?
//     `,
//       [orderId],
//     );

//     if (!order) return res.status(404).json({ message: "Order not found" });

//     // Fetch products
//     const [products] = await pool.query(
//       `
//       SELECT op.quantity, op.price, op.order_status, op.payment_status,
//              p.name, p.sku, p.brand, p.gst, p.product_MRP,
//              s.name AS seller_name, s.mobile AS seller_phone
//       FROM order_products op
//       LEFT JOIN product p ON op.product_id = p.id
//       LEFT JOIN seller s ON op.seller_id = s.id
//       WHERE op.order_id = ?
//     `,
//       [orderId],
//     );

//     if (!products || products.length === 0) {
//       return res.status(404).json({ message: "No products found in order" });
//     }

//     // Calculate totals
//     let totalBase = 0,
//       totalGST = 0;
//     products.forEach((p) => {
//       const qty = parseFloat(p.quantity || 0);
//       const price = parseFloat(p.price || 0);
//       const lineTotal = qty * price;
//       const gstAmt = lineTotal * (parseFloat(p.gst || 0) / 100);
//       totalBase += lineTotal;
//       totalGST += gstAmt;
//     });
//     const totalFinal = totalBase + totalGST;

//     const doc = new PDFDocument({ margin: 40, size: "A4" });
//     res.setHeader("Content-Type", "application/pdf");
//     res.setHeader(
//       "Content-Disposition",
//       `inline; filename="invoice-order-${orderId}.pdf"`,
//     );
//     doc.pipe(res);

//     const W = 515;
//     let y = 40;

//     // ==================== HEADER ====================
//     // doc.fontSize(22).fillColor("#1a3c6e").text("KEVELION", 40, y);
//     const sellerNames = [
//       ...new Set(products.map((p) => p.seller_name).filter(Boolean)),
//     ].join(", ");
//     doc
//       .fontSize(22)
//       .fillColor("#1a3c6e")
//       .text(`${sellerNames ? `${sellerNames}` : ""}`, 40, y);
//     y += 26;
//     doc.fontSize(9).fillColor("#888").text("B2B E-Commerce Platform", 40, y);

//     const sellerPhones = [
//       ...new Set(products.map((p) => p.seller_phone).filter(Boolean)),
//     ].join(", ");

//     y += 12;
//     // doc
//     //   .fontSize(8)
//     //   .fillColor("#444")
//     //   .text(`Seller Name: ${sellerNames}`, 40, y);
//     // y += 10;
//     doc.fontSize(8).fillColor("#444").text(`Contact: ${sellerPhones}`, 40, y);

//     doc
//       .fontSize(9)
//       .fillColor("#555")
//       .text("Tax Invoice / Bill of Supply", 400, y - 8, {
//         align: "right",
//         width: 155,
//       });

//     y += 18;
//     doc
//       .moveTo(40, y)
//       .lineTo(555, y)
//       .lineWidth(2)
//       .strokeColor("#1a3c6e")
//       .stroke();
//     y += 18;

//     // ==================== META ====================
//     const invDate = new Date(order.created_at).toLocaleDateString("en-IN");
//     doc.rect(40, y, W, 36).fillColor("#f0f4fa").fill();

//     doc.fontSize(7).fillColor("#666");
//     ["INVOICE NO", "ORDER ID", "DATE", "ITEMS"].forEach((txt, i) => {
//       doc.text(txt, 50 + i * 120, y + 6);
//     });

//     doc.fontSize(10).fillColor("#1a3c6e").font("Helvetica-Bold");
//     doc.text(`INV-${String(order.id).padStart(5, "0")}`, 50, y + 16);
//     doc.text(`#${order.id}`, 170, y + 16);
//     doc.text(invDate, 290, y + 16);
//     doc.text(`${products.length}`, 430, y + 16);
//     doc.font("Helvetica");

//     y += 52;

//     // ==================== ADDRESS BOXES ====================
//     const boxHeight = 85;
//     const drawBox = (x, bw, title, lines) => {
//       doc
//         .rect(x, y, bw, boxHeight)
//         .strokeColor("#d0daea")
//         .lineWidth(1)
//         .stroke();
//       doc
//         .fontSize(7)
//         .fillColor("#1a3c6e")
//         .font("Helvetica-Bold")
//         .text(title, x + 8, y + 6);

//       doc
//         .moveTo(x, y + 16)
//         .lineTo(x + bw, y + 16)
//         .strokeColor("#d0daea")
//         .stroke();

//       doc.font("Helvetica").fontSize(9).fillColor("#111");
//       lines.forEach((line, i) => {
//         if (line) {
//           doc.text(line, x + 8, y + 23 + i * 12, {
//             width: bw - 16,
//             ellipsis: true,
//           });
//         }
//       });
//     };

//     drawBox(40, 200, "BILL TO / BUYER", [
//       order.buyer_name,
//       order.buyer_email,
//       order.buyer_mobile,
//       order.buyer_address,
//     ]);

//     drawBox(248, 180, "SHIP TO", [
//       order.buyer_name,
//       order.order_address || order.buyer_address,
//       order.order_contact ? `Contact: ${order.order_contact}` : "",
//     ]);

//     drawBox(436, 119, "PAYMENT", ["Total:", `Rs. ${totalFinal.toFixed(2)}`]);

//     y += boxHeight + 25;

//     // ==================== PRODUCTS TABLE ====================
//     // ==================== PRODUCTS TABLE ====================
//     const rowH = 48; // Increased for better wrapping
//     const tableY = y;

//     // Header
//     doc.rect(40, y, W, 20).fillColor("#1a3c6e").fill();
//     doc.fontSize(8).fillColor("#fff").font("Helvetica-Bold");

//     const columns = [
//       { txt: "#", x: 46, w: 20, align: "left" },
//       { txt: "PRODUCT", x: 68, w: 162, align: "left" },
//       { txt: "QTY", x: 235, w: 38, align: "center" },
//       { txt: "PRICE", x: 275, w: 58, align: "right" },
//       { txt: "GST%", x: 335, w: 38, align: "center" },
//       { txt: "GST AMT", x: 375, w: 58, align: "right" },
//       { txt: "TOTAL", x: 435, w: 62, align: "right" },
//       { txt: "STATUS", x: 500, w: 55, align: "left" },
//     ];

//     columns.forEach((col) => {
//       doc.text(col.txt, col.x, y + 6, { width: col.w, align: col.align });
//     });

//     y += 20;

//     // Table Rows
//     products.forEach((p, i) => {
//       const qty = parseFloat(p.quantity || 0);
//       const price = parseFloat(p.price || 0);
//       const lineTotal = qty * price;
//       const gstAmt = lineTotal * (parseFloat(p.gst || 0) / 100);

//       // New page check
//       if (y + rowH > 740) {
//         doc.addPage();
//         y = 60;
//       }

//       // Background & Border
//       if (i % 2 === 0) doc.rect(40, y, W, rowH).fillColor("#f8fafd").fill();
//       doc.rect(40, y, W, rowH).strokeColor("#dde6f0").lineWidth(0.5).stroke();

//       // Row Content
//       doc.fontSize(8).fillColor("#111").font("Helvetica-Bold");
//       doc.text(`${i + 1}`, 46, y + 9, { width: 20 });

//       // Product Name (multi-line support)
//       doc.text(p.name || "N/A", 68, y + 7, {
//         width: 160,
//         ellipsis: true,
//         lineGap: 1,
//       });

//       // doc
//       //   .font("Helvetica")
//       //   .fontSize(7)
//       //   .fillColor("#555")
//       //   .text(p.seller_name || "-", 68, y + 23, { width: 160, ellipsis: true });

//       // Other columns
//       doc.fontSize(8).fillColor("#111");
//       doc.text(qty.toString(), 235, y + 13, { width: 38, align: "center" });
//       doc.text(`Rs.${price.toFixed(2)}`, 275, y + 13, {
//         width: 58,
//         align: "right",
//       });
//       doc.text(`${parseFloat(p.gst || 0).toFixed(0)}%`, 335, y + 13, {
//         width: 38,
//         align: "center",
//       });
//       doc.text(`Rs.${gstAmt.toFixed(2)}`, 375, y + 13, {
//         width: 58,
//         align: "right",
//       });
//       doc.text(`Rs.${(lineTotal + gstAmt).toFixed(2)}`, 435, y + 13, {
//         width: 62,
//         align: "right",
//       });

//       // Status
//       const statusColors = {
//         Delivered: "#155724",
//         Shipped: "#004085",
//         Confirmed: "#0c5460",
//         Cancelled: "#721c24",
//         New: "#856404",
//       };
//       doc
//         .fontSize(7.5)
//         .fillColor(statusColors[p.order_status] || "#333")
//         .text(p.order_status || "New", 500, y + 14, { width: 55 });

//       y += rowH;
//     });
//     // ==================== TOTALS ====================
//     y += 15;
//     const totalsX = 340;

//     const drawTotalRow = (label, value, highlight = false) => {
//       if (y > 720) {
//         doc.addPage();
//         y = 80;
//       }
//       const h = highlight ? 26 : 22;
//       if (highlight) doc.rect(totalsX, y, 215, h).fillColor("#1a3c6e").fill();

//       doc
//         .fontSize(9)
//         .font("Helvetica-Bold")
//         .fillColor(highlight ? "#fff" : "#555")
//         .text(label, totalsX + 8, y + 7, { width: 110 });

//       doc
//         .fillColor(highlight ? "#fff" : "#111")
//         .text(value, totalsX + 125, y + 7, { width: 85, align: "right" });

//       if (!highlight) {
//         doc
//           .moveTo(totalsX, y + h)
//           .lineTo(totalsX + 215, y + h)
//           .strokeColor("#e0e8f0")
//           .stroke();
//       }
//       y += h + 4;
//     };

//     drawTotalRow("Subtotal (excl. GST)", `Rs. ${totalBase.toFixed(2)}`);
//     drawTotalRow("Total GST", `Rs. ${totalGST.toFixed(2)}`);
//     drawTotalRow("GRAND TOTAL", `Rs. ${totalFinal.toFixed(2)}`, true);

//     // ==================== FOOTER ====================
//     if (y > 680) doc.addPage();
//     y = 760;

//     doc
//       .moveTo(40, y)
//       .lineTo(555, y)
//       .lineWidth(1.5)
//       .strokeColor("#1a3c6e")
//       .stroke();

//     doc
//       .fontSize(7.5)
//       .fillColor("#666")
//       .text("* Computer-generated invoice. All amounts in INR.", 40, y + 8)
//       .text("* For queries contact: kevelion.com", 40, y + 19);

//     doc
//       .fontSize(8)
//       .fillColor("#333")
//       .font("Helvetica-Bold")
//       .text("Authorized Signatory", 430, y + 16, {
//         width: 125,
//         align: "right",
//       });

//     doc.end();
//   } catch (err) {
//     console.error("Invoice error:", err);
//     return res.status(500).json({ message: err.message });
//   }
// };

// =====================================================================
//  GET ALL ORDERS BY BUYER
// =====================================================================

import PDFDocument from "pdfkit";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOGO_PATH = path.join(__dirname, "../../Kevelion-vendor/Vendor-Kevelion/src/assets/Kevelion_Logo.png");
// import { connectDB } from "../../config/db.js"; // ← adjust to your path

// ─────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────
const Rs = (n) => `Rs.${parseFloat(n || 0).toFixed(2)}`;

function numberToWords(amount) {
  const ones = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];
  const tens = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];

  const num = Math.round(parseFloat(amount || 0));
  if (num === 0) return "Zero Rupees Only";

  function convert(n) {
    if (n < 20) return ones[n];
    if (n < 100)
      return tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : "");
    if (n < 1000)
      return (
        ones[Math.floor(n / 100)] +
        " Hundred" +
        (n % 100 ? " " + convert(n % 100) : "")
      );
    if (n < 100000)
      return (
        convert(Math.floor(n / 1000)) +
        " Thousand" +
        (n % 1000 ? " " + convert(n % 1000) : "")
      );
    if (n < 10000000)
      return (
        convert(Math.floor(n / 100000)) +
        " Lakh" +
        (n % 100000 ? " " + convert(n % 100000) : "")
      );
    return (
      convert(Math.floor(n / 10000000)) +
      " Crore" +
      (n % 10000000 ? " " + convert(n % 10000000) : "")
    );
  }
  return "Rupees " + convert(num) + " Only";
}

// ─────────────────────────────────────────────
//  DRAW ONE SELLER INVOICE PAGE
// ─────────────────────────────────────────────
function drawSellerInvoice(
  doc,
  order,
  seller,
  sellerProducts,
  pageNum,
  totalPages,
) {
  // ── constants ──
  const PL = 40,
    PR = 555,
    W = 515;
  const DARK = "#1a2d5a";
  const LIGHT_BG = "#f4f6fb";
  const BORDER = "#d0d9ec";

  const invDate = new Date(order.created_at).toLocaleDateString("en-IN");
  const invNo = `INV-${String(order.id).padStart(5, "0")}-${String(pageNum).padStart(2, "0")}`;

  // totals for this seller
  let base = 0,
    gstTotal = 0;
  sellerProducts.forEach((p) => {
    const qty = parseFloat(p.quantity || 0);
    const price = parseFloat(p.price || 0);
    const line = qty * price;
    base += line;
    gstTotal += (line * parseFloat(p.gst || 0)) / 100;
  });
  const grand = base + gstTotal;
  const cgst = gstTotal / 2;
  const sgst = gstTotal / 2;

  let y = 10;

  // ── TOP BAR (thin dark strip) ──
  doc.rect(0, 0, 595, 6).fillColor(DARK).fill();

  // ── LOGO AREA ──
  doc.image(LOGO_PATH, PL - 20, y - 20 , { height: 120 });

  // ── TITLE ──
  doc
    .fontSize(22)
    .fillColor(DARK)
    .font("Helvetica-Bold")
    .text("TAX INVOICE", 0, y + 14, { align: "right", width: PR });
  doc
    .fontSize(8)
    .fillColor("#888")
    .font("Helvetica")
    .text(`Page ${pageNum} of ${totalPages}`, 0, y + 40, {
      align: "right",
      width: PR,
    });

  // ── DIVIDER ──
  y = 68;
  doc.moveTo(PL, y).lineTo(PR, y).lineWidth(1).strokeColor(BORDER).stroke();
  y += 10;
  // ── INVOICE META (right side) ──
  const metaX = 320;
  const metaRows = [
    ["Invoice No.", invNo],
    ["Order ID", `#${order.id}`],
    ["Invoice Date", invDate],
    ["Due Date", invDate],
  ];
  let my = y;
  metaRows.forEach(([label, val]) => {
    doc
      .fontSize(8)
      .fillColor("#666")
      .font("Helvetica")
      .text(label, metaX, my, { width: 90 });
    doc
      .fontSize(8)
      .fillColor(DARK)
      .font("Helvetica-Bold")
      .text(":", metaX + 90, my);
    doc
      .fontSize(8)
      .fillColor(DARK)
      .font("Helvetica-Bold")
      .text(val, metaX + 100, my, { width: 155 });
    my += 16;
  });


  y = Math.max(my, y + 50) + 14;

  // ── 3 COLUMN BOXES: SELLER | BUYER | SHIP TO ──
  const boxY = y;
  const boxH = 118;
  const bw = 165;
  const gap = 10;

  // box helper
  const drawInfoBox = (bx, title, titleIcon, rows) => {
    doc.rect(bx, boxY, bw, boxH).fillColor(LIGHT_BG).fill();
    doc.rect(bx, boxY, bw, boxH).strokeColor(BORDER).lineWidth(0.6).stroke();

    // title bar
    doc.rect(bx, boxY, bw, 22).fillColor("#e8edf7").fill();
    doc
      .fontSize(7.5)
      .fillColor(DARK)
      .font("Helvetica-Bold")
      .text(`${titleIcon}  ${title}`, bx + 8, boxY + 7, { width: bw - 16 });

    let ry = boxY + 30;
    rows.forEach(([label, val], i) => {
      if (!val) return;
      if (i === 0) {
        // name row — bold larger
        doc
          .fontSize(9)
          .fillColor(DARK)
          .font("Helvetica-Bold")
          .text(String(val), bx + 8, ry, { width: bw - 16, ellipsis: true });
        ry += 15;
      } else {
        doc
          .fontSize(7)
          .fillColor("#888")
          .font("Helvetica")
          .text(String(label), bx + 8, ry, { width: 42, continued: false });
        doc
          .fontSize(7)
          .fillColor("#333")
          .font("Helvetica")
          .text(String(val), bx + 52, ry, { width: bw - 60, ellipsis: true });
        ry += 12;
      }
    });
  };

  drawInfoBox(PL, "SELLER", "", [
    ["", seller.seller_name || "N/A"],
    ["GSTIN", seller.seller_gstin || "N/A"],
    ["Email", seller.seller_email || "N/A"],
    ["Address", seller.seller_address || "N/A"],
  ]);

  drawInfoBox(PL + bw + gap, "BUYER", "", [
    ["", order.buyer_name || "N/A"],
    ["GSTIN", order.buyer_gstin || "N/A"],
    ["Email", order.buyer_email || "N/A"],
    ["Address", order.buyer_address || "N/A"],
  ]);

  drawInfoBox(PL + (bw + gap) * 2, "SHIP TO", "", [
    ["", order.buyer_name || "N/A"],
    ["Address", order.order_address || order.buyer_address || "N/A"],
  ]);

  y = boxY + boxH + 12;

  // ── PAYMENT INFO STRIP ──
  // doc.rect(PL, y, W, 36).fillColor(LIGHT_BG).fill();
  // doc.rect(PL, y, W, 36).strokeColor(BORDER).lineWidth(0.5).stroke();

  // const pCols = [
  //   { icon: "💳", label: "Payment Method", val: "Online Payment" },
  //   {
  //     icon: "✓",
  //     label: "Payment Status",
  //     val: sellerProducts[0]?.payment_status || "Pending",
  //   },
  //   { icon: "📅", label: "Dispatch Date", val: invDate },
  //   { icon: "🚚", label: "Delivery By", val: invDate },
  //   { icon: "📍", label: "Place of Supply", val: "India" },
  // ];
  // const cw = W / pCols.length;
  // pCols.forEach((c, i) => {
  //   const cx = PL + i * cw;
  //   if (i > 0)
  //     doc
  //       .moveTo(cx, y + 6)
  //       .lineTo(cx, y + 30)
  //       .strokeColor(BORDER)
  //       .lineWidth(0.4)
  //       .stroke();
  //   doc
  //     .fontSize(7)
  //     .fillColor("#888")
  //     .font("Helvetica")
  //     .text(c.label, cx + 8, y + 7, { width: cw - 10 });
  //   doc
  //     .fontSize(8)
  //     .fillColor(DARK)
  //     .font("Helvetica-Bold")
  //     .text(c.val, cx + 8, y + 18, { width: cw - 10 });
  // });

  // y += 48;

  // ── PRODUCTS TABLE ──
  // Header
  const cols = [
    { h: "#",          x: PL,       w: 16,  a: "center" },
    { h: "PRODUCT",    x: PL + 18,  w: 155, a: "left"   },
    { h: "SKU",        x: PL + 175, w: 55,  a: "center" },
    { h: "QTY",        x: PL + 232, w: 35,  a: "center" },
    { h: "UNIT",       x: PL + 269, w: 30,  a: "center" },
    { h: "UNIT PRICE", x: PL + 301, w: 68,  a: "right"  },
    { h: "GST %",      x: PL + 371, w: 36,  a: "center" },
    { h: "GST AMT",    x: PL + 409, w: 50,  a: "right"  },
{ h: "TOTAL",      x: PL + 455, w: 55,  a: "right"  },
  ];

  doc.rect(PL, y, W, 20).fillColor(DARK).fill();
  doc.fontSize(7).fillColor("#fff").font("Helvetica-Bold");
  cols.forEach((c) =>
    doc.text(c.h, c.x + 2, y + 6, { width: c.w - 2, align: c.a }),
  );
  y += 20;

  const statusColors = {
    Delivered: "#155724",
    Shipped: "#004085",
    Confirmed: "#0c5460",
    Cancelled: "#721c24",
    New: "#856404",
  };

  sellerProducts.forEach((p, i) => {
    const qty = parseFloat(p.quantity || 0);
    const price = parseFloat(p.price || 0);
    const gstPct = parseFloat(p.gst || 0);
    const line = qty * price;
    const gstAmt = (line * gstPct) / 100;
const nameLines = Math.ceil((p.name || "N/A").length / 18);
    const rowH = Math.max(34, nameLines * 12 + 16);
    doc
      .rect(PL, y, W, rowH)
      .fillColor(i % 2 === 0 ? "#fff" : LIGHT_BG)
      .fill();
    doc.rect(PL, y, W, rowH).strokeColor(BORDER).lineWidth(0.4).stroke();

    const cy = y + 6;

    doc
      .fontSize(7)
      .fillColor(DARK)
      .font("Helvetica-Bold")
      .text(`${i + 1}`, cols[0].x + 2, cy + 5, {
        width: cols[0].w,
        align: "center",
      });

    // product name + subtitle
    doc
      .fontSize(8)
      .fillColor(DARK)
      .font("Helvetica-Bold")
      .text(p.name || "N/A", cols[1].x + 2, cy, {
        width: cols[1].w - 2,
        ellipsis: true,
      });
    doc
      .fontSize(6.5)
      .fillColor("#777")
      .font("Helvetica")
      .text(p.brand || "", cols[1].x + 2, cy + 12, {
        width: cols[1].w - 2,
        ellipsis: true,
      });

    doc.fontSize(7.5).fillColor("#333").font("Helvetica");
    doc.text(p.sku || "-", cols[2].x + 2, cy + 5, {
      width: cols[2].w - 2,
      align: "center",
    });
    doc.text(`${qty}`, cols[3].x + 2, cy + 5, { width: cols[3].w - 2, align: "center" });
    doc.text("Nos",    cols[4].x + 2, cy + 5, { width: cols[4].w - 2, align: "center" });

    doc.font("Helvetica-Bold").fillColor(DARK);
    doc.text(`Rs.${price.toFixed(2)}`,          cols[5].x + 2, cy + 5, { width: cols[5].w - 2, align: "right" });
    doc.font("Helvetica").fillColor("#555");
    doc.text(`${gstPct.toFixed(0)}%`,           cols[6].x + 2, cy + 5, { width: cols[6].w - 2, align: "center" });
    doc.text(`Rs.${gstAmt.toFixed(2)}`,         cols[7].x + 2, cy + 5, { width: cols[7].w - 2, align: "right" });
    doc.font("Helvetica-Bold").fillColor(DARK);
doc.text(`Rs.${(line + gstAmt).toFixed(2)}`, cols[8].x, cy + 5, { width: cols[8].w, align: "right" });
    y += rowH;
  });

  y += 16;

  // ── NOTES + TOTALS side by side ──
  const notesX = PL,
    notesW = 220;
  const totX = PL + notesW + 20,
    totW = W - notesW - 20;

  // // Notes box
  // doc.rect(notesX, y, notesW, 110).fillColor(LIGHT_BG).fill();
  // doc.rect(notesX, y, notesW, 110).strokeColor(BORDER).lineWidth(0.5).stroke();
  // doc
  //   .fontSize(8)
  //   .fillColor(DARK)
  //   .font("Helvetica-Bold")
  //   .text("Invoice Notes", notesX + 8, y + 8);
  // const notes = [
  //   "Please check the goods before accepting.",
  //   "Goods once sold will not be taken back.",
  //   "For any queries, contact us on the details above.",
  //   "This is a computer-generated invoice.",
  // ];
  // let ny = y + 22;
  // notes.forEach((n) => {
  //   doc
  //     .fontSize(7)
  //     .fillColor("#555")
  //     .font("Helvetica")
  //     .text(`• ${n}`, notesX + 8, ny, { width: notesW - 16 });
  //   ny += 12;
  // });

  // Totals
  const drawTot = (label, val, highlight, ty) => {
    if (highlight) {
      doc.rect(totX, ty, totW, 24).fillColor(DARK).fill();
      doc
        .fontSize(10)
        .fillColor("#fff")
        .font("Helvetica-Bold")
        .text(label, totX + 8, ty + 7, { width: totW / 2 });
      doc.text(val, totX + totW / 2, ty + 7, {
        width: totW / 2 - 8,
        align: "right",
      });
    } else {
      doc.rect(totX, ty, totW, 20).fillColor("#fff").fill();
      doc.rect(totX, ty, totW, 20).strokeColor(BORDER).lineWidth(0.4).stroke();
      doc
        .fontSize(8)
        .fillColor("#555")
        .font("Helvetica")
        .text(label, totX + 8, ty + 6, { width: totW / 2 });
      doc
        .fontSize(8)
        .fillColor(DARK)
        .font("Helvetica-Bold")
        .text(val, totX + totW / 2, ty + 6, {
          width: totW / 2 - 8,
          align: "right",
        });
    }
  };

  drawTot("Subtotal (excl. GST)", `Rs.${base.toFixed(2)}`, false, y);
  drawTot(
    `CGST (${((gstTotal / base) * 50 || 0).toFixed(0)}%)`,
    `Rs.${cgst.toFixed(2)}`,
    false,
    y + 20,
  );
  drawTot(
    `SGST (${((gstTotal / base) * 50 || 0).toFixed(0)}%)`,
    `Rs.${sgst.toFixed(2)}`,
    false,
    y + 40,
  );
  drawTot("GRAND TOTAL", `Rs.${grand.toFixed(2)}`, true, y + 62);

  // Amount in words
  doc
    .fontSize(7)
    .fillColor("#555")
    .font("Helvetica")
    .text(`Amount in words: ${numberToWords(grand)}`, totX, y + 90, {
      width: totW,
    });

  y += 118;

  // ── FOOTER ──
  doc
    .moveTo(PL, y + 4)
    .lineTo(PR, y + 4)
    .lineWidth(0.5)
    .strokeColor(BORDER)
    .stroke();

  // left
  doc
    .fontSize(7)
    .fillColor("#888")
    .font("Helvetica")
    .text("This invoice is generated by Kevelion", PL, y + 10)
    .text(`on behalf of the seller ${seller.seller_name || ""}.`, PL, y + 21);

  // right — signatory
  doc
    .moveTo(PR - 130, y + 8)
    .lineTo(PR, y + 8)
    .strokeColor("#aaa")
    .lineWidth(0.5)
    .stroke();
  doc
    .fontSize(7)
    .fillColor("#555")
    .font("Helvetica")
    .text("Authorized Signatory", PR - 128, y + 12, {
      width: 128,
      align: "center",
    });
  doc
    .fontSize(8)
    .fillColor(DARK)
    .font("Helvetica-Bold")
    .text(seller.seller_name || "", PR - 128, y + 23, {
      width: 128,
      align: "center",
    });

      // ── PERFECT BOTTOM FOOTER ──
  // Dark blue strip pinned exactly at bottom of every page
  doc.rect(0, 812, 595, 32).fillColor("#0f2b5e").fill();

  doc
    .fontSize(9.5)
    .fillColor("#ffffff")
    .font("Helvetica-Bold")
    .text("Thank you for your business! | Kevelion - Empowering Businesses", 
          0, 820, { align: "center", width: 595 });
}

// ─────────────────────────────────────────────
//  DRAW SUMMARY PAGE  (page 1)
// ─────────────────────────────────────────────
function drawSummaryPage(doc, order, groupedSellers, totalPages) {
  const PL = 40,
    PR = 555,
    W = 515;
  const DARK = "#1a2d5a";
  const LIGHT_BG = "#f4f6fb";
  const BORDER = "#d0d9ec";

  const invDate = new Date(order.created_at).toLocaleDateString("en-IN");
 let y = 10;

  // top bar
  doc.rect(0, 0, 595, 6).fillColor(DARK).fill();

  // logo
  doc.image(LOGO_PATH, PL - 20, y - 20, { height: 120 });

  doc
    .fontSize(22)
    .fillColor(DARK)
    .font("Helvetica-Bold")
    .text("INVOICE SUMMARY", 0, y + 14, { align: "right", width: PR });
  doc
    .fontSize(8)
    .fillColor("#888")
    .font("Helvetica")
    .text(`Page 1 of ${totalPages}`, 0, y + 40, { align: "right", width: PR });

  y = 68;
  doc.moveTo(PL, y).lineTo(PR, y).lineWidth(0.8).strokeColor(BORDER).stroke();
  y += 14;
  // ── 3 COLUMN: website | order details | buyer ──
  const col1X = PL;
  const col2X = 210;
  const col3X = 390;
  const colW  = 160;
  const rowStart = y;

  // COL 1 — website info
  doc.fontSize(8).fillColor("#555").font("Helvetica")
     .text("www.kevelion.com",    col1X, rowStart + 4)
     .text("support@kevelion.com",col1X, rowStart + 18);

  // COL 2 — order details
  doc.fontSize(9).fillColor(DARK).font("Helvetica-Bold")
     .text("Order Details", col2X, rowStart);
  const orderMeta = [
    ["Order ID",       `#ORD-${new Date(order.created_at).getFullYear()}-${order.id}`],
    ["Order Date",     new Date(order.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })],
    ["Total Sellers",  `${groupedSellers.length}`],
    ["Total Invoices", `${groupedSellers.length}`],
  ];
  let oy = rowStart + 14;
  orderMeta.forEach(([l, v]) => {
    doc.fontSize(7).fillColor("#666").font("Helvetica").text(l, col2X, oy, { width: 72 });
    doc.fillColor("#333").font("Helvetica").text(":", col2X + 72, oy);
    doc.fillColor(DARK).font("Helvetica-Bold").text(v, col2X + 80, oy, { width: colW - 80 });
    oy += 13;
  });

  // COL 3 — buyer
  doc.fontSize(9).fillColor(DARK).font("Helvetica-Bold")
     .text("Bill To / Buyer", col3X, rowStart);
  doc.fontSize(9).fillColor(DARK).font("Helvetica-Bold")
     .text(order.buyer_name || "N/A", col3X, rowStart + 14, { width: colW });
  doc.fontSize(7).fillColor("#555").font("Helvetica")
     .text(order.buyer_address || "", col3X, rowStart + 27, { width: colW });

  y = Math.max(oy, rowStart + 60) + 10;
  // ── INFO BANNER ──
  // doc.rect(PL, y, W, 34).fillColor("#e8f0fb").fill();
  // doc.rect(PL, y, W, 34).strokeColor("#b8cce8").lineWidth(0.5).stroke();
  // doc
  //   .fontSize(8)
  //   .fillColor(DARK)
  //   .font("Helvetica-Bold")
  //   .text(
  //     "This PDF contains separate invoices for each seller.",
  //     PL + 14,
  //     y + 7,
  //   );
  // doc
  //   .fontSize(7.5)
  //   .fillColor("#555")
  //   .font("Helvetica")
  //   .text(
  //     "Use the page navigation or scroll to view individual seller invoices.",
  //     PL + 14,
  //     y + 19,
  //   );
  // y += 46;

  // ── ORDER SUMMARY TABLE ──
  doc
    .fontSize(10)
    .fillColor(DARK)
    .font("Helvetica-Bold")
    .text("Order Summary (By Seller)", PL, y);
  y += 12;

  // table header
  doc.rect(PL, y, W, 20).fillColor(DARK).fill();
  doc.fontSize(7.5).fillColor("#fff").font("Helvetica-Bold");
  const sc = [
    { h: "Seller Details", x: PL + 8, w: 160 },
    { h: "Items", x: PL + 172, w: 40 },
    { h: "Amount (excl. GST)", x: PL + 216, w: 80 },
    { h: "GST Amount", x: PL + 300, w: 70 },
    { h: "Total Amount (incl. GST)", x: PL + 374, w: 90 },
    { h: "Invoice Page", x: PL + 468, w: 60 },
  ];
  sc.forEach((c) => doc.text(c.h, c.x, y + 6, { width: c.w }));
  y += 20;

  let grandBase = 0,
    grandGst = 0,
    grandTotal = 0,
    grandItems = 0;

  groupedSellers.forEach((s, si) => {
    let sBase = 0,
      sGst = 0;
    s.products.forEach((p) => {
      const line = parseFloat(p.quantity || 0) * parseFloat(p.price || 0);
      const gst = (line * parseFloat(p.gst || 0)) / 100;
      sBase += line;
      sGst += gst;
    });
    const sTotal = sBase + sGst;
    grandBase += sBase;
    grandGst += sGst;
    grandTotal += sTotal;
    grandItems += s.products.length;

    const rowH = 24 + s.products.length * 13 + 8;
    doc
      .rect(PL, y, W, rowH)
      .fillColor(si % 2 === 0 ? "#fff" : "#f9fafd")
      .fill();
    doc.rect(PL, y, W, rowH).strokeColor(BORDER).lineWidth(0.4).stroke();

    // seller name + gstin
    doc
      .fontSize(8.5)
      .fillColor(DARK)
      .font("Helvetica-Bold")
      .text(s.seller_name || "N/A", sc[0].x, y + 5, { width: sc[0].w });
    doc
      .fontSize(6.5)
      .fillColor("#777")
      .font("Helvetica")
      .text(`GSTIN: ${s.seller_gstin || "N/A"}`, sc[0].x, y + 17, {
        width: sc[0].w,
      });

    doc
      .fontSize(8)
      .fillColor("#333")
      .font("Helvetica-Bold")
      .text(`${s.products.length} Items`, sc[1].x, y + 8, { width: sc[1].w });

    doc
      .fontSize(8)
      .fillColor("#333")
      .font("Helvetica")
      .text(`Rs.${sBase.toFixed(2)}`, sc[2].x, y + 8, { width: sc[2].w })
      .text(`Rs.${sGst.toFixed(2)}`, sc[3].x, y + 8, { width: sc[3].w });

    doc
      .fontSize(9)
      .fillColor("#1a7a3f")
      .font("Helvetica-Bold")
      .text(`Rs.${sTotal.toFixed(2)}`, sc[4].x, y + 8, { width: sc[4].w });

    doc
      .fontSize(7.5)
      .fillColor("#0046a8")
      .font("Helvetica")
      .text(`Page ${si + 2}`, sc[5].x, y + 8, { width: sc[5].w });

    // top items
    doc
      .fontSize(6.5)
      .fillColor("#888")
      .font("Helvetica-Bold")
      .text("Top Items", sc[0].x, y + 28, { width: 60 });
    s.products.forEach((p, pi) => {
      const line = parseFloat(p.quantity || 0) * parseFloat(p.price || 0);
      doc
        .fontSize(6.5)
        .fillColor("#444")
        .font("Helvetica")
        .text(
          `• ${p.name || "N/A"} (Qty: ${p.quantity})`,
          sc[0].x,
          y + 38 + pi * 13,
          { width: 160 },
        );
      doc.text(`Rs.${line.toFixed(2)}`, sc[2].x, y + 38 + pi * 13, {
        width: sc[2].w,
      });
    });

    y += rowH;
  });

  // grand total row
  y += 4;
  doc.rect(PL, y, W, 36).fillColor(LIGHT_BG).fill();
  doc.rect(PL, y, W, 36).strokeColor(BORDER).lineWidth(0.6).stroke();
  doc
    .fontSize(9)
    .fillColor(DARK)
    .font("Helvetica-Bold")
    .text("Grand Total (All Sellers)", sc[0].x, y + 5, { width: 180 });
  doc
    .fontSize(7.5)
    .fillColor("#555")
    .font("Helvetica")
    .text(`${grandItems} Items`, sc[0].x, y + 20, { width: 100 });
  doc
    .fontSize(8)
    .fillColor("#333")
    .font("Helvetica")
    .text(`Rs.${grandBase.toFixed(2)}`, sc[2].x, y + 12, { width: sc[2].w });
  doc.text(`Rs.${grandGst.toFixed(2)}`, sc[3].x, y + 12, { width: sc[3].w });
  doc
    .fontSize(11)
    .fillColor("#1a7a3f")
    .font("Helvetica-Bold")
    .text(`Rs.${grandTotal.toFixed(2)}`, sc[4].x, y + 10, { width: sc[4].w });

  y += 52;

  // // ── NOTES + HOW IT WORKS ──
  // const nw = 240,
  //   hw = 240;
  // doc.rect(PL, y, nw, 80).fillColor(LIGHT_BG).fill();
  // doc.rect(PL, y, nw, 80).strokeColor(BORDER).lineWidth(0.5).stroke();
  // doc
  //   .fontSize(8)
  //   .fillColor(DARK)
  //   .font("Helvetica-Bold")
  //   .text("Important Notes", PL + 8, y + 8);
  // const notes = [
  //   "Goods once sold will not be taken back.",
  //   "Please check the goods before accepting.",
  //   "For any queries, contact the respective seller.",
  //   "This is a computer-generated invoice summary.",
  // ];
  // notes.forEach((n, i) => {
  //   doc
  //     .fontSize(7)
  //     .fillColor("#555")
  //     .font("Helvetica")
  //     .text(`• ${n}`, PL + 8, y + 22 + i * 13, { width: nw - 16 });
  // });

  
  // ── PERFECT BOTTOM FOOTER ──
  // Dark blue strip pinned exactly at bottom
  doc.rect(0, 812, 595, 32).fillColor("#0f2b5e").fill();   // Exact blue color

  doc
    .fontSize(9.5)
    .fillColor("#ffffff")
    .font("Helvetica-Bold")
    .text("Thank you for your business! | Kevelion - Empowering Businesses", 
          0, 820, { align: "center", width: 595 });
  // doc
  //   .fontSize(7)
  //   .fillColor("#e8500a")
  //   .font("Helvetica")
  //   .text("Kevelion – Empowering Businesses, Connecting Growth", 0, y + 14, {
  //     align: "right",
  //     width: PR,
  //   });
}

// ─────────────────────────────────────────────
//  MAIN CONTROLLER
// ─────────────────────────────────────────────
export const generateOrderInvoice = async (req, res) => {
  try {
    const pool = await connectDB();
    const { orderId } = req.params;

    // fetch order
    const [[order]] = await pool.query(
      `SELECT o.id, o.order_type, o.created_at, o.order_address, o.order_contact, o.buyer_id,
              b.name AS buyer_name, b.email AS buyer_email,
              b.mobile AS buyer_mobile, b.address AS buyer_address
       FROM orders o
       LEFT JOIN buyer b ON o.buyer_id = b.id
       WHERE o.id = ?`,
      [orderId],
    );
    if (!order) return res.status(404).json({ message: "Order not found" });

    // fetch products with seller info
    const [products] = await pool.query(
      `SELECT op.quantity, op.price, op.order_status, op.payment_status,
p.name, p.sku, p.brand, p.gst, p.product_MRP,
      s.id AS seller_id,
              s.name   AS seller_name,
              s.mobile AS seller_phone,
              s.email  AS seller_email
       FROM order_products op
       LEFT JOIN product p ON op.product_id = p.id
       LEFT JOIN seller  s ON op.seller_id  = s.id
       WHERE op.order_id = ?`,
      [orderId],
    );
    if (!products?.length)
      return res.status(404).json({ message: "No products found" });

    // group by seller
    const sellerMap = new Map();
    products.forEach((p) => {
      const sid = p.seller_id || p.seller_name;
      if (!sellerMap.has(sid)) {
        sellerMap.set(sid, {
          seller_id: sid,
          seller_name: p.seller_name,
          seller_phone: p.seller_phone,
          seller_email: p.seller_email,
          seller_gstin: p.seller_gstin || null,
          seller_address: p.seller_address || null,
          products: [],
        });
      }
      sellerMap.get(sid).products.push(p);
    });

    const groupedSellers = [...sellerMap.values()];
    const totalPages = groupedSellers.length + 1; // +1 for summary

    // build PDF
    const doc = new PDFDocument({
      margin: 0,
      size: "A4",
      autoFirstPage: false,
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="invoice-order-${orderId}.pdf"`,
    );
    doc.pipe(res);

    // PAGE 1 — summary
    doc.addPage();
    drawSummaryPage(doc, order, groupedSellers, totalPages);

    // PAGES 2+ — one per seller
    groupedSellers.forEach((seller, i) => {
      doc.addPage();
      drawSellerInvoice(doc, order, seller, seller.products, i + 2, totalPages);
    });

    doc.end();
  } catch (err) {
    console.error("Invoice error:", err);
    if (!res.headersSent) res.status(500).json({ message: err.message });
  }
};

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
