export function validateClientCmdResult(result) {
  const JSONresult = JSON.parse(result.toString());
  if (JSONresult.ERROR_ID !== 0) {
    throw new Error(`clientCmd error: ${JSONresult.ERROR_DESCRIPTION}`);
  }
  return JSONresult;
}