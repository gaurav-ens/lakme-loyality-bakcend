import { apiMessages } from "./message";

export const errorHandler = (error) => {
  return {
    status: "error",
    message: error || apiMessages.errorOccurred,
    data: [],
  };
};
