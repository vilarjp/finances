export function getApiErrorMessage(error: unknown, fallbackMessage = "Request failed.") {
  if (error instanceof Error && error.message.length > 0) {
    return error.message;
  }

  return fallbackMessage;
}
