import { useCOB, useHelper, useLiquidity } from "../composables/index.js";

export async function processCOB(prisma, pair, period) {
  const cobComposable = await useCOB(prisma);
  const helperComposable = await useHelper(prisma);

  // fetch COB variables from setting table
  const cobVariables = await cobComposable.fetchCOBVariables();
  const signalVariables = await helperComposable.fetchSignalVariables();

  const candle = await prisma.candle.findFirst({
    where: { pair, period },
    orderBy: { closeTime: "desc" },
  });

  // check if there is a COB
  let COB = await cobComposable.isCOB([candle], cobVariables, signalVariables);

  if (!COB) return false;
  else return COB;
}