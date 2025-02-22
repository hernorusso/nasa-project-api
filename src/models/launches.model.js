const launchesDatabase = require("./launches.mongo");
const planets = require("./planets.mongo");

const launches = new Map();

const DEFAULT_FLIGHT_NUMBER = 100;

const launch = {
  flightNumber: 100,
  mission: "Kepler Explorer X",
  rocket: "Explorer IS1",
  launchDate: new Date("December 27, 2030"),
  target: "Kepler-442 b",
  customers: ["NASA", "ZTM"],
  upcoming: true,
  success: true,
};

saveLaunch(launch);

async function getAllLaunches() {
  return await launchesDatabase.find({}, { _id: 0, __v: 0 });
}

async function scheduleNewLaunch(launch) {
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
  const targetPlanet = await planets.findOne({
    keplerName: launch.target,
  });

  if (!targetPlanet) {
    throw new Error("Not matching planet found");
  }

  await launchesDatabase.findOneAndUpdate(
    {
      flightNumber: launch.flightNumber,
    },
    launch,
    { upsert: true }
  );
}

async function existLaunchWithId(launchId) {
  return await launchesDatabase.findOne({ flightNumber: launchId });
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
  getAllLaunches,
  scheduleNewLaunch,
  existLaunchWithId,
  abortLaunchById,
};
