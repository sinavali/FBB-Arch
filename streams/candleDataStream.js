
import Net from "net";
import initCandleLine from "../lines/candleLine.js";
import { validateClientCmdResult } from "../validations/candle/candleDataStreamValidations.js";
import { useHelper } from "../composables/index.js";
import moment from "moment";

async function initCandleDataStream(prisma) {
  try {
    const currencies = await prisma.currency.findMany();
    const currenciesNames = currencies.map(c => c.name);
    const period = "PERIOD_M1";

    // Create sockets for clientCmd and clientData
    let clientCmd = createSocket();
    let clientData = createSocket();

    if (!clientCmd) throw new Error(`Socket error: Failed to init clientCmd`);
    if (!clientData) throw new Error(`Socket error: Failed to init clientData`);

    const helper = await useHelper(prisma);
    const systemVariables = await helper.fetchSystemVariables();
    const brokerTimezone = helper.findVariableInVariables(systemVariables, "SystemBrokerTimezoneName").settingValueParsed;

    // Connect and send command through port 77
    clientCmd = connectAndSendCommand(clientCmd, 77, generateMessageByAlgorithmModel(currenciesNames, period));
    clientCmd.on('data', chunk => handleCommandResult(chunk, clientCmd));

    // Connect to port 78 to get RATES data (actual data)
    clientData = connectAndGetData(clientData, 78, async chunk => await handleData(prisma, chunk), brokerTimezone);
  } catch (error) {
    console.error(error);
  }
}

function createSocket() {
  try {
    const socket = new Net.Socket();

    socket.on('error', (err) => { throw new Error(`Socket error: ${err}`) });
    socket.on('timeout', (err) => { throw new Error(`Socket timeout: ${err}`) });

    return socket;
  } catch (error) {
    console.error("createSocket failed", error);
    return false;
  }
}

export async function fetchSystemVariables(prisma) {
  const helper = await useHelper(prisma);

  let settings = await prisma.setting.findMany({
    where: { settingKey: { startsWith: 'System' } }
  })

  return helper.parseSettingsTypes(settings) ?? [];
}

function connectAndSendCommand(socket, port, message) {
  socket.connect(port, "localhost", () => socket.write(message));
  return socket;
}

export function handleCommandResult(chunk, clientCmd) {
  const validationResult = validateClientCmdResult(chunk);
  if (validationResult.error)
    throw new Error(`Command validation error: ${validationResult.message}`);
}

function connectAndGetData(socket, port, onData, brokerTimezone) {
  socket.connect(port, "localhost");
  socket.on('data', chunck => {
    let chunckString = chunck + "";
    const data = JSON.parse(chunckString);

    data.RATES.map(c => {
      return {
        ...c,
        "SYMBOL": c.SYMBOL,
        "TIMEFRAME": c.TIMEFRAME,
        closeTime: moment.tz(c["TIME"], 'YYYY.MM.DD HH.mm.ss', brokerTimezone).utc().unix()
      }
    })

    onData(data);
  });
  return socket;
}

export async function handleData(prisma, data) {
  try {
    await initCandleLine(prisma, data);
  } catch (error) {
    console.error(error);
  }
}

export function generateMessageByAlgorithmModel(currencies, period) {
  let messageObject = {
    'MSG': "TRACK_OHLC",
    'OHLC': currencies.map(c => ({
      'SYMBOL': c,
      'TIMEFRAME': period,
      'DEPTH': 1
    }))
  };

  return JSON.stringify(messageObject);
}

export function generateMessageForHistoricalData(currency, period, from, to) {
  const messageObject = {
    "MSG": "PRICE_HISTORY",
    "SYMBOL": currency,
    "TIMEFRAME": period,
    "FROM_DATE": from,
    "TO_DATE": to
  }

  return JSON.stringify(messageObject) + '\r\n';
}

export default initCandleDataStream;