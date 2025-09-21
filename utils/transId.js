import crypto from "crypto";
export function generateTransId(prefix = "TXN") {
  return `${prefix}_${Date.now()}_${crypto.randomInt(100000, 999999)}`;
}
