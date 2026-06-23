/**
 * Angel One SmartAPI client helpers (Phase 1).
 *
 * Thin wrapper around the `smartapi-javascript` SDK + `otplib` for the bits the
 * live hub needs: log in with an in-code TOTP, and create a feed WebSocket.
 * Validated end-to-end in Phase 0 (`npm run smartapi:check`).
 */
import { authenticator } from 'otplib';
// smartapi-javascript ships CommonJS; import the default then destructure.
import pkg from 'smartapi-javascript';
const { SmartAPI, WebSocketV2 } = pkg as any;

// SmartWebSocketV2 constants (from the SDK's config/constant.js).
export const EXCHANGE = { NSE: 1, BSE: 3 } as const; // nse_cm / bse_cm
export const MODE_LTP = 1;
export const ACTION_SUBSCRIBE = 1;
export const ACTION_UNSUBSCRIBE = 0;

export type ExchangeName = keyof typeof EXCHANGE;

export interface SmartSession {
  apiKey: string;
  clientCode: string;
  jwt: string;
  feedToken: string;
}

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var ${name} (see backend/.env.example)`);
  return v;
}

/**
 * Logs in to SmartAPI using API key + client code + PIN + a freshly generated
 * TOTP. Returns the tokens the feed WebSocket needs. Throws on failure.
 */
export async function login(): Promise<SmartSession> {
  const apiKey = requireEnv('SMARTAPI_API_KEY');
  const clientCode = requireEnv('SMARTAPI_CLIENT_CODE');
  const pin = requireEnv('SMARTAPI_PIN');
  const totpSecret = requireEnv('SMARTAPI_TOTP_SECRET');

  const totp = authenticator.generate(totpSecret);
  const smart = new SmartAPI({ api_key: apiKey });
  const session = await smart.generateSession(clientCode, pin, totp);

  if (!session?.status || !session?.data?.feedToken) {
    const reason = session?.message || session?.errorcode || JSON.stringify(session);
    throw new Error(`SmartAPI login failed: ${reason}`);
  }
  return {
    apiKey,
    clientCode,
    jwt: session.data.jwtToken,
    feedToken: session.data.feedToken,
  };
}

/** Creates (but does not connect) a feed WebSocket for the given session. */
export function createFeedSocket(s: SmartSession): any {
  return new WebSocketV2({
    jwttoken: s.jwt,
    apikey: s.apiKey,
    clientcode: s.clientCode,
    feedtype: s.feedToken,
  });
}
