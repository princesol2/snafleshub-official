const CafeStudySubmission = require("../models/CafeStudySubmission");
const asyncHandler = require("../utils/asyncHandler");

const maxArrayItems = 8;

const cleanText = (value, maxLength = 160) => String(value || "").trim().slice(0, maxLength);

const cleanList = (value) => {
  if (!Array.isArray(value)) {
    return [];
  }

  return [...new Set(value.map((item) => cleanText(item, 120)).filter(Boolean))].slice(0, maxArrayItems);
};

const createCafeStudySubmission = asyncHandler(async (req, res) => {
  const body = req.body || {};
  const requiredFields = ["cafeName", "ownerName", "phone", "area", "cafeType", "biggestChallenge", "topFeature", "monthlyPrice", "pilotInterest", "contactMethod"];
  const missingField = requiredFields.find((field) => !cleanText(body[field]));

  if (missingField) {
    return res.status(400).json({
      success: false,
      message: "Please complete the required survey details.",
      error: {
        code: "SURVEY_REQUIRED_FIELD",
        title: "Please review this step",
        message: "Some required survey details are missing.",
        details: [{ field: missingField, message: "This field is required." }],
      },
    });
  }

  const phoneDigits = cleanText(body.phone, 24).replace(/\D/g, "");

  if (phoneDigits.length < 10 || phoneDigits.length > 15) {
    return res.status(400).json({
      success: false,
      message: "Please enter a valid WhatsApp or phone number.",
      error: {
        code: "INVALID_PHONE",
        title: "Check the contact number",
        message: "The phone number should contain 10 to 15 digits.",
        details: [{ field: "phone", message: "Enter a valid contact number." }],
      },
    });
  }

  const submission = await CafeStudySubmission.create({
    cafeName: cleanText(body.cafeName, 120),
    ownerName: cleanText(body.ownerName, 120),
    phone: cleanText(body.phone, 24),
    area: cleanText(body.area, 160),
    cafeType: cleanText(body.cafeType, 80),
    customerSources: cleanList(body.customerSources),
    biggestChallenge: cleanText(body.biggestChallenge, 120),
    onlinePresence: cleanList(body.onlinePresence),
    usefulFeatures: cleanList(body.usefulFeatures),
    topFeature: cleanText(body.topFeature, 120),
    monthlyPrice: cleanText(body.monthlyPrice, 80),
    paymentComfort: cleanList(body.paymentComfort),
    pilotInterest: cleanText(body.pilotInterest, 80),
    contactMethod: cleanText(body.contactMethod, 80),
    comment: cleanText(body.comment, 800),
    pageVersion: cleanText(body.pageVersion, 40) || "cafe-study-v1",
    languageMode: cleanText(body.languageMode, 40) || "en-hi-inline",
  });

  res.status(201).json({
    success: true,
    message: "Thank you for your valuable advice.",
    data: {
      id: submission._id,
      createdAt: submission.createdAt,
    },
  });
});

module.exports = {
  createCafeStudySubmission,
};
