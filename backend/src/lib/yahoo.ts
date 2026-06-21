import * as YahooModule from 'yahoo-finance2';

// yahoo-finance2 v3 exports the YahooFinance class as the module default.
const YahooFinance: any = (YahooModule as any).default;

// Single shared Yahoo Finance client for the whole backend.
// suppressNotices hides the survey/cookie console spam on startup.
// Exported as a named export (survives ESM/CJS interop more reliably than default).
export const yahoo = new YahooFinance({
  suppressNotices: ['yahooSurvey'],
});
