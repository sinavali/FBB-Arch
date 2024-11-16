import moment from "moment-timezone";
import { useHelper, useLiquidity } from "../composables/index.js";

export async function processLiquidity(prisma, pair, period, newCandles) {
  if (!newCandles || !newCandles.length) return false;
  newCandles.sort((a, b) => b.closeTime - a.closeTime);

  await checkLiquidityFailure(prisma, newCandles.at(-1));
  await updateLiquidities(prisma, newCandles.at(-1));

  let micro = await prisma.timeMicro.findFirst({
    orderBy: { start: "desc" },
    where: { type: "Session" },
  })

  if (!micro || !micro.start || !micro.end) return false;

  const candles = await prisma.candle.findMany({
    where: {
      period, pair,
      closeTime: { gt: micro.start, lte: micro.end }
    },
    orderBy: { closeTime: "desc" }
  })

  if (!candles || !candles.length) return false;
  if (newCandles[0].closeTime !== micro.end) return false;

  console.log("start new liquidity");

  const microLiquidity = await getLiquiditiesByMicro(prisma, candles, micro);
  if (!microLiquidity || !microLiquidity.length) return false;
  else return true;
}
