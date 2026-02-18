const express = require("express");
const paypal = require("paypal-rest-sdk");
paypal.configure({
  mode: "sandbox", //sandbox or live
  client_id:
    "AaP1so9Kmdx7Dfd_sQHLbedoOYGqj0A9XNVUn8Hp18CgXdGzpax6kujg9Y9J8Jb4O16jFvaIDG-q5Z3v",
  client_secret:
    "EEAQvpBGFDzegeB_pfftnQRtSfSg7Y8iZRk3TOBG1kPYlM18uLsN3Y2d-M_WY0WpO7DV4Zw0oS0KVEsq",
});
const app = express();
app.get("/", (req, res) => res.sendFile(__dirname + "/index.html"));
app.listen(PORT, () => console.log(`Server Started on ${PORT}`));
