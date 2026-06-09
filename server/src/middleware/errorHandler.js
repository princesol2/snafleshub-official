const fieldLabels = {
  email: "email address",
  name: "store name",
  phone: "phone number",
  storeCode: "Store ID",
  vendorId: "vendor account",
  workPhone: "phone number",
};

const technicalErrorTypes = new Set(["MongoServerError", "MongooseServerSelectionError", "MongoNetworkError"]);

const sendError = (res, statusCode, code, title, message, details = undefined) => {
  res.status(statusCode).json({
    success: false,
    message,
    error: {
      code,
      title,
      message,
      details,
    },
  });
};

const errorHandler = (err, req, res, next) => {
  console.error(err);

  if (err.name === "ValidationError") {
    const details = Object.values(err.errors || {}).map((fieldError) => ({
      field: fieldError.path,
      message: fieldError.message,
    }));

    return sendError(
      res,
      400,
      "VALIDATION_ERROR",
      "Please review the highlighted details",
      "Some information is missing or does not match the required format.",
      details
    );
  }

  if (err.name === "CastError") {
    return sendError(
      res,
      400,
      "INVALID_REFERENCE",
      "This record could not be found",
      "One of the IDs sent with this request is not valid. Please refresh and try again."
    );
  }

  if (err.code === 11000) {
    const duplicateField = Object.keys(err.keyPattern || err.keyValue || {})[0] || "field";
    const duplicateLabel = fieldLabels[duplicateField] || duplicateField;

    return sendError(
      res,
      409,
      "DUPLICATE_RECORD",
      "This detail is already in use",
      `A store or vendor account already exists with this ${duplicateLabel}. Please use different details or log in instead.`,
      [{ field: duplicateField, message: `${duplicateLabel} is already in use.` }]
    );
  }

  if (technicalErrorTypes.has(err.name)) {
    return sendError(
      res,
      503,
      "DATABASE_UNAVAILABLE",
      "We could not save your changes",
      "The database service is unavailable right now. Please wait a moment and try again."
    );
  }

  const statusCode = err.statusCode || (res.statusCode && res.statusCode !== 200 ? res.statusCode : 500);

  if (statusCode >= 500) {
    return sendError(
      res,
      statusCode,
      "SERVER_ERROR",
      "Something went wrong on our side",
      "We could not complete this action right now. Please try again in a moment."
    );
  }

  return sendError(
    res,
    statusCode,
    "REQUEST_ERROR",
    "Something needs attention",
    err.message || "Please review the request and try again."
  );
};

module.exports = errorHandler;
