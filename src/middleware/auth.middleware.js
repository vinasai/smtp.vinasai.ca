const allowedKeys = (process.env.SERVICE_API_KEYS || "")
  .split(",")
  .map((k) => k.trim());

const authenticateApiKey = (req, res, next) => {
  const apiKey = req.headers["x-api-key"];

  if (!apiKey) {
    return res.status(401).json({
      success: false,
      message: "Missing API key. Provide it in the x-api-key header.",
    });
  }

  if (!allowedKeys.includes(apiKey)) {
    return res.status(403).json({
      success: false,
      message: "Invalid API key.",
    });
  }

  next();
};

module.exports = { authenticateApiKey };
