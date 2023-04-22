const express = require("express");
const cookieParser = require("cookie-parser");
const app = express();
require("dotenv").config();
const { connection } = require("./config/db");
const cors = require("cors");
const { UserRouter } = require("./routes/user.routes");
const { ProductRouter } = require("./routes/product.routes");
app.use(cors());
app.use(express.json());
app.use(cookieParser());

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.use("/user", UserRouter);
app.use("/product", ProductRouter);

app.listen(process.env.PORT, async () => {
  try {
    await connection;
    console.log("Listening on port 3000");
  } catch (error) {
    console.log("Error connecting");
  }
});
