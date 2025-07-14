export const attachProductAndRedirect = async (
  attach: (params: Record<string, unknown>) => Promise<{ data: unknown; error: unknown }>,
  params: Record<string, unknown>
) => {
  const res = await attach(params);
  if (res.error) {
    const errMsg = (res.error as { message?: string }).message ?? 'Unable to attach product';
    throw new Error(errMsg);
  }
  const checkoutUrl = (res.data as Record<string, unknown>)?.checkout_url as string | undefined;
  if (checkoutUrl) {
    // In browser environment perform redirect
    if (typeof window !== "undefined") {
      window.location.href = checkoutUrl;
    } else {
      // For server invocation, just return URL
      return checkoutUrl;
    }
  }
  return null;
}; 