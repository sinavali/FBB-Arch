import moment from "moment-timezone";
import { useMSS, useHelper, useLiquidity } from "../composables/index.js";

// this function is processing isHigh or isLow for the candles[1]
export async function processMSS(prisma, candle) {
  try {
    const pair = candle.pair;
    const period = candle.period;
    const mssComposable = await useMSS(prisma);
    const helperComposable = await useHelper(prisma);

    // fetch mss variables from setting table
    const mssVariables = await mssComposable.fetchMSSVariables();

    const signalVariables = await helperComposable.fetchSignalVariables();

    // calculate needed candles count
    const minCandlesNeeded = 5;

    // will calcualte the amount of candle needed and fetch them
    const candles = await fetchCandles(prisma, pair, period)
    if (!candles || candles.length < minCandlesNeeded) return false;

    // check if there is a MSS
    await mssComposable.isMSS(candles, mssVariables, signalVariables);
  } catch (error) {
    console.error(error);
    return false;
  }
}