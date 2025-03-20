export const responseHandler = (status, message, data = []) => {
  return {
    status,
    message,
    data,
  };
};
