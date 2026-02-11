 import { connectDB } from "../../connection/db.js";
import bcrypt from "bcrypt";

//====== add / remove product from cat page ===================
export const changeCartQty = async (req, res) => {
  try {
    const pool = await connectDB();
    const { buyer_id, product_id, action } = req.body;

    if (!buyer_id || !product_id || !action) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    /* 1️⃣ Get active cart */
    const [cartRows] = await pool.query(
      `SELECT id FROM buyer_cart WHERE buyer_id = ? AND status = 'ACTIVE'`,
      [buyer_id]
    );

    if (cartRows.length === 0) {
      return res.status(404).json({ message: "Cart not found" });
    }

    const cartId = cartRows[0].id;

    /* 2️⃣ Get cart item */
    const [itemRows] = await pool.query(
      `SELECT quantity FROM cart_item WHERE cart_id = ? AND product_id = ?`,
      [cartId, product_id]
    );

    if (itemRows.length === 0) {
      return res.status(404).json({ message: "Item not found in cart" });
    }

    let currentQty = itemRows[0].quantity;

    /* 3️⃣ Get product + MOQ */
    const [prod] = await pool.query(
      `SELECT product_MRP, pricing_tiers, moq 
       FROM product WHERE id = ?`,
      [product_id]
    );

    const product = prod[0];
    const price = Number(product.product_MRP);
    const MOQ = Number(product.moq) || 1;

    /* 4️⃣ Increase / Decrease */
    let newQty = currentQty;

    if (action === "increase") {
      newQty += 1;
    } else if (action === "decrease") {
      if (currentQty <= MOQ) {
        return res.status(400).json({
          message: `Minimum order quantity is ${MOQ}`
        });
      }
      newQty -= 1;
    } else {
      return res.status(400).json({ message: "Invalid action" });
    }

    /* 5️⃣ Recalculate tier pricing */
    let finalUnitPrice = price;
    try {
      let tiers = JSON.parse(product.pricing_tiers);
      if (typeof tiers === "string") tiers = JSON.parse(tiers);

      if (Array.isArray(tiers)) {
        tiers.sort((a, b) => Number(a.min) - Number(b.min));
        for (let t of tiers) {
          if (newQty >= Number(t.min)) {
            finalUnitPrice = Number(t.price);
          }
        }
      }
    } catch {}

    const total = price * newQty;
    const final = finalUnitPrice * newQty;
    const discount = total - final;

    /* 6️⃣ Update cart item */
    await pool.query(
      `UPDATE cart_item SET
        quantity = ?,
        discounted_price = ?,
        total_amount = ?,
        final_amount = ?,
        discount_amount = ?
       WHERE cart_id = ? AND product_id = ?`,
      [
        newQty,
        finalUnitPrice,
        total,
        final,
        discount,
        cartId,
        product_id
      ]
    );

    return res.status(200).json({
      status: "success",
      message: "Quantity updated",
      quantity: newQty
    });

  } catch (err) {
    console.error("Change qty error:", err);
    res.status(500).json({ message: "Server error" });
  }
};


//=========================add item in cart 

