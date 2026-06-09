const fallbackError = {
  title: "Something needs attention",
  message: "We could not complete this action right now. Please review the details and try again.",
};

const technicalPatterns = [
  /mongo/i,
  /mongoose/i,
  /validationerror/i,
  /casterror/i,
  /duplicate key/i,
  /e11000/i,
  /internal server error/i,
  /network error/i,
];

function hasTechnicalLanguage(message) {
  return technicalPatterns.some((pattern) => pattern.test(String(message || "")));
}

export function normalizeApiError(error, fallback = fallbackError) {
  const responseError = error?.response?.data?.error;
  const responseMessage = error?.response?.data?.message;
  const status = error?.response?.status;

  if (!error?.response && error?.code === "ECONNABORTED") {
    return {
      title: "Request timed out",
      message: "The server is taking longer than expected. Please try again in a moment.",
    };
  }

  if (!error?.response) {
    return {
      title: "Connection unavailable",
      message: "We could not reach SnaflesHub services. Please check your connection and try again.",
    };
  }

  if (responseError?.title || responseError?.message) {
    return {
      title: responseError.title || fallback.title,
      message: responseError.message || responseMessage || fallback.message,
    };
  }

  if (status === 409) {
    return {
      title: "This record already exists",
      message: responseMessage || "Please use different account or store details and try again.",
    };
  }

  if (status >= 500 || hasTechnicalLanguage(responseMessage)) {
    return {
      title: "We could not save your changes",
      message: "A service issue prevented this action. Your entered details are still safe here; please try again shortly.",
    };
  }

  return {
    title: fallback.title,
    message: responseMessage || fallback.message,
  };
}

