export interface TlsError {
  code: string;
  reason?: string;
}

export function isTlsError(err: unknown): err is Error & { cause: TlsError } {
  return (
    err instanceof Error &&
    'cause' in err &&
    typeof (err as any).cause === 'object' &&
    (err as any).cause !== null &&
    'code' in (err as any).cause &&
    // Códigos comunes de fallo en la cadena de confianza
    ['UNABLE_TO_VERIFY_LEAF_SIGNATURE', 'UNABLE_TO_GET_ISSUER_CERT_LOCALLY', 'CERT_HAS_EXPIRED', 'DEPTH_ZERO_SELF_SIGNED_CERT'].includes((err as any).cause.code)
  );
}
