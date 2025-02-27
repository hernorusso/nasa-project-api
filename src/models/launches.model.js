const axios = require("axios");
const launchesDatabase = require("./launches.mongo");
const planets = require("./planets.mongo");

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

async function getAllLaunches(skip, limit) {
  return await launchesDatabase
    .find({}, { _id: 0, __v: 0 })
    .sort({ flightNumber: 1 })
    .skip(skip)
    .limit(limit);
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

  return latestFlightNumberLaunch.flightNumber;
}

module.exports = {
  abortLaunchById,
  existLaunchWithId,
  getAllLaunches,
  loadLaunchesData,
  scheduleNewLaunch,
};
