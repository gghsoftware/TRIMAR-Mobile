const db = require("../db");

// GET /api/bookings
// Returns an array (UI expects fields: customerName, phone, date, time, etc.)
exports.getBookings = async (req, res) => {
  try {
    const { phone, date } = req.query;

    // Base query + optional filters
    let sql = `
      SELECT
        id,
        name        AS customerName,
        phone,
        service,
        stylist,
        appt_date   AS date,
        appt_time   AS time,
        price,
        status,
        notes,
        created_at,
        updated_at
      FROM bookings
    `;
    const params = [];
    const where = [];
    if (phone) { where.push("phone = ?"); params.push(phone); }
    if (date)  { where.push("appt_date = ?"); params.push(date); }
    if (where.length) sql += " WHERE " + where.join(" AND ");
    sql += " ORDER BY created_at DESC, id DESC";

    const [rows] = await db.query(sql, params);
    res.json(rows); // <-- ARRAY, as the UI expects
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// POST /api/bookings
// Accepts customerName, phone, service?, stylist?, date, time, price?, notes?
exports.createBooking = async (req, res) => {
  try {
    const {
      customerName,
      phone,
      service = null,
      stylist = null,
      date,            // maps to appt_date
      time,            // maps to appt_time
      price = null,
      notes = null
    } = req.body || {};

    if (!customerName || !phone || !date || !time) {
      return res.status(400).json({ error: "customerName, phone, date, and time are required" });
    }

    // Optional conflict check: same stylist/date/time cannot double-book (pending/confirmed)
    if (stylist) {
      const [conflict] = await db.query(
        `SELECT id FROM bookings
         WHERE stylist = ? AND appt_date = ? AND appt_time = ? AND status IN ('pending','confirmed')
         LIMIT 1`,
        [stylist, date, time]
      );
      if (conflict.length) {
        return res.status(409).json({ error: "Time slot already booked." });
      }
    }

    // Insert using your actual column names
    const [result] = await db.query(
      `INSERT INTO bookings
        (name, phone, service, stylist, appt_date, appt_time, price, status, notes)
       VALUES (?,    ?,     ?,       ?,       ?,         ?,         ?,     ?,      ?)`,
      [customerName, phone, service, stylist, date, time, price, 'pending', notes]
    );

    // Respond in the shape the UI uses
    res.status(201).json({
      id: result.insertId,
      customerName,
      phone,
      service,
      stylist,
      date,
      time,
      price,
      status: 'pending',
      notes
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
