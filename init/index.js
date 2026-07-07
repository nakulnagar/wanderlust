require("dotenv").config();
const mongoose = require("mongoose");
const initData = require("./data.js");
const Listing = require("../models/listing.js");

const MONGO_URL = process.env.ATLASDB_URL;

main()
  .then(() => {
    console.log("connected to DB");
  })
  .catch((err) => {
    console.log(err);
  });

async function main() {
  await mongoose.connect(MONGO_URL);
}

const initDB = async () => {
  await Listing.deleteMany({});
  // initData.data = initData.data.map((obj) =>({...obj,owner:"696fdb1c3195ea25d8c30794"}));
  // await Listing.insertMany(initData.data);

  const defaultGeometry = {
    type: "Point",
    coordinates: [72.8777, 19.0760] // Mumbai
  };

  initData.data = initData.data.map((obj) => ({
    ...obj,
    owner: "6a4bda2ef4be4adc571a56c5",
    category: obj.category || "Trending",
    geometry: obj.geometry || defaultGeometry
  }));

  await Listing.insertMany(initData.data);


  console.log("data was initialized");

};

initDB();