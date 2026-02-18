// import Razorpay from "razorpay";
// import crypto from "crypto";
// import { connectDB } from "../../connection/db.js";

// const razorpay = new Razorpay({
//   key_id: "rzp_test_SH7WpeCIJ9twSe",
//   key_secret: "o7lZUmdeIa9vzbQ25knSL8TV",
// });
// // TEST API KEY rzp_test_SH7WpeCIJ9twSe
// // o7lZUmdeIa9vzbQ25knSL8TV
// // ======================= CREATE ORDER ==========================
// export const createOrder = async (req, res) => {
//   try {
//     const { total, currency = "INR", receipt = `INV-${Date.now()}` } = req.body;

//     const order = await razorpay.orders.create({
//       amount: Math.round(parseFloat(total) * 100), // convert to paise
//       currency: currency,
//       receipt: receipt,
//     });

//     res.status(200).json({
//       order_id: order.id,
//       amount: order.amount,
//       currency: order.currency,
//       key_id: "rzp_test_SH7WpeCIJ9twSe", // sent to FE for popup
//     });
//   } catch (error) {
//     console.error("Error creating order:", error);
//     res
//       .status(500)
//       .json({ message: "Order creation failed", error: error.message });
//   }
// };

// // ======================= VERIFY PAYMENT ==========================
// export const verifyPayment = async (req, res) => {
//   try {
//     const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
//       req.body;

//     // Step 1: Verify signature
//     const expectedSignature = crypto
//       .createHmac(
//         "sha256",
//         process.env.RAZORPAY_KEY_SECRET || "o7lZUmdeIa9vzbQ25knSL8TV",
//       )
//       .update(`${razorpay_order_id}|${razorpay_payment_id}`)
//       .digest("hex");

//     if (expectedSignature !== razorpay_signature) {
//       return res.status(400).json({ message: "Invalid payment signature" });
//     }

//     // Step 2: Fetch payment details
//     const payment = await razorpay.payments.fetch(razorpay_payment_id);

//     // Step 3: Save to DB
//     const pool = await connectDB();
//     // await pool.query(
//     //   `INSERT INTO payment_transactions
//     //     (order_id, payment_id, signature, amount, currency, status, method, email, contact)
//     //    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
//     //   [
//     //     razorpay_order_id,
//     //     razorpay_payment_id,
//     //     razorpay_signature,
//     //     payment.amount / 100,
//     //     payment.currency,
//     //     payment.status,
//     //     payment.method,
//     //     payment.email,
//     //     payment.contact,
//     //   ],
//     // );

//     res.status(200).json({
//       status: "Payment Successful",
//       order_id: razorpay_order_id || null,
//       payment_id: razorpay_payment_id || null,
//       amount: payment.amount / 100,
//       currency: payment.currency || null,
//       method: payment.method || null,
//       email: payment.email || null,
//       contact: payment.contact || null,
//     });
//   } catch (error) {
//     console.error("Error verifying payment:", error);
//     res
//       .status(500)
//       .json({ message: "Verification failed", error: error.message });
//   }
// };

// // ======================= GET PAYMENT DETAILS ==========================
// export const getPaymentDetails = async (req, res) => {
//   try {
//     const { payment_id } = req.params;
//     const payment = await razorpay.payments.fetch(payment_id);

//     res.status(200).json({
//       payment_id: payment.id || null,
//       order_id: payment.order_id || null,
//       amount: payment.amount / 100,
//       currency: payment.currency || null,
//       status: payment.status || null,
//       method: payment.method || null,
//       email: payment.email || null,
//       contact: payment.contact || null,
//     });
//   } catch (error) {
//     console.error("Error fetching payment:", error);
//     res.status(500).json({ message: "Fetch failed", error: error.message });
//   }
// };

// // ======================= REFUND PAYMENT ==========================
// export const refundPayment = async (req, res) => {
//   try {
//     const { payment_id } = req.params;
//     const { amount } = req.body; // optional for partial refund

//     const refund = await razorpay.payments.refund(payment_id, {
//       amount: amount ? Math.round(parseFloat(amount) * 100) : undefined,
//     });

