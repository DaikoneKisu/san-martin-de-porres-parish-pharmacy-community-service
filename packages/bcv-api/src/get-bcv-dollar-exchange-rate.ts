import * as cheerio from "cheerio";
import { DateTime } from "luxon";
import { ApiError, ErrorCodes } from "./errors.js";
import { BCV_CAMBIO_OFICIAL_URL } from "./constants.js";
import { isTlsError } from "./guards.js";
import { bcvKy, updateTrust, getStatus, hasCaBundleLoaded } from "./trust-manager.js";

type CacheEntry = {
  currency: string;
  exchangeRate: number;
  valueDate: string;
  fetchedAt: Date;
};

let cache: CacheEntry | null = null;

const DEFAULT_TTL_MS = 4 * 60 * 60 * 1000; // 4 hours

export type ExchangeRateResult = {
  currency: string;
  exchangeRate: number;
  valueDate: string;
};

export async function getBcvDollarExchangeRate({
  forceRefresh = false,
  ttlMs = DEFAULT_TTL_MS,
  retry = false,
}: {
  forceRefresh?: boolean;
  ttlMs?: number;
  /** Internal flag — not for external use */
  retry?: boolean;
} = {}): Promise<ExchangeRateResult> {
  // Lazy trust initialization on first call
  if (!hasCaBundleLoaded()) {
    const result = await updateTrust();
    if (!result.success) {
      throw (
        result.error ??
        new ApiError("Trust update failed on initialization.", ErrorCodes.UNKNOWN_ERROR)
      );
    }
  }

  const { isTrustValid, lastError } = getStatus();
  if (!isTrustValid) {
    throw (
      lastError ??
      new ApiError("BCV certificate trust is invalid.", ErrorCodes.FINGERPRINT_UNAUTHORIZED_ERROR)
    );
  }

  // Return cached result if still fresh
  if (!forceRefresh && cache !== null && Date.now() - cache.fetchedAt.getTime() < ttlMs) {
    const { fetchedAt: _ignored, ...rest } = cache;
    return rest;
  }

  try {
    let data: string;
    let $: cheerio.CheerioAPI;

    try {
      data = await bcvKy(BCV_CAMBIO_OFICIAL_URL).text();
      $ = cheerio.load(data);
    } catch (err: unknown) {
      if (isTlsError(err) && !retry) {
        const recovery = await updateTrust(true);
        if (recovery.success) {
          return getBcvDollarExchangeRate({ forceRefresh, ttlMs, retry: true });
        }
      }
      throw new ApiError("Failed to fetch data from BCV.", ErrorCodes.BCV_FETCH_ERROR, err);
    }

    const currency = "USD";

    const dollarText = $("body #dolar").text().replace(/\s+/g, " ");
    const usdMatch = dollarText.match(new RegExp(String.raw`${currency} ([\d,.]+)`));
    const exchangeRateAsString = usdMatch?.[1]?.replace(/,/g, ".");

    if (usdMatch == null || exchangeRateAsString == null) {
      throw new ApiError(
        `Could not find ${currency} exchange rate on the BCV page.`,
        ErrorCodes.BCV_PARSE_ERROR,
      );
    }

    const exchangeRate = Number(exchangeRateAsString);

    const dateMatch = $("body")
      .text()
      .match(/Fecha Valor:\s*([A-Za-zéÉáÁ]+,?\s*\d{2}\s*[A-Za-z]+\s*\d{4})/);
    const rawDate = dateMatch?.[1]?.replace(/,/g, "").replace(/\s+/g, " ");

    if (dateMatch == null || rawDate == null) {
      throw new ApiError("Could not find value date on the BCV page.", ErrorCodes.BCV_PARSE_ERROR);
    }

    const dt = DateTime.fromFormat(rawDate, "EEEE dd MMMM yyyy", {
      locale: "es",
      zone: "America/Caracas",
    });

    if (!dt.isValid) {
      throw new ApiError(
        "Invalid value date format.",
        ErrorCodes.BCV_PARSE_ERROR,
        new Error(`Invalid DateTime: ${dt.invalidReason}: ${dt.invalidExplanation}`),
      );
    }

    const valueDate = dt.toISODate()!;

    cache = { currency, exchangeRate, valueDate, fetchedAt: new Date() };

    return { currency, exchangeRate, valueDate };
  } catch (err: unknown) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(
      "Unknown error occurred while fetching BCV data.",
      ErrorCodes.UNKNOWN_ERROR,
      err,
    );
  }
}
