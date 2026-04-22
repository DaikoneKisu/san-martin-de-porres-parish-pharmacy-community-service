import ky from "ky";
import * as cheerio from "cheerio";
import { ApiError, ErrorCodes } from "./errors.js";
import { BCV_CAMBIO_OFICIAL_URL } from "./constants.js";
import { isTlsError } from "./guards.js";
import { updateTrust } from "./trust-manager.js";

/**
 * Scrapes the USD exchange rate and value date from BCV's Cambio Oficial page.
 * @param {Object} options
 * @param {boolean} options.retry - Internal flag for retrying after trust update (not for external use)
 * @returns {Promise<{currency: string, exchangeRate: string, valueDate: string}>}
 */
export async function getBcvDollarExchangeRate({ retry }: { retry?: boolean } = {}) {
  try {
    let data: string;
    let $: cheerio.CheerioAPI;

    try {
      data = await ky(BCV_CAMBIO_OFICIAL_URL).text();
      $ = cheerio.load(data);
    } catch (err: unknown) {
      if (isTlsError(err) && retry) {
        const recovery = await updateTrust(true);
        if (recovery.success) {
          return getBcvDollarExchangeRate({ retry: false }); // Reintento único
        }
      }
      throw new ApiError("Failed to fetch data from BCV.", ErrorCodes.BCV_FETCH_ERROR, err);
    }

    let currency = "USD";
    let exchangeRate: number;
    let valueDate: string;

    // Try to find the USD rate by searching for the text "USD" and its value
    const dollarElementSelector = "body #dolar";
    const dollarText = $(dollarElementSelector).text().replace(/\s+/g, ' ');
    const usdMatch = dollarText.match(new RegExp(String.raw`${currency} ([\d,.]+)`));
    const exchangeRateAsString = usdMatch?.[1]?.replace(/,/g, '.')

    if (usdMatch == null || exchangeRateAsString == null) {
      throw new ApiError(`Could not find ${currency} exchange rate on the BCV page.`, ErrorCodes.BCV_PARSE_ERROR);
    }

    exchangeRate = Number(exchangeRateAsString);

    // Find the value date by searching for "Fecha Valor:"
    const dateMatch = $("body").text().match(/Fecha Valor:\s*([A-Za-zéÉáÁ]+,?\s*\d{2}\s*[A-Za-z]+\s*\d{4})/);
    const unformattedValueDate = dateMatch?.[1]?.replace(/\s+/g, ' ');

    if (dateMatch == null || unformattedValueDate == null) {
      throw new ApiError("Could not find value date on the BCV page.", ErrorCodes.BCV_PARSE_ERROR);
    }

    valueDate = new Date(unformattedValueDate).toISOString();

    return { currency, exchangeRate, valueDate };
  } catch (err: unknown) {
    if (err instanceof ApiError) {
      throw new ApiError(err.message, err.code, err);
    }
    throw new ApiError("Unknown error occurred while fetching BCV data.", ErrorCodes.UNKNOWN_ERROR, err);
  }
}
