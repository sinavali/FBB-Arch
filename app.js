import createError from 'http-errors';
import express from 'express';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import indexRouter from './routes/index.js';
import usersRouter from './routes/users.js';
import initCandleDataStream from "./streams/candleDataStream.js";
import { handleCommandResult, handleData, fetchSystemVariables } from "./streams/candleDataStream.js";
import { fileURLToPath } from 'url';
import path from "path";
import fs from "fs/promises"; // use fs/promises for built-in async handling
import fsMain from "fs"; // use fs/promises for built-in async handling
import util from "util";
import { useHelper } from './composables/index.js';
import { PrismaClient } from '@prisma/client';
import initCandleLine from './lines/candleLine.js';
import Net from "net";
import mysql from "mysql2/promise";
import moment from 'moment';

let prisma = new PrismaClient();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Log handling
const log_file = fsMain.createWriteStream(`${__dirname}/logs/debug.log`, { flags: 'a' });
const error_file = fsMain.createWriteStream(`${__dirname}/logs/error.log`, { flags: 'a' });
const log_stdout = process.stdout;

global.logs = {
  data: {
    list: [],
    models: [],
    groupId: 1,
  },
  get: {
    groupId: () => global.logs.data.groupId,
    list: () => global.logs.data.list,
    models: () => global.logs.data.models,
  },
  set: {
    resetList: () => global.logs.data.list = [],
    resetModels: () => global.logs.data.models = [],
    groupId: () => {
      global.logs.data.lastGroupId = global.logs.data.lastGroupId + 1;
      return global.logs.data.lastGroupId;
    },
  },
  methods: {
    newLog: () => {

    },
    generateReport: () => {

    }
  }
}

console.rawLog = console.log;
console.rawError = console.error;

console.log = function (d) {
  log_file.write(util.format(d) + '\n');
  log_stdout.write(util.format(d) + '\n');
};
console.error = function (d) {
  error_file.write(util.format(d) + '\n');
  log_stdout.write(util.format(d) + '\n');
};
console.error = function (d) {
  error_file.write(util.format(d) + '\n');
  log_stdout.write(util.format(d) + '\n');
};


const systemVariables = await fetchSystemVariables(prisma);
const helper = await useHelper(prisma);
const isBackTestMode = helper.findVariableInVariables(systemVariables, "SystemBackTestMode").settingValueParsed;

// Use Net.Sockets for data and command communication
const clientCmd = new Net.Socket();
const clientData = new Net.Socket();

// Consolidating file operations
async function readJsonFile(path) {
  try {
    const fileContent = await fs.readFile(path, 'utf8');
    return JSON.parse(fileContent);
  } catch (err) {
    console.error(`Error reading file: ${path}`, err);
    return null;
  }
}

async function writeJsonFile(path, data) {
  try {
    await fs.writeFile(path, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error(`Error writing file: ${path}`, err);
  }
}

async function fileExists(path) {
  try {
    await fs.access(path);
    return true;
  } catch (err) {
    return false;
  }
}

async function resetTempFolder() {
  try {
    const files = await fs.readdir("./temp");
    const unlinkPromises = files.map(file => fs.unlink(path.join("./temp", file)));
    await Promise.all(unlinkPromises);
  } catch (err) {
    console.error("Error clearing temp folder:", err);
  }
}

const connection = await mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'fbb_test_candles',
});

/**
 * Fetches candles from the database in chunks and processes each candle.
 * 
 * @param {number} fromTimestamp - Start of the range in Unix timestamp (seconds).
 * @param {number} toTimestamp - End of the range in Unix timestamp (seconds).
 * @param {number} chunkSize - Number of records to fetch per chunk (default is 1000).
 */
