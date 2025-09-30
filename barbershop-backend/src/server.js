require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const bookingRoutes = require("./routes/bookings");
const authRoutes = require("./routes/auth");

app.use("/api/bookings", bookingRoutes);
app.use("/api/auth", authRoutes);

const PORT = process.env.PORT || 6000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
