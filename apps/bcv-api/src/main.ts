import express from "express";
import type { NextFunction, Request, Response } from "express";
import { getBcvDollarExchangeRate } from "./get-bcv-dollar-exchange-rate.js";
import { sendHttpErrorResponse } from "./errors.js";
import morgan from "morgan";
import { getStatus, updateTrust } from "./trust-manager.js";

const app = express();
const PORT = Number(process.env.PORT);
const exchangeRatePath = "/exchange-rates/usd";

if (PORT == null || Number.isNaN(PORT)) {
  throw new Error("PORT environment variable is not set or is not a number.");
}

app.use(morgan("dev"));

const checkBcvTrust = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { isTrustValid, lastError } = getStatus();

    if (!isTrustValid) {
      throw lastError;
    }
    next();
  } catch (err: unknown) {
    sendHttpErrorResponse(err, req.path, res);
  }
};

app.get(exchangeRatePath, checkBcvTrust, async (_: Request, res: Response) => {
  try {
    const result = await getBcvDollarExchangeRate();
    res.status(200).json(result);
  } catch (err: unknown) {
    sendHttpErrorResponse(err, exchangeRatePath, res);
  }
});

updateTrust().then(({ success, error }) => {
  if (!success) {
    console.error("Trust update failed on startup:", error);
  }

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
})