async function fetchCandlesInChunks(fromTimestamp, toTimestamp, chunkSize = 10) {
  let start = new Date().getTime();
  const fromDate = moment.utc(fromTimestamp);
  const toDate = moment.utc(toTimestamp);

  let currentTimestamp = fromDate.unix();
  const toTime = toDate.unix();

  const [[NumberOfCandles]] = await connection.execute(`SELECT COUNT(id) AS NumberOfCandles FROM candles where closeTime > ${currentTimestamp} and closeTime < ${toTime};`);

  console.log(`total => ${NumberOfCandles.NumberOfCandles}`);
  let i = 1;

  while (true) {
    // Fetch a chunk of candles ordered by closeTime ASC

    const [candles] = await connection.execute(
      `SELECT * FROM forexcom
        WHERE closeTime BETWEEN ? AND ?
        ORDER BY closeTime ASC
        LIMIT ?`,
      [currentTimestamp, toTime, chunkSize]
    );

    // Break if no candles are fetched
    if (!candles || candles.length === 0) break;

    // Process each candle
    candles.sort((a, b) => a.closeTime - b.closeTime);
    for (const candle of candles) {
      start = new Date().getTime();
      await processCandles(candle);
      console.log(`${candles.length} [from:${fromDate.format("YYYY-MM-DD HH:mm")} ${fromDate.unix()}] [to:${toDate.format("YYYY-MM-DD HH:mm")} ${toTime}] [${NumberOfCandles.NumberOfCandles}/${i}] ${candle.id} ${candle.name} - ${moment.utc(candle.closeTime * 1000).tz("America/New_York").format("YYYY-MM-DD HH:mm")} - ${new Date().getTime() - start}`);
      i++;
    }

    // Update the currentTimestamp to fetch the next chunk
    currentTimestamp = candles[candles.length - 1].closeTime + 1;
  }
}

async function processCandles(candle) {
  await initCandleLine(prisma, {
    SYMBOL: candle.name,
    TIMEFRAME: candle.period,
    RATES: [{
      ...candle,
      pair: candle.name,
      direction: candle.open === candle.close ? "idle" : candle.open > candle.close ? "down" : "up",
      closeTime: candle.closeTime,
      TIME: moment.utc(candle.time, "YYYY-MM-DDTHH:mm").format("YYYY.MM.DD HH:mm:00"),
      OPEN: parseFloat(candle.open),
      HIGH: parseFloat(candle.high),
      LOW: parseFloat(candle.low),
      CLOSE: parseFloat(candle.close),
      REAL_VOLUME: 0,
      TICK_VOLUME: 0,
      SPREAD: 0,
      SYMBOL: candle.name,
      TIMEFRAME: candle.period,
    }]
  });
}

// YYYY-MM-DDTHH:mm
await fetchCandlesInChunks("2024-01-28T00:00", "2024-03-01T23:59", 100000);

if (false)
  if (isBackTestMode) {
    clientCmd.connect(77, "localhost");
    clientData.connect(78, "localhost");

    // Handle socket errors centrally
    [clientCmd, clientData].forEach(client => {
      client.on('error', err => console.error(`Socket error: ${err}`));
      client.on('timeout', () => console.error(`Socket timeout.`));
    });

    const systemTimeZone = "America/New_York"; // Default timezone for simplicity
    let brokerTimezone = await prisma.setting.findFirst({ where: { settingKey: "SystemBrokerTimezoneName" } })
    brokerTimezone = brokerTimezone.settingValue;

    // const fromDate = moment.tz(systemTimeZone).subtract(1, "weeks").startOf("week").tz(brokerTimezone).format("YYYY/MM/DD HH:mm:ss");
    // const toDate = moment.tz(systemTimeZone).tz(brokerTimezone).format("YYYY/MM/DD HH:mm:ss");

    // const fromDate = moment.tz("2024-06-30 16:50:00", systemTimeZone).tz(brokerTimezone).format("YYYY/MM/DD HH:mm:ss");
    // const toDate = moment.tz("2024-08-01 00:00:00", systemTimeZone).tz(brokerTimezone).format("YYYY/MM/DD HH:mm:ss");

    const fromDate = moment.tz("2024-10-13 15:50:00", systemTimeZone).tz(brokerTimezone).format("YYYY/MM/DD HH:mm:ss");
    const toDate = moment.tz("2024-10-17 15:50:00", systemTimeZone).tz(brokerTimezone).format("YYYY/MM/DD HH:mm:ss");
    // const toDate = moment.tz(systemTimeZone).tz(brokerTimezone).format("YYYY/MM/DD HH:mm:ss");

    // const fromDate = moment.tz(systemTimeZone).subtract(2, "days").startOf("day").tz(brokerTimezone).format("YYYY/MM/DD HH:mm:ss");
    // const toDate = moment.tz(systemTimeZone).tz(brokerTimezone).format("YYYY/MM/DD HH:mm:ss");

    // const fromDate = moment.tz(systemTimeZone).tz(brokerTimezone).subtract(1, "months").startOf("month").format("YYYY/MM/DD HH:mm:ss");
    // const toDate = moment.tz(systemTimeZone).tz(brokerTimezone).format("YYYY/MM/DD HH:mm:ss");

    // const fromDate = moment.tz("2024-09-16 16:50:00", systemTimeZone).tz(brokerTimezone).format("YYYY/MM/DD HH:mm:ss");
    // const toDate = moment.tz("2024-09-18 09:00:00", systemTimeZone).tz(brokerTimezone).format("YYYY/MM/DD HH:mm:ss");

    console.log(`TZ => ${brokerTimezone} - From ${fromDate} => To ${toDate}`);
    const currencies = await prisma.currency.findMany();

    currencies.forEach(c => {
      clientCmd.write(JSON.stringify({
        "MSG": "PRICE_HISTORY",
        "SYMBOL": c.name,
        "TIMEFRAME": "PERIOD_M1",
        "FROM_DATE": fromDate,
        "TO_DATE": toDate
      }) + '\r\n');
    });

    // Improved chunk data processing
    let data = '';
    clientCmd.on('data', async chunk => {
      data += chunk.toString().trim();

      if (data.endsWith('"}')) {
        try {
          const parsedData = JSON.parse(data);
          await handleParsedData(parsedData, brokerTimezone, currencies);
          data = ''; // reset buffer
        } catch (err) {
          console.error("Error parsing JSON:", err);
          process.exit(1);
        }
      }
    });
  } else await initCandleDataStream(prisma);

async function handleParsedData(parsedData, brokerTimezone, currencies) {
  if (parsedData.MSG === "PRICE_HISTORY") {
    const isDataFilePresent = await fileExists("./temp/data.json");
    if (isDataFilePresent) await resetTempFolder();

    const symbol = parsedData.SYMBOL;
    await writeJsonFile(`./temp/data_${symbol}.json`, parsedData);

    const allFiles = await fs.readdir("./temp");
    console.log(`File Count: ${allFiles.length}`);

    const allFilesExists = await Promise.all(currencies.map(c => fileExists(`./temp/data_${c.name}.json`)));
    if (allFilesExists.length === currencies.length) await processAllCandles(brokerTimezone, currencies);
  }
}

async function processAllCandles(brokerTimezone, currencies) {
  try {
    const fileData = await Promise.all(currencies.map(c => readJsonFile(`./temp/data_${c.name}.json`)));
    let allCandles = [];

    // Sort and process candles
    fileData.forEach((data, i) => {
      const symbolCandles = data.RATES.map(candle => ({
        ...candle,
        pair: currencies[i].name,
        SYMBOL: currencies[i].name,
        TIMEFRAME: data.TIMEFRAME,
        direction: candle.OPEN > candle.CLOSE ? "down" : "up",
        // closeTime: moment.tz(candle.TIME, 'YYYY.MM.DD HH.mm.ss', brokerTimezone).utc().unix(),
        closeTime: moment.tz(candle.time, 'YYYY.MM.DD HH.mm.ss', brokerTimezone).utc().unix(),
      }));

      allCandles = [...allCandles, ...symbolCandles];
    });

    console.log(`All Candles Count: ${allCandles.length}`);

    allCandles.sort((a, b) => a.closeTime - b.closeTime);
    await writeJsonFile('./temp/data.json', allCandles);

    // Initialize candle processing
    for (let i = 0; i < allCandles.length; i++) {
      let start = new Date().getTime();
      const candle = allCandles[i];

      await initCandleLine(prisma, {
        SYMBOL: candle.SYMBOL,
        TIMEFRAME: candle.TIMEFRAME,
        RATES: [candle]
      });

      let end = new Date().getTime();
      console.log(`${i} - Processed candle for ${candle.SYMBOL} at ${candle.TIME} -- ${start - end}`);
    }

    process.exit();
  } catch (err) {
    console.error("Error processing candles:", err);
  }
}

const app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

app.use(function (req, res, next) {
  next(createError(404));
});

app.use(function (err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  res.render('error');
});

export default app;