export const addToCart = async (req, res) => {
  try {
    const pool = await connectDB();
    const { buyer_id, product_id, quantity = 1 } = req.body;

    if (!buyer_id || !product_id) {
      return res.status(400).json({ message: "buyer_id and product_id required" });
    }

    /* 1️⃣ Get ACTIVE cart */
    const [cartRows] = await pool.query(
      `SELECT id FROM buyer_cart WHERE buyer_id = ? AND status = 'ACTIVE'`,
      [buyer_id]
    );

    let cartId;
    if (cartRows.length > 0) {
      cartId = cartRows[0].id;
    } else {
      const [newCart] = await pool.query(
        `INSERT INTO buyer_cart (buyer_id, status) VALUES (?, 'ACTIVE')`,
        [buyer_id]
      );
      cartId = newCart.insertId;
    }

    /* 2️⃣ Get product + MOQ */
    const [prod] = await pool.query(
      `SELECT id, product_MRP, pricing_tiers, moq 
       FROM product WHERE id = ?`,
      [product_id]
    );

    if (prod.length === 0) {
      return res.status(400).json({ message: "Invalid product" });
    }

    const product = prod[0];
    const price = Number(product.product_MRP);
    const MOQ = Number(product.moq) || 1;

    /* 3️⃣ Check if already in cart */
    const [existingItem] = await pool.query(
      `SELECT quantity FROM cart_item WHERE cart_id = ? AND product_id = ?`,
      [cartId, product_id]
    );

    let newQty;
    if (existingItem.length > 0) {
      newQty = existingItem[0].quantity + quantity;
    } else {
      newQty = Math.max(quantity, MOQ); // FORCE MOQ on first add
    }

    /* 4️⃣ Calculate tier price based on newQty */
    let finalUnitPrice = price;
    try {
      let tiers = JSON.parse(product.pricing_tiers);
      if (typeof tiers === "string") tiers = JSON.parse(tiers);

      if (Array.isArray(tiers)) {
        tiers.sort((a, b) => Number(a.min) - Number(b.min));
        for (let t of tiers) {
          if (newQty >= Number(t.min)) {
            finalUnitPrice = Number(t.price);
          }
        }
      }
    } catch {}

    const total = price * newQty;
    const final = finalUnitPrice * newQty;
    const discount = total - final;

    /* 5️⃣ Insert / Update cart item */
    if (existingItem.length > 0) {
      await pool.query(
        `UPDATE cart_item SET
          quantity = ?,
          discounted_price = ?,
          total_amount = ?,
          final_amount = ?,
          discount_amount = ?
         WHERE cart_id = ? AND product_id = ?`,
        [
          newQty,
          finalUnitPrice,
          total,
          final,
          discount,
          cartId,
          product_id
        ]
      );
    } else {
      await pool.query(
        `INSERT INTO cart_item
        (cart_id, product_id, quantity, price, discounted_price, total_amount, discount_amount, final_amount)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          cartId,
          product_id,
          newQty,
          price,
          finalUnitPrice,
          total,
          discount,
          final
        ]
      );
    }

    return res.status(200).json({
      status: "success",
      message: "Item added to cart",
      cart_id: cartId,
      quantity: newQty
    });

  } catch (err) {
    console.error("Add to cart error:", err);
    res.status(500).json({ message: "Server error" });
  }
};



// ======================= CREATE sibgle product cart cart=====================

export const createCart = async (req, res) => {
  try {
    const pool = await connectDB();
    const { buyer_id, product_id, quantity = 1 } = req.body;

    if (!buyer_id || !product_id) {
      return res.status(400).json({ message: "buyer_id and product_id are required" });
    }

    // Create main cart
    const [cartResult] = await pool.query(
      `INSERT INTO buyer_cart (buyer_id) VALUES (?)`,
      [buyer_id]
    );

    const cartId = cartResult.insertId;

    // Fetch product details
    const [prod] = await pool.query(
      `SELECT id, name, sku, product_MRP, pricing_tiers, detail, brand, material, specification, warranty, seller_id, status
       FROM product WHERE id = ?`,
      [product_id]
    );

    if (prod.length === 0) {
      return res.status(400).json({ message: `Invalid product_id ${product_id}` });
    }

    const product = prod[0];

    // Convert price
const price = Number(product.product_MRP);

// Tier price calculation
let finalUnitPrice = price;
let discountedPrice = price;

let tiers = product.pricing_tiers;

// Parse JSON safely even if double-encoded
try {
  tiers = JSON.parse(tiers);
  if (typeof tiers === "string") {
    tiers = JSON.parse(tiers);
  }
} catch (e) {
  tiers = [];
}



try {
 // const tiers = JSON.parse(product.pricing_tiers);

  if (Array.isArray(tiers)) {
    tiers.sort((a, b) => Number(a.min) - Number(b.min));

    for (let tier of tiers) {
      if (quantity >= Number(tier.min)) {
        finalUnitPrice = Number(tier.price);
        discountedPrice = Number(tier.price);
      }
    }
  }
} catch (err) {
  finalUnitPrice = price;
  discountedPrice = price;
}

// Calculations
const total_amount = price * quantity;            
const final_amount = finalUnitPrice * quantity;  
const discount_amount = total_amount - final_amount;

    // Insert into cart_item
    await pool.query(
      `INSERT INTO cart_item 
        (cart_id, product_id, quantity, price, discounted_price, total_amount, discount_amount, final_amount)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        cartId,
        product_id,
        quantity,
        price,
        discountedPrice,
        total_amount,
        discount_amount,
        final_amount
      ]
    );

    // Fetch buyer
    const [buyer] = await pool.query(
      `SELECT id AS buyer_id, name AS buyer_name, email AS buyer_email, mobile AS buyer_mobile
       FROM buyer WHERE id = ?`,
      [buyer_id]
    );

    // Fetch seller
    const [seller] = await pool.query(
      `SELECT name AS seller_name, mobile AS seller_phone 
       FROM seller WHERE id = ?`,
      [product.seller_id]
    );

    // Final Response
    res.status(201).json({
      status: "success",
      data: {
        id: cartId,
        cart_type: "Cart",
        total_amount,
          discount_amount,
          final_amount,
        product: {
          product_id: product.id,
          name: product.name,
          sku: product.sku,
          quantity,
          price,
          discounted_price: discountedPrice,
          detail: product.detail,
          product_MRP: product.product_MRP,
          pricing_tiers: product.pricing_tiers,
          brand: product.brand,
          material: product.material,
          specification: product.specification,
          warranty: product.warranty,
          seller_details: seller[0]
        },
        buyer_details: buyer[0]
      }
    });

  } catch (err) {
    console.error("Error creating single-product cart:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};


//====================== GET ALL Cart ==========================================
export const getAllCarts = async (req, res) => {
  try {
    const pool = await connectDB();

    // Fetch all carts
    const [carts] = await pool.query(`SELECT * FROM buyer_cart ORDER BY id DESC`);

    let finalResult = [];

    for (const cart of carts) {
      // Cart products
      const [cartProducts] = await pool.query(
        `SELECT c.*, 
          p.name, p.sku, p.product_MRP, p.pricing_tiers, p.detail, p.brand, p.material,
          p.specification, p.warranty, p.status AS product_status,
          s.name AS seller_name, s.mobile AS seller_phone
         FROM cart_item c
         LEFT JOIN product p ON c.product_id = p.id
         LEFT JOIN seller s ON p.seller_id = s.id
         WHERE c.cart_id = ?`,
        [cart.id]
      );

      // Buyer details
      const [buyer] = await pool.query(
        `SELECT id AS buyer_id, name AS buyer_name, email AS buyer_email, mobile AS buyer_mobile
         FROM buyer WHERE id = ?`,
        [cart.buyer_id]
      );

      const formattedProducts = cartProducts.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        price: item.price,
        discounted_price: item.discounted_price,
        total_amount: item.total_amount,
        discount_amount: item.discount_amount,
        final_amount: item.final_amount,
        status: item.product_status,
        product_details: {
          id: item.product_id,
          name: item.name,
          sku: item.sku,
          detail: item.detail,
          product_MRP: item.product_MRP,
          pricing_tiers: item.pricing_tiers,
          brand: item.brand,
          material: item.material,
          specification: item.specification,
          warranty: item.warranty
        },
        seller_details: {
          seller_name: item.seller_name,
          seller_phone: item.seller_phone
        }
      }));

      finalResult.push({
        id: cart.id,
        cart_type: "Cart",
        created_at: cart.created_at,
        updated_at: cart.updated_at,
        products: formattedProducts,
        buyer_details: buyer[0]
      });
    }

    res.status(200).json({ status: "success", data: finalResult });

  } catch (err) {
    console.error("Error fetching carts:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ======================= UPDATE CART ===========================
export const updateCart = async (req, res) => {
  try {
    const pool = await connectDB();
    const { cart_id, products } = req.body;

    if (!cart_id || !products || products.length === 0) {
      return res.status(400).json({ message: "cart_id and products are required" });
    }

    // Check if cart exists
    const [existingCart] = await pool.query(
      `SELECT * FROM buyer_cart WHERE id = ?`,
      [cart_id]
    );

    if (existingCart.length === 0) {
      return res.status(404).json({ message: "Cart not found" });
    }

    // Loop through products for update
    for (const p of products) {
      const [prodData] = await pool.query(
        `SELECT id, product_MRP, pricing_tiers FROM product WHERE id = ?`,
        [p.product_id]
      );

      if (prodData.length === 0) {
        return res.status(400).json({ message: `Invalid product_id ${p.product_id}` });
      }

      const product = prodData[0];
      const quantity = p.quantity;

      // Parse first price tier
      let discountedPrice = Number(product.product_MRP);

      try {
        const tiers = JSON.parse(product.pricing_tiers);
        if (Array.isArray(tiers) && tiers.length > 0) {
          discountedPrice = Number(tiers[0].price);
        }
      } catch {}

      const price = Number(product.product_MRP);
      const total_amount = quantity * price;
      const final_amount = quantity * discountedPrice;
      const discount_amount = total_amount - final_amount;

      // Check if item already exists in cart
      const [existingItem] = await pool.query(
        `SELECT * FROM cart_item WHERE cart_id = ? AND product_id = ?`,
        [cart_id, product.id]
      );

      if (existingItem.length > 0) {
        // If quantity = 0 → delete item
        if (quantity === 0) {
          await pool.query(
            `DELETE FROM cart_item WHERE cart_id = ? AND product_id = ?`,
            [cart_id, product.id]
          );
        } else {
          // Update item
          await pool.query(
            `UPDATE cart_item SET 
              quantity = ?, 
              price = ?, 
              discounted_price = ?, 
              total_amount = ?, 
              discount_amount = ?, 
              final_amount = ?
             WHERE cart_id = ? AND product_id = ?`,
            [
              quantity,
              price,
              discountedPrice,
              total_amount,
              discount_amount,
              final_amount,
              cart_id,
              product.id
            ]
          );
        }
      } else {
        // Insert new product if not found
        await pool.query(
          `INSERT INTO cart_item 
            (cart_id, product_id, quantity, price, discounted_price, total_amount, discount_amount, final_amount)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            cart_id,
            product.id,
            quantity,
            price,
            discountedPrice,
            total_amount,
            discount_amount,
            final_amount
          ]
        );
      }
    }

    // Fetch updated cart data (same as createCart)
    const [cart] = await pool.query(
      `SELECT * FROM buyer_cart WHERE id = ?`,
      [cart_id]
    );

    const [cartProducts] = await pool.query(
      `SELECT c.*, 
        p.name, p.sku, p.product_MRP, p.pricing_tiers, p.detail, p.brand, p.material,
        p.specification, p.warranty, p.status AS product_status,
        s.name AS seller_name, s.mobile AS seller_phone
       FROM cart_item c
       LEFT JOIN product p ON c.product_id = p.id
       LEFT JOIN seller s ON p.seller_id = s.id
       WHERE c.cart_id = ?`,
      [cart_id]
    );

    const [buyer] = await pool.query(
      `SELECT id AS buyer_id, name AS buyer_name, email AS buyer_email, mobile AS buyer_mobile
       FROM buyer WHERE id = ?`,
      [existingCart[0].buyer_id]
    );

    const formattedProducts = cartProducts.map((item) => ({
      id: item.id,
      quantity: item.quantity,
      price: item.price,
      discounted_price: item.discounted_price,
      total_amount: item.total_amount,
      discount_amount: item.discount_amount,
      final_amount: item.final_amount,
      status: item.product_status,
      product_details: {
        id: item.product_id,
        name: item.name,
        sku: item.sku,
        detail: item.detail,
        product_MRP: item.product_MRP,
        pricing_tiers: item.pricing_tiers,
        brand: item.brand,
        material: item.material,
        specification: item.specification,
        warranty: item.warranty
      },
      seller_details: {
        seller_name: item.seller_name,
        seller_phone: item.seller_phone
      }
    }));

    return res.status(200).json({
      status: "success",
      message: "Cart updated successfully",
      data: {
        id: cart_id,
        cart_type: "Cart",
        created_at: cart[0].created_at,
        updated_at: cart[0].updated_at,
        products: formattedProducts,
        buyer_details: buyer[0]
      }
    });

  } catch (err) {
    console.error("Error updating cart:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

//======================GET CART BY ID ==========================

export const getCartById = async (req, res) => {
  try {
    const pool = await connectDB();
    const { id } = req.params;

    // Fetch cart
    const [cart] = await pool.query(
      `SELECT * FROM buyer_cart WHERE id = ?`, 
      [id]
    );

    if (cart.length === 0) {
      return res.status(404).json({ message: "Cart not found" });
    }

    // Fetch cart items (should be only one)
    const [cartItem] = await pool.query(
      `SELECT c.*, 
        p.name, p.sku, p.product_MRP, p.pricing_tiers, p.detail, p.brand, 
        p.material, p.specification, p.warranty, p.seller_id, p.status AS product_status,
        s.name AS seller_name, s.mobile AS seller_phone
       FROM cart_item c
       LEFT JOIN product p ON c.product_id = p.id
       LEFT JOIN seller s ON p.seller_id = s.id
       WHERE c.cart_id = ?
       LIMIT 1`,
      [id]
    );

    if (cartItem.length === 0) {
      return res.status(404).json({ message: "No product found in cart" });
    }

    const item = cartItem[0];

    // Fetch buyer
    const [buyer] = await pool.query(
      `SELECT id AS buyer_id, name AS buyer_name, email AS buyer_email, mobile AS buyer_mobile
       FROM buyer WHERE id = ?`,
      [item.buyer_id])

    // FINAL RESPONSE EXACTLY LIKE createCart
    res.status(200).json({
      status: "success",
      data: {
        id: cart[0].id,
        cart_type: "Cart",
        total_amount: item.total_amount,
        discount_amount: item.discount_amount,
        final_amount: item.final_amount,

        product: {
          product_id: item.product_id,
          name: item.name,
          sku: item.sku,
          quantity: item.quantity,
          price: item.price,
          discounted_price: item.discounted_price,
          detail: item.detail,
          product_MRP: item.product_MRP,
          pricing_tiers: item.pricing_tiers,
          brand: item.brand,
          material: item.material,
          specification: item.specification,
          warranty: item.warranty,
          seller_details: {
            seller_name: item.seller_name,
            seller_phone: item.seller_phone
          }
        },

        buyer_details: buyer[0]
      }
    });

  } catch (err) {
    console.error("Error fetching cart:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
/*
//=========================== GET CART BY ID======================================
export const getCartById = async (req, res) => {
  try {
    const pool = await connectDB();
    const { id } = req.params;

    const [cart] = await pool.query(`SELECT * FROM buyer_cart WHERE id = ?`, [id]);

    if (cart.length === 0) {
      return res.status(404).json({ message: "Cart not found" });
    }

    const [cartProducts] = await pool.query(
      `SELECT c.*, 
        p.name, p.sku, p.product_MRP, p.pricing_tiers, p.detail, p.brand, p.material,
        p.specification, p.warranty, p.status AS product_status,
        s.name AS seller_name, s.mobile AS seller_phone
       FROM cart_item c
       LEFT JOIN product p ON c.product_id = p.id
       LEFT JOIN seller s ON p.seller_id = s.id
       WHERE c.cart_id = ?`,
      [id]
    );

    const [buyer] = await pool.query(
      `SELECT id AS buyer_id, name AS buyer_name, email AS buyer_email, mobile AS buyer_mobile
       FROM buyer WHERE id = ?`,
      [cart[0].buyer_id]
    );

    const formattedProducts = cartProducts.map((item) => ({
      id: item.id,
      quantity: item.quantity,
      price: item.price,
      discounted_price: item.discounted_price,
      total_amount: item.total_amount,
      discount_amount: item.discount_amount,
      final_amount: item.final_amount,
      status: item.product_status,
      product_details: {
        id: item.product_id,
        name: item.name,
        sku: item.sku,
        detail: item.detail,
        product_MRP: item.product_MRP,
        pricing_tiers: item.pricing_tiers,
        brand: item.brand,
        material: item.material,
        specification: item.specification,
        warranty: item.warranty
      },
      seller_details: {
        seller_name: item.seller_name,
        seller_phone: item.seller_phone
      }
    }));

    res.status(200).json({
      status: "success",
      data: {
        id: cart[0].id,
        cart_type: "Cart",
        created_at: cart[0].created_at,
        updated_at: cart[0].updated_at,
        products: formattedProducts,
        buyer_details: buyer[0]
      }
    });

  } catch (err) {
    console.error("Error fetching cart:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

//=====================GET CART BY BUYER ID ===================================
export const getCartByBuyerId = async (req, res) => {
  try {
    const pool = await connectDB();
    const { buyer_id } = req.params;

    const [carts] = await pool.query(
      `SELECT * FROM buyer_cart WHERE buyer_id = ? ORDER BY id DESC`,
      [buyer_id]
    );

    if (carts.length === 0) {
      return res.status(404).json({ message: "No cart found for this buyer" });
    }

    let finalResult = [];

    for (const cart of carts) {
      const [cartProducts] = await pool.query(
        `SELECT c.*, 
          p.name, p.sku, p.product_MRP, p.pricing_tiers, p.detail, p.brand, p.material,
          p.specification, p.warranty, p.status AS product_status,
          s.name AS seller_name, s.mobile AS seller_phone
         FROM cart_item c
         LEFT JOIN product p ON c.product_id = p.id
         LEFT JOIN seller s ON p.seller_id = s.id
         WHERE c.cart_id = ?`,
        [cart.id]
      );

      const formattedProducts = cartProducts.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        price: item.price,
        discounted_price: item.discounted_price,
        total_amount: item.total_amount,
        discount_amount: item.discount_amount,
        final_amount: item.final_amount,
        status: item.product_status,
        product_details: {
          id: item.product_id,
          name: item.name,
          sku: item.sku,
          detail: item.detail,
          product_MRP: item.product_MRP,
          pricing_tiers: item.pricing_tiers,
          brand: item.brand,
          material: item.material,
          specification: item.specification,
          warranty: item.warranty
        },
        seller_details: {
          seller_name: item.seller_name,
          seller_phone: item.seller_phone
        }
      }));

      finalResult.push({
        id: cart.id,
        cart_type: "Cart",
        created_at: cart.created_at,
        updated_at: cart.updated_at,
        products: formattedProducts
      });
    }

    res.status(200).json({
      status: "success",
      data: finalResult
    });

  } catch (err) {
    console.error("Error fetching cart:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};


*/

/*export const getCartByBuyerId = async (req, res) => {
  try {
    const pool = await connectDB();
    const { buyer_id } = req.params;

    // Fetch all carts of that buyer
    const [carts] = await pool.query(
      `SELECT * FROM buyer_cart WHERE buyer_id = ? ORDER BY id DESC`,
      [buyer_id]
    );

    if (carts.length === 0) {
      return res.status(404).json({ message: "No cart found for this buyer" });
    }

    
    let finalResult = [];

    for (const cart of carts) {
      // Fetch ONLY ONE product item of that cart (LIMIT 1)
      const [cartProduct] = await pool.query(
        `SELECT c.*, 
          p.name, p.sku, p.product_MRP, p.pricing_tiers, p.detail, p.brand, p.material,
          p.specification, p.warranty, p.status AS product_status,
          s.name AS seller_name, s.mobile AS seller_phone
         FROM cart_item c
         LEFT JOIN product p ON c.product_id = p.id
         LEFT JOIN seller s ON p.seller_id = s.id
         WHERE c.cart_id = ?
         LIMIT 1`,
        [cart.id]
      );

      if (cartProduct.length === 0) continue;
        
        // Fetch buyer
    const [buyer] = await pool.query(
      `SELECT id AS buyer_id, name AS buyer_name, email AS buyer_email, mobile AS buyer_mobile
       FROM buyer WHERE id = ?`,
      [buyer_id]);
    
      const item = cartProduct[0];

      finalResult.push({
        id: cart.id,
        cart_type: "Cart",
        created_at: cart.created_at,
        updated_at: cart.updated_at,
          quantity: item.quantity,
          price: item.price,
          discounted_price: item.discounted_price,
          total_amount: item.total_amount,
          discount_amount: item.discount_amount,
          final_amount: item.final_amount,
          status: item.product_status,
          product_details: {
            id: item.product_id,
            name: item.name,
            sku: item.sku,
            detail: item.detail,
            product_MRP: item.product_MRP,
            pricing_tiers: item.pricing_tiers,
            brand: item.brand,
            material: item.material,
            specification: item.specification,
            warranty: item.warranty
          },
          seller_details: {
            seller_name: item.seller_name,
            seller_phone: item.seller_phone
          },
       buyer_details: buyer[0]
    });

    res.status(200).json({
      status: "success",
      data: finalResult
    });
}

  } catch (err) {
    console.error("Error fetching cart:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};*/

//=======get carts by buyer id========================================
export const getCartByBuyerId = async (req, res) => {
  try {
    const pool = await connectDB();
    const { buyer_id } = req.params;

    // Fetch all carts
    const [carts] = await pool.query(
      `SELECT * FROM buyer_cart WHERE buyer_id = ? ORDER BY id DESC`,
      [buyer_id]
    );

    if (!carts.length) {
      return res.status(404).json({ message: "No cart found for this buyer" });
    }

    // Fetch buyer details
    const [buyer] = await pool.query(
      `SELECT id AS buyer_id, name AS buyer_name, email AS buyer_email, mobile AS buyer_mobile
       FROM buyer WHERE id = ?`,
      [buyer_id]
    );

    const buyerDetails = buyer[0];
    let finalResult = [];

    for (const cart of carts) {

      // Fetch product (may be 0 rows)
      const [cartProduct] = await pool.query(
        `SELECT c.*, 
          p.name, p.sku, p.product_MRP, p.pricing_tiers, p.detail, p.brand, p.material,
          p.specification, p.warranty, p.status AS product_status,
          s.name AS seller_name, s.mobile AS seller_phone
         FROM cart_item c
         LEFT JOIN product p ON c.product_id = p.id
         LEFT JOIN seller s ON p.seller_id = s.id
         WHERE c.cart_id = ?
         LIMIT 1`,
        [cart.id]
      );

      let item = cartProduct[0] || null; // allow empty carts

      finalResult.push({
        id: cart.id,
        cart_type: "Cart",
        created_at: cart.created_at,
        updated_at: cart.updated_at,

        ...(item
          ? {
              quantity: item.quantity,
              price: item.price,
              discounted_price: item.discounted_price,
              total_amount: item.total_amount,
              discount_amount: item.discount_amount,
              final_amount: item.final_amount,
              status: item.product_status,

              product_details: {
                id: item.product_id,
                name: item.name,
                sku: item.sku,
                detail: item.detail,
                product_MRP: item.product_MRP,
                pricing_tiers: item.pricing_tiers,
                brand: item.brand,
                material: item.material,
                specification: item.specification,
                warranty: item.warranty
              },

              seller_details: {
                seller_name: item.seller_name,
                seller_phone: item.seller_phone
              }
            }
          : { product_details: null } // empty cart
        ),

        buyer_details: buyerDetails
      });
    }

    res.status(200).json({
      status: "success",
      data: finalResult
    });

  } catch (err) {
    console.error("Error fetching cart:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};


//=================delete cart by buyer id ================================


export const removeCartByBuyerId = async (req, res) => {
  try {
    const pool = await connectDB();
    const { buyer_id } = req.params;

    // 1️⃣ Get all cart IDs for buyer
    const [carts] = await pool.query(
      `SELECT id FROM buyer_cart WHERE buyer_id = ?`,
      [buyer_id]
    );

    if (carts.length === 0) {
      return res.status(404).json({ message: "Cart not found for this buyer" });
    }

    // Extract cart IDs
    const cartIds = carts.map(cart => cart.id);

    // 2️⃣ Delete all cart items
    await pool.query(
      `DELETE FROM cart_item WHERE cart_id IN (?)`,
      [cartIds]
    );

    // 3️⃣ Delete all carts
    await pool.query(
      `DELETE FROM buyer_cart WHERE id IN (?)`,
      [cartIds]
    );

    res.status(200).json({
      status: "success",
      message: "All carts and cart items deleted successfully"
    });

  } catch (err) {
    console.error("Error deleting cart:", err);
    res.status(500).json({
      message: "Server error",
      error: err.message
    });
  }
};




// ======================= DELETE CART ===========================
export const deleteCart = async (req, res) => {
  try {
    const pool = await connectDB();
    const { cart_id } = req.params;

    // Check if cart exists
    const [cart] = await pool.query(`SELECT * FROM buyer_cart WHERE id = ?`, [cart_id]);
    if (cart.length === 0) {
      return res.status(404).json({ message: "Cart not found" });
    }

    // Delete items first
    await pool.query(`DELETE FROM cart_item WHERE cart_id = ?`, [cart_id]);

    // Delete cart
    await pool.query(`DELETE FROM buyer_cart WHERE id = ?`, [cart_id]);

    res.status(200).json({
      status: "success",
      message: "Cart deleted successfully"
    });

  } catch (err) {
    console.error("Error deleting cart:", err);
    res.status(500).json({message: "Server error", error: err.message });
  }
};

//======================== remove from cart ====================================
export const removeCartItem = async (req, res) => {
  try {
    const pool = await connectDB();
    const { item_id } = req.params;

    // Check item exists
    const [item] = await pool.query(
      `SELECT cart_id FROM cart_item WHERE id = ?`,
      [item_id]
    );

    if (item.length === 0) {
      return res.status(404).json({ message: "Cart item not found" });
    }

    const cartId = item[0].cart_id;

    // Delete the item
    await pool.query(`DELETE FROM cart_item WHERE id = ?`, [item_id]);

    // Check remaining items
    const [remainingItems] = await pool.query(
      `SELECT COUNT(*) AS count FROM cart_item WHERE cart_id = ?`,
      [cartId]
    );

    if (remainingItems[0].count === 0) {
      await pool.query(`DELETE FROM buyer_cart WHERE id = ?`, [cartId]);
    }

    res.status(200).json({
      status: "success",
      message: "Item removed successfully"
    });

  } catch (err) {
    console.error("Error removing cart item:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};



