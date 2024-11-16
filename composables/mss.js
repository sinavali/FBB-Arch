import { useHelper, useLiquidity } from "./index.js";
import { PrismaClient } from "@prisma/client";

// check if there is any MSS pattern in these candles
async function isMSS(prisma, candles, variables, signalVariables) {
  // do stuff
}

export async function useMSS(prisma) {
  return {
    isMSS: async (candles, variables, signalVariables) => await isMSS(prisma, candles, variables, signalVariables),
  }
}
