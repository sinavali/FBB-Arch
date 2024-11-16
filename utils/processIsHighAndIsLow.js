// this function is processing isHigh or isLow for the candles[1]
export async function processIsHighAndIsLow(prisma, pair, period) {
  // will fetch 5 candles
  const candles = await fetchCandles(prisma, pair, period)

  // check if the length of candles is 5
  if (candles.length !== 5) return false;

  // check 5 candle high
  if (
    candles[0].high < candles[1].high &&
    candles[4].high < candles[3].high &&
    candles[1].high === candles[2].high &&
    candles[2].high === candles[3].high
  ) {
    await prisma.candle.updateMany({
      where: { id: { in: [candles[4].id, candles[3].id, candles[2].id] } },
      data: { isHigh: false }
    });
    await prisma.candle.update({
      where: { id: candles[1].id },
      data: { isHigh: true }
    });
    return true;
  }

  // check 4 candle high
  if (
    candles[0].high < candles[1].high &&
    candles[3].high < candles[2].high &&
    candles[1].high === candles[2].high
  ) {
    await prisma.candle.updateMany({
      where: { id: { in: [candles[3].id, candles[2].id] } },
      data: { isHigh: false }
    });
    await prisma.candle.update({
      where: { id: candles[1].id },
      data: { isHigh: true }
    });
    return true;
  }

  // check 3 candle high
  if (candles[0].high < candles[1].high && candles[1].high > candles[2].high) {
    await prisma.candle.update({
      where: { id: candles[2].id },
      data: { isHigh: false }
    });
    await prisma.candle.update({
      where: { id: candles[1].id },
      data: { isHigh: true }
    });
    return true;
  };


  // check 5 candle low
  if (
    candles[0].low > candles[1].low &&
    candles[4].low > candles[3].low &&
    candles[1].low === candles[2].low &&
    candles[2].low === candles[3].low
  ) {
    await prisma.candle.updateMany({
      where: { id: { in: [candles[4].id, candles[3].id, candles[2].id] } },
      data: { isLow: false }
    });
    await prisma.candle.update({
      where: { id: candles[1].id },
      data: { isLow: true }
    });
    return true;
  }

  // check 4 candle low
  if (
    candles[0].low > candles[1].low &&
    candles[3].low > candles[2].low &&
    candles[1].low === candles[2].low
  ) {
    await prisma.candle.updateMany({
      where: { id: { in: [candles[3].id, candles[2].id] } },
      data: { isLow: false }
    });
    await prisma.candle.update({
      where: { id: candles[1].id },
      data: { isLow: true }
    });
    return true;
  }

  // check 3 candle low
  if (candles[0].low > candles[1].low && candles[2].low > candles[1].low) {
    await prisma.candle.update({
      where: { id: candles[2].id },
      data: { isLow: false }
    });
    await prisma.candle.update({
      where: { id: candles[1].id },
      data: { isLow: true }
    });
    return true;
  };
}