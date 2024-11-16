import { useFVG } from "../composables/index.js";

// this function is processing isHigh or isLow for the candles[1]
export async function processFVG(prisma, pair, period) {
  try {
    const fvgComposable = await useFVG(prisma);

    // will fetch 3 candles
    const candles = await fetchCandles(prisma, pair, period)

    // check if the length of candles is 3
    if (candles.length !== 3) return false;

    // check if it is a FVG
    let FVG = await fvgComposable.isFVG(candles);
    if (!FVG) return false;
  } catch (error) {
    console.error(error);
    return false;
  }
}