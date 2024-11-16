import { useDP, useHelper, useLiquidity } from "../composables/index.js";

// this function is processing isHigh or isLow for the candles[1]
export async function processDPHunter(prisma, pair, period) {
  try {
    const dpHunterComposable = await useDP(prisma);
    const helperComposable = await useHelper(prisma);

    // fetch dp variables from setting table
    const dpVariables = await dpHunterComposable.fetchDPVariables();
    const signalVariables = await helperComposable.fetchSignalVariables();

    // calculate needed candles count
    const minCandlesNeeded = 10;

    // will calcualte the amount of candle needed and fetch them
    const candles = await fetchCandles(prisma, pair, period)
    if (!candles || candles.length < minCandlesNeeded) return false;

    // check if there is a DPHunter
    let DPHunter = await dpHunterComposable.isDPHunter(candles, dpVariables, signalVariables);
    if (!DPHunter) return false;

    // create a DPHunter in DPHunter table
    const created = await dpHunterComposable.createDP(DPHunter);

    // validate the create process
    if (!created) throw new Error("an error occured in creating DPHunter in processDPHunter.");
    else return created;
  } catch (error) {
    console.error(error);
    return false;
  }
}