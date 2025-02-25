const axios = require("axios");
const launchesDatabase = require("./launches.mongo");
const planets = require("./planets.mongo");

const launches = new Map();

const DEFAULT_FLIGHT_NUMBER = 100;

const launch = {
  flightNumber: 100, // flight_number
  mission: "Kepler Explorer X", // name
  rocket: "Explorer IS1", // rocket.name
  launchDate: new Date("December 27, 2030"), // date_local
  target: "Kepler-442 b", // not applicable
  customers: ["NASA", "ZTM"], // payload.customers for each payload
  upcoming: true, // upcoming
  success: true, // success
};

saveLaunch(launch);

const SPACEX_LAUNCH_API_URL = "https://api.spacexdata.com/v4/launches/query";

async function populateLaunches() {
  console.log("Downloading Launches from spaceX...");

  const response = await axios.post(SPACEX_LAUNCH_API_URL, {
    query: {},
    options: {
      pagination: false,
      populate: [
        {
          path: "rocket",
          select: {
            name: 1,
          },
        },
        {
          path: "payloads",
          select: {
            customers: 1,
          },
        },
      ],
    },
  });

  if (response.status !== 200) {
    console.log("Problem downloading launch data.");
    throw new Error("Launch data download failed");
  }

  const { docs } = response.data;

  for (const doc of docs) {
    const { payloads } = doc;
    const customers = payloads.flatMap((payload) => {
      return payload["customers"];
    });
    const launch = {
      flightNumber: doc["flight_number"],
      mission: doc["name"],
      rocket: doc["rocket"]["name"],
      launchDate: doc["date_local"],
      upcoming: doc["upcoming"],
      success: doc["success"],
      customers: customers,
    };

    await saveLaunch(launch);
  }

  console.log("spaceX Data download completed!");
}

async function loadLaunchesData() {
  const firstLaunch = await findLaunch({
    flightNumber: 1,
    mission: "FalconSat",
    rocket: "Falcon 1",
  });

  if (firstLaunch) {
    console.log("Launches already set in the DB");
    return;
  } else {
    populateLaunches();
  }
}

async function getAllLaunches() {
  return await launchesDatabase.find({}, { _id: 0, __v: 0 });
}

async function scheduleNewLaunch(launch) {
  const targetPlanet = await planets.findOne({
    keplerName: launch.target,
  });

  if (!targetPlanet) {
    throw new Error("Not matching planet found");
  }

  const latestFlightNumber = await getLatestFlightNumber();
  Object.assign(launch, {
    upcoming: true,
    success: true,
    customers: ["ZTM", "NASA"],
    flightNumber: latestFlightNumber + 1,
  });

  await saveLaunch(launch);
}

async function saveLaunch(launch) {
  await launchesDatabase.findOneAndUpdate(
    {
      flightNumber: launch.flightNumber,
    },
    launch,
    { upsert: true }
  );
}

async function findLaunch(filter) {
  return await launchesDatabase.findOne(filter);
}

async function existLaunchWithId(launchId) {
  return await findLaunch({ flightNumber: launchId });
}

async function abortLaunchById(launchId) {
  const aborted = await launchesDatabase.updateOne(
    { flightNumber: launchId },
    {
      upcoming: false,
      success: false,
    }
  );

  return aborted.acknowledged && aborted.modifiedCount;
}

async function getLatestFlightNumber() {
  const latestFlightNumberLaunch = await launchesDatabase
    .findOne()
    .sort("-flightNumber");
  if (!latestFlightNumberLaunch) {
    return DEFAULT_FLIGHT_NUMBER;
  }

  return latestFlightNumberLaunch.flightNumber;
}

module.exports = {
  abortLaunchById,
  existLaunchWithId,
  getAllLaunches,
  loadLaunchesData,
  scheduleNewLaunch,
};
