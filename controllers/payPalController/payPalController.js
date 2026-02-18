import paypal from "paypal-rest-sdk";

paypal.configure({
  mode: "sandbox", // change to 'live' for production
  client_id:
    "AaP1so9Kmdx7Dfd_sQHLbedoOYGqj0A9XNVUn8Hp18CgXdGzpax6kujg9Y9J8Jb4O16jFvaIDG-q5Z3v",
  client_secret:
    "EEAQvpBGFDzegeB_pfftnQRtSfSg7Y8iZRk3TOBG1kPYlM18uLsN3Y2d-M_WY0WpO7DV4Zw0oS0KVEsq",
});

// ======================= CREATE PAYMENT ==========================
export const createPayment = (req, res) => {
  const {
    items,
    total,
    currency = "USD",
    description = "Order Payment",
  } = req.body;

  const formattedItems = items.map((item) => ({
    name: item.name,
    sku: item.sku || "N/A",
    price: parseFloat(item.price).toFixed(2),
    currency: currency,
    quantity: item.quantity || 1,
  }));

  const create_payment_json = {
    intent: "sale",
    payer: { payment_method: "paypal" },
    redirect_urls: {
      return_url: `http://localhost:4000/paypal/success?total=${parseFloat(total).toFixed(2)}&currency=${currency}`,
      cancel_url: "http://localhost:4000/paypal/cancel",
    },
    transactions: [
      {
        item_list: { items: formattedItems },
        amount: {
          currency: currency,
          total: parseFloat(total).toFixed(2),
        },
        description: description,
      },
    ],
  };

  paypal.payment.create(create_payment_json, function (error, payment) {
    if (error) {
      console.error("Error creating payment:", error.response);
      res
        .status(500)
        .json({ message: "Payment creation failed", error: error.response });
    } else {
      for (let i = 0; i < payment.links.length; i++) {
        if (payment.links[i].rel === "approval_url") {
          res.status(200).json({
            payment_id: payment.id,
            approval_url: payment.links[i].href,
          });
        }
      }
    }
  });
};

// ======================= PAYMENT SUCCESS ==========================
export const paymentSuccess = (req, res) => {
  const { PayerID, paymentId, total, currency = "USD" } = req.query;

  const execute_payment_json = {
    payer_id: PayerID,
    transactions: [
      {
        amount: {
          currency: currency,
          total: parseFloat(total).toFixed(2),
        },
      },
    ],
  };

  paypal.payment.execute(
    paymentId,
    execute_payment_json,
    function (error, payment) {
      if (error) {
        console.error("Error executing payment:", error.response);
        res
          .status(500)
          .json({ message: "Payment execution failed", error: error.response });
      } else {
        res.status(200).json({
          status: "Payment Successful",
          transaction_id: payment.id,
          payer_name: `${payment.payer.payer_info.first_name} ${payment.payer.payer_info.last_name}`,
          payer_email: payment.payer.payer_info.email,
          amount: payment.transactions[0].amount.total,
          currency: payment.transactions[0].amount.currency,
          items: payment.transactions[0].item_list.items,
        });
      }
    },
  );
};

// ======================= PAYMENT CANCEL ==========================
export const paymentCancel = (req, res) => {
  res.status(200).json({ status: "Payment Cancelled" });
};
