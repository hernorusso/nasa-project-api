const { launches } = require("../../models/launches.model");

function getAllLaunches(req, res) {
  console.log(launches, launches.values(), Array.from(launches.values()));

  res.status(200).json(Array.from(launches.values()));
}

module.exports = {
  getAllLaunches,
};
