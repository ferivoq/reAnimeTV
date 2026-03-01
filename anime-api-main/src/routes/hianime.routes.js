const express = require("express");
const hianimeViewController = require("../controllers/hianime.controllers.js");

const router = express.Router();

router.get("/view", hianimeViewController);

module.exports = router;
