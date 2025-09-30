const express = require("express");
const { getBookings, createBooking } = require("../controllers/BookingController");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

// All booking routes now require authentication
router.get("/", authenticateToken, getBookings);
router.post("/", authenticateToken, createBooking);

module.exports = router;
