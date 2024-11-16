import { useHelper } from "./index.js";
import { PrismaClient } from "@prisma/client";

async function validateLiquidity(prisma, liquidities, liquidityVariables, liveCandle, where = "") {
  // do stuff
}

export async function useLiquidity(prisma) {
  return {
    validateLiquidity: async (liquidities, liquidityVariables, liveCandle, where = "") => await validateLiquidity(prisma, liquidities, liquidityVariables, liveCandle, where),
  };
}