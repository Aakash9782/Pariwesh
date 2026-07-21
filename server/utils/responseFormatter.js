/**
 * Standard utility for formatting API response payloads.
 */

export const sendResponse = (
  res,
  statusCode,
  success,
  message,
  data = null,
  meta = null,
) => {
  const responsePayload = {
    success,
    message,
    timestamp: new Date().toISOString(),
  };

  if (data !== null && data !== undefined) {
    responsePayload.data = data;
  }

  if (meta !== null && meta !== undefined) {
    responsePayload.meta = meta;
  }

  return res.status(statusCode).json(responsePayload);
};

export const sendSuccess = (
  res,
  message = "Success",
  data = null,
  statusCode = 200,
  meta = null,
) => {
  return sendResponse(res, statusCode, true, message, data, meta);
};

export const sendError = (
  res,
  message = "An error occurred",
  statusCode = 500,
) => {
  return sendResponse(res, statusCode, false, message);
};
