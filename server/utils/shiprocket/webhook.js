/**
 * Verifies authenticity of incoming webhook webhook token
 */
export const verifyWebhookToken = (signature, secret) => {
  if (!secret) return true; // Bypass signature if no secret configured
  return signature === secret;
};
