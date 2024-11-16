// this function is processing isHigh or isLow for the candles[1]
export async function processSignals(prisma) {
  try {
    const DPSignals = await processDPSignals(prisma);
    const MSSSignals = await processMSSSignals(prisma);
    const COBSignals = await processCOBSignals(prisma);

  } catch (error) {
    console.error(error);
    return false;
  }
}

async function processDPSignals(prisma) {

}

async function processMSSSignals(prisma) {

}

async function processCOBSignals(prisma) {

}