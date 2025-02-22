const mongoose = require("mongoose");

const MONGO_URL =
  "mongodb+srv://user:password@your.mongodb.you/nasa?retryWrites=true&w=majority&appName=Cluster0";

let connection;

mongoose.connection.once("open", () =>
  console.log("Mongo DB connection ready!")
);

mongoose.connection.on("error", (err) => {
  console.error(err);
});

async function mongoConnect() {
  await mongoose.connect(MONGO_URL);
}

async function mongoDisconnect() {
  await mongoose.connection.close();
}

module.exports = {
  mongoConnect,
  mongoDisconnect,
};
