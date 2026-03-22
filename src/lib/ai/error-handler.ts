export const AI_ERROR_CODES = {
    CONNECTION: 'AI_CONNECTION_FAILED',
    TIMEOUT: 'AI_TIMEOUT_ERROR',
    QUOTA: 'AI_QUOTA_EXCEEDED',
    AUTH: 'AI_AUTH_ERROR',
    PERMISSION: 'AI_PERMISSION_DENIED',
    NOT_FOUND: 'AI_NOT_FOUND',
    SERVICE_UNAVAILABLE: 'AI_SERVICE_UNAVAILABLE',
    RESPONSE: 'AI_RESPONSE_ERROR',
    UNKNOWN: 'AI_UNKNOWN_ERROR',
};

/**
 * Standardizes various AI provider errors into our internal error codes.
 * Returns the error code or a descriptive string for unknown errors.
 */
export function mapAIError(error: unknown): string {
    if (!error) return AI_ERROR_CODES.UNKNOWN;
    
    // Original message for debugging/fallback
    const msg = error instanceof Error ? error.message : String(error);
    const msgLower = msg.toLowerCase();

    // 1. If it's already one of our error codes, return it directly
    for (const code of Object.values(AI_ERROR_CODES)) {
        if (msg === code || msg.startsWith(code + ':')) {
            return msg;
        }
    }

    // 2. Connection / Network errors (Common in China without proxy)
    if (
        msgLower.includes('fetch failed') ||
        msgLower.includes('network') ||
        msgLower.includes('connect') ||
        msgLower.includes('conn refused') ||
        msgLower.includes('conn reset') ||
        msgLower.includes('econn') ||
        msgLower.includes('etimedout') ||
        msgLower.includes('enotfound') ||
        msgLower.includes('socket hang up') ||
        msgLower.includes('proxy') ||
        msgLower.includes('tls') ||
        msgLower.includes('ssl') ||
        msgLower.includes('cert') ||
        msgLower.includes('dns')
    ) {
        return AI_ERROR_CODES.CONNECTION;
    }

    // 3. Timeout (Client or Server side)
    if (
        msgLower.includes('timeout') ||
        msgLower.includes('timed out') ||
        msgLower.includes('aborted') ||
        msgLower.includes('408')
    ) {
        return AI_ERROR_CODES.TIMEOUT;
    }

    // 4. Authentication / API Key
    if (
        msgLower.includes('api key') ||
        msgLower.includes('401') ||
        msgLower.includes('unauthorized') ||
        msgLower.includes('invalid key') ||
        msgLower.includes('auth')
    ) {
        return AI_ERROR_CODES.AUTH;
    }

    // 5. Quota / Rate limits
    if (
        msgLower.includes('429') ||
        msgLower.includes('quota') ||
        msgLower.includes('rate limit') ||
        msgLower.includes('too many') ||
        msgLower.includes('insufficient') ||
        msgLower.includes('exceeded') ||
        msgLower.includes('额度') ||
        msgLower.includes('配额')
    ) {
        return AI_ERROR_CODES.QUOTA;
    }

    // 6. Permission / Location restrictions (Common for Gemini/OpenAI)
    if (
        msgLower.includes('403') ||
        msgLower.includes('forbidden') ||
        msgLower.includes('permission') ||
        msgLower.includes('location is not supported') ||
        msgLower.includes('is not supported in your location') ||
        msgLower.includes('country') ||
        msgLower.includes('region')
    ) {
        return AI_ERROR_CODES.PERMISSION;
    }

    // 7. Not Found / Model missing
    if (
        msgLower.includes('404') ||
        msgLower.includes('not found') ||
        msgLower.includes('does not exist') ||
        msgLower.includes('no model') ||
        msgLower.includes('deployment')
    ) {
        return AI_ERROR_CODES.NOT_FOUND;
    }

    // 8. Service Unavailable / Overloaded (Backend scaling issues)
    if (
        msgLower.includes('500') ||
        msgLower.includes('502') ||
        msgLower.includes('503') ||
        msgLower.includes('504') ||
        msgLower.includes('overloaded') ||
        msgLower.includes('busy') ||
        msgLower.includes('unavailable') ||
        msgLower.includes('server error')
    ) {
        return AI_ERROR_CODES.SERVICE_UNAVAILABLE;
    }

    // 9. Data format / Parser issues
    if (
        msgLower.includes('invalid json') ||
        msgLower.includes('parse') ||
        msgLower.includes('xml') ||
        msgLower.includes('format') ||
        msgLower.includes('empty response') ||
        msgLower.includes('missing critical')
    ) {
        return AI_ERROR_CODES.RESPONSE;
    }

    // Fallback: Prefix with UNKNOWN: so frontend can display the raw message
    return `UNKNOWN: ${msg}`;
}
