export const handler = async (event) => {
  const params = event.queryStringParameters || {};
  const success = String(params.success || "").toLowerCase() === "true";
  const txId = params.id || params.order || "";

  const location = success
    ? `/success?tx=${encodeURIComponent(txId)}`
    : `/checkout?status=failed`;

  return {
    statusCode: 302,
    headers: { Location: location, "Cache-Control": "no-store" },
    body: "",
  };
};