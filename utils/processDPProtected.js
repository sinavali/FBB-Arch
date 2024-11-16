import { useDP, useHelper, useLiquidity } from "../composables/index.js";

// this function is processing isHigh or isLow for the candles[1]
export async function processDPProtected(prisma, pair, period) {
  try {
    const dpProtectedComposable = await useDP(prisma);
    const helperComposable = await useHelper(prisma);

    // fetch dp variables from setting table
    const dpVariables = await dpProtectedComposable.fetchDPVariables();

    const signalVariables = await helperComposable.fetchSignalVariables();

    // calculate needed candles count
    const minCandlesNeeded = 10;

    // will calcualte the amount of candle needed and fetch them
    const candles = await fetchCandles(prisma, pair, period)
    if (!candles || candles.length < minCandlesNeeded) return false;

    // check if there is a DPProtected
    let DPProtected = await dpProtectedComposable.isDPProtected(candles, dpVariables, signalVariables);
    if (!DPProtected) return false;

    // create a DPProtected in DPProtected table
    const created = await dpProtectedComposable.createDP(DPProtected, true);

    // validate the create process
    if (!created) throw new Error("an error occured in creating DPProtected in processDPProtected.");
    else return created;
  } catch (error) {
    console.error(error);
    return false;
  }
}
