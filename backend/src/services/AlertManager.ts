import axios from 'axios';

export class AlertManager {
  public static async dispatch(payload: { symbol: string; type: string; score: number; message: string }) {
    console.log(`[ALERT] [${payload.type}] ${payload.symbol}: ${payload.message}`);

    if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
      const tgUrl = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`;
      const text = `🚨 *Stock Breakout Alert* 🚨\n\n*Symbol:* ${payload.symbol}\n*Event:* ${payload.type}\n*Score:* ${payload.score}\n*Details:* ${payload.message}`;
      try {
        await axios.post(tgUrl, { chat_id: process.env.TELEGRAM_CHAT_ID, text, parse_mode: 'Markdown' });
      } catch (err) {
        console.error("Telegram alert failed:", err);
      }
    }
  }
}