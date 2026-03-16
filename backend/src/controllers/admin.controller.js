const jwt = require("jsonwebtoken");

const login = (req, res) => {
  const { pin } = req.body;

  if (!pin) {
    return res.status(400).json({ success: false, message: "PIN is required" });
  }

  if (pin !== process.env.ADMIN_PIN) {
    return res.status(401).json({ success: false, message: "Invalid PIN" });
  }

  const token = jwt.sign({ role: "admin" }, process.env.JWT_SECRET, {
    expiresIn: "8h",
  });

  return res.json({ success: true, token });
};

module.exports = { login };
