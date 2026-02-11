import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { router } from "./routes/routes.js";
import { connectDB } from "./connection/db.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

app.use(cors({ origin: "*", credentials: true }));
app.use(express.json());
app.use("/uploads", express.static("uploads"));
app.use(router);

(async () => {
  await connectDB(); // connect before server starts
  app.listen(port, () => {
    console.log(`🚀 App running on port http://localhost:${port}`);
  });
})();
