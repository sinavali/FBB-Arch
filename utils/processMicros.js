import { useMicro } from "../composables/index.js";

export async function processMicros(prisma, candles) {
  try {
    if (candles.length) {
      const candle = await prisma.candle.findFirst({
        orderBy: { closeTime: "desc" },
        where: { pair: candles[0].pair, period: candles[0].period }
      });

      const liquidities = await prisma.liquidity.findMany({
        orderBy: { time: "desc" },
        where: {
          pair: candle.pair,
          mode: "ByMicro",
          hunted: false,
          failed: false,
          time: { lt: candle.closeTime }
        },
        include: {
          Used: {
            include: {
              DPUsed: { select: { id: true } },
              COBUsed: { select: { id: true } },
              MSSUsed: { select: { id: true } },
            }
          }
        }
      })

      const upLiquidities = liquidities.filter(l => l.direction === "up");
      const downLiquidities = liquidities.filter(l => l.direction === "down");

      upLiquidities.forEach(async l => {
        if (candle.high > l.price)
          await prisma.liquidity.update({
            where: { id: l.id },
            data: {
              hunted: true,
              huntPrice: candle.high,
              huntTime: candle.closeTime,
              hunterCandle: { connect: { id: candle.id } },
            }
          })
      })
      downLiquidities.forEach(async l => {
        if (candle.low < l.price)
          await prisma.liquidity.update({
            where: { id: l.id },
            data: {
              hunted: true,
              huntPrice: candle.low,
              huntTime: candle.closeTime,
              hunterCandle: { connect: { id: candle.id } },
            }
          })
      })
    }

    const microComposable = await useMicro(prisma);
    await microComposable.processMicro(candles);
  } catch (error) {
    console.error(error);
    return false;
  }
}