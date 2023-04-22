const express = require("express");
const ProductRouter = express.Router();
const { Product } = require("../models/product.model");
const { authentication } = require("../middlewares/authentication");
const { authorization } = require("../middlewares/authorization");

ProductRouter.get("/", async (req, res) => {
  try {
    const products = await Product.find();
    res.status(200).json({ products });
  } catch (error) {
    res.send({ msg: "Error in getting products", error: error.message });
  }
});

ProductRouter.post(
  "/add",
  authentication,
  authorization(["admin"]),
  async (req, res) => {
    try {
      const product = new Product(req.body);
      const result = await product.save();
      res.status(200).json({ msg: "Product Added Successfully", result });
    } catch (error) {
      res.send({ msg: "Error in adding product", error: error.message });
    }
  }
);

ProductRouter.patch(
  "/update/:id",
  authentication,
  authorization(["admin"]),
  async (req, res) => {
    try {
      const _id = req.params.id;
      const changes = req.body;
      const product = await Product.findByIdAndUpdate(
        _id,
        { $set: changes },
        { new: true }
      );
      res.status(200).json({ msg: "Product Updated Successfull", product });
    } catch (error) {
      res.send({ msg: "Error in updating product", error: error.message });
    }
  }
);

ProductRouter.delete(
  "/delete/:id",
  authentication,
  authorization(["admin"]),
  async (req, res) => {
    try {
      const _id = req.params.id;
      const product = await Product.findByIdAndDelete(_id);
      res.status(200).json({ msg: "Product Deleted Successfull", product });
    } catch (error) {
      res.send({ msg: "Error in deleting product", error: error.message });
    }
  }
);

ProductRouter.get("/:id", authentication, async (req, res) => {
  try {
    const _id = req.params.id;
    const product = await Product.findOne({ _id });
    if (!product) return res.status(404).json({ msg: "Product not found" });
    res.status(200).json({ product });
  } catch (error) {
    res.send({ msg: "Error in getting product", error: error.message });
  }
});

ProductRouter.patch("/addtocart", authentication, async (req, res) => {
  try {
    let userId = req.user._id;
    let { productid, Qty } = req.query;

    if (!Qty) Qty = 1;
    const isPresent = await Product.findOne({
      _id: productid,
      "users_cart.userId": userId,
      "users_cart.Qty" : Qty
    });

    if (isPresent) {
      return res.status(400).json({ msg: "Product already in cart" });
    }
    const product = await Product.updateOne(
      { _id: productid },
      { $push: { users_cart: { userId, Qty } } },
      { new: true }
    );

    res.status(200).json({ msg: "Product Added to cart Successfull" });
  } catch (error) {
    res.send({ msg: "Error in adding product to cart", error: error.message });
  }
});

ProductRouter.patch("/removefromcart", authentication, async (req, res) => {
  try {
    const userId = req.user._id;
    const { productid } = req.query;
    await Product.updateOne(
      { _id: productid },
      { $pull: { users_cart: { userId: userId } } }
    );
    res.status(200).json({ msg: "Product Removed form the cart" });
  } catch (error) {
    res.send({ msg: "Error in getting products", error: error.message });
  }
});

module.exports = { ProductRouter };