//     res.status(200).json({
//       status: "Refund Successful",
//       refund_id: refund.id || null,
//       payment_id: refund.payment_id || null,
//       amount: refund.amount / 100,
//       currency: refund.currency || null,
//     });
//   } catch (error) {
//     console.error("Error refunding:", error);
//     res.status(500).json({ message: "Refund failed", error: error.message });
//   }
// };
import Razorpay from "razorpay";
import crypto from "crypto";
import { connectDB } from "../../connection/db.js";

const RAZORPAY_KEY_ID = "rzp_test_SH7WpeCIJ9twSe";
const RAZORPAY_KEY_SECRET = "o7lZUmdeIa9vzbQ25knSL8TV";

const razorpay = new Razorpay({
  key_id: RAZORPAY_KEY_ID,
  key_secret: RAZORPAY_KEY_SECRET,
});

// ======================= CREATE ORDER ==========================
export const createOrder = async (req, res) => {
  try {
    const {
      total,
      currency = "INR",
      receipt = `INV-${Date.now()}`,
      name,
      seller_id,
      buyer_id,
      product_id,
    } = req.body;

    const order = await razorpay.orders.create({
      amount: Math.round(parseFloat(total) * 100),
      currency: currency,
      receipt: receipt,
      notes: {
        name: String(name || ""),
        seller_id: String(seller_id || ""),
        buyer_id: String(buyer_id || ""),
        product_id: String(product_id || ""),
      },
    });

    res.status(200).json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      key_id: RAZORPAY_KEY_ID,
      notes: order.notes,
    });
  } catch (error) {
    console.error("Error creating order:", error);
    res
      .status(500)
      .json({ message: "Order creation failed", error: error.message });
  }
};

// ======================= VERIFY PAYMENT ==========================
export const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;

    // Step 1: Verify signature
    const expectedSignature = crypto
      .createHmac("sha256", RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: "Invalid payment signature" });
    }

    // Step 2: Fetch payment + order details from Razorpay
    const payment = await razorpay.payments.fetch(razorpay_payment_id);
    const order = await razorpay.orders.fetch(razorpay_order_id);

    // Step 3: Save to DB
    const pool = await connectDB();

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
        order.notes?.name || null,
        order.notes?.seller_id || null,
        order.notes?.buyer_id || null,
        order.notes?.product_id || null,
      ],
    );

    res.status(200).json({
      status: "Payment Successful",
      order_id: razorpay_order_id,
      payment_id: razorpay_payment_id,
      amount: payment.amount / 100,
      currency: payment.currency || null,
      method: payment.method || null,
      email: payment.email || null,
      contact: payment.contact || null,
      name: order.notes?.name || null,
      seller_id: order.notes?.seller_id || null,
      buyer_id: order.notes?.buyer_id || null,
      product_id: order.notes?.product_id || null,
    });
  } catch (error) {
    console.error("Error verifying payment:", error);
    res
      .status(500)
      .json({ message: "Verification failed", error: error.message });
  }
};

// ======================= GET PAYMENT DETAILS ==========================
export const getPaymentDetails = async (req, res) => {
  try {
    const { payment_id } = req.params;
    const payment = await razorpay.payments.fetch(payment_id);

    res.status(200).json({
      payment_id: payment.id || null,
      order_id: payment.order_id || null,
      amount: payment.amount / 100,
      currency: payment.currency || null,
      status: payment.status || null,
      method: payment.method || null,
      email: payment.email || null,
      contact: payment.contact || null,
    });
  } catch (error) {
    console.error("Error fetching payment:", error);
    res.status(500).json({ message: "Fetch failed", error: error.message });
  }
};

// ======================= REFUND PAYMENT ==========================
export const refundPayment = async (req, res) => {
  try {
    const { payment_id } = req.params;
    const { amount } = req.body;

    const refund = await razorpay.payments.refund(payment_id, {
      amount: amount ? Math.round(parseFloat(amount) * 100) : undefined,
    });

    // Update status in DB to refunded
    const pool = await connectDB();
    await pool.query(
      `UPDATE payment_transactions SET status = 'refunded' WHERE payment_id = ?`,
      [payment_id],
    );

    res.status(200).json({
      status: "Refund Successful",
      refund_id: refund.id || null,
      payment_id: refund.payment_id || null,
      amount: refund.amount / 100,
      currency: refund.currency || null,
    });
  } catch (error) {
    console.error("Error refunding:", error);
    res.status(500).json({ message: "Refund failed", error: error.message });
  }
};
