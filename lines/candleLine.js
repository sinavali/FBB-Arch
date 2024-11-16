import { useCandle, useHelper, useMicro } from "../composables/index.js";
import { processIsHighAndIsLow } from "../utils/processIsHighAndIsLow.js";
import { processFVG } from "../utils/processFVG.js";
import { processCOB, updateCOB } from "../utils/processCOB.js";
import { processMSS, updateMSS } from "../utils/processMSS.js";
// import { processDPHunter, updateDPHunter } from "../utils/processDPHunter.js";
// import { processDPProtected, updateDPProtected } from "../utils/processDPProtected.js";
import { processMicros } from "../utils/processMicros.js";
import { processLiquidity } from "../utils/processLiquidity.js";
import { processSignals } from "../utils/processSignals.js";
// import moment from "moment-timezone";

async function initCandleLine(prisma, model) {
  try {
    if (!model || !model.RATES.length || !model['SYMBOL'] || !model['TIMEFRAME']) throw new Error('data is crupted in initCandleLine function')

    const pair = model["SYMBOL"];
    const period = model["TIMEFRAME"];
    const candleComposable = await useCandle(prisma);
    const helperComposable = await useHelper(prisma);

    await candleComposable.processCandlesData(model);
    const newData = model;
    if (!newData || !newData.RATES.length) throw new Error('not enough candles in newData["RATES"] in initCandleLine function')

    const micro = await useMicro(prisma)
    const composables = { candleComposable, micro, helper: helperComposable };

    await initiationFlow(prisma, composables, pair, period, newData);
    const candle = await prisma.candle.findFirst({
      where: { pair, period },
      orderBy: { closeTime: "desc" }
    })
    await updatingFlow(prisma, candle);
    await afterAll(prisma);

    await prisma.$disconnect();
  } catch (error) {
    console.error(error);
    await prisma.$disconnect();
    return false;
  }
}

async function initiationFlow(prisma, composables, pair, period, newData) {
  const candle = await composables.candleComposable.addCandlesToDatabase(newData.RATES);

  if (!candle) return false;

  await processIsHighAndIsLow(prisma, pair, period);
  await processMicros(prisma, newData.RATES);
  await processLiquidity(prisma, pair, period, newData.RATES);
  await processFVG(prisma, pair, period);

  await processCOB(prisma, pair, period);
  await processMSS(prisma, newData.RATES[0]);
  // await processDPProtected(prisma, pair, period);
  // await processDPHunter(prisma, pair, period);
}

async function updatingFlow(prisma, candle) {
  await updateCOB(prisma, candle);
  await updateMSS(prisma, candle);
  // await updateDPHunter(prisma, candle);
  // await updateDPProtected(prisma, candle);
}

export default initCandleLine;