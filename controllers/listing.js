const Listing = require("../models/listing");

// module.exports.index = async (req, res) => {
//   const allListings = await Listing.find({});
//   res.render("listings/index.ejs", { allListings });
// };

module.exports.index = async (req, res) => {
  const { category, q } = req.query;

  let query = {};

  // Category filter
  if (category) {
    query.category = category;
  }

  // Search filter
  if (q) {
    query.$or = [
      { title: { $regex: q, $options: "i" } },
      { location: { $regex: q, $options: "i" } },
      { country: { $regex: q, $options: "i" } },
      { category: { $regex: q, $options: "i" } },
    ];
  }

  const allListings = await Listing.find(query);
  res.render("listings/index.ejs", { allListings, q, category });
};



module.exports.renderNewForm = (req, res) => {
  res.render("listings/new.ejs");
};

module.exports.showListing = async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id)
    .populate({
      path: "reviews",
      populate: { path: "author" }
    })
    .populate("owner");
  if (!listing) {
    req.flash("error", "Listing you requested does not exist!");
    res.redirect("/listings");
  }
  res.render("listings/show.ejs", { listing });
};


module.exports.createListing = async (req, res) => {
  const newListing = new Listing(req.body.listing);

  // OpenStreetMap Geocoding
  const location = req.body.listing.location;

  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(location)}`,
    {
      headers: {
        "User-Agent": "Wanderlust/1.0",
        "Accept": "application/json",
      },
    }
  );
  
  if (!response.ok) {
    throw new Error("Location service unavailable");
  }
  
  const data = await response.json();

  if (data.length > 0) {
    newListing.geometry = {
      type: "Point",
      coordinates: [
        parseFloat(data[0].lon),
        parseFloat(data[0].lat),
      ],
    };
  }

  // Cloudinary image
  let url = req.file.path;
  let filename = req.file.filename;

  newListing.owner = req.user._id;
  newListing.image = { url, filename };

  await newListing.save();

  req.flash("success", "New Listing Created!");
  res.redirect("/listings");
};

module.exports.editListing = async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id);
  if (!listing) {
    req.flash("error", "Listing you requested does not exist!");
    res.redirect("/listings");
  }

  let originalImageUrl = listing.image.url;
  originalImageUrl = originalImageUrl.replace("/upload", "/upload/ w_250")
  res.render("listings/edit.ejs", { listing, originalImageUrl });
};


module.exports.updateListing = async (req, res) => {
  let { id } = req.params;

  // 1. Find listing first
  let listing = await Listing.findById(id);

  // 2. Update basic fields
  listing.title = req.body.listing.title;
  listing.description = req.body.listing.description;
  listing.price = req.body.listing.price;
  listing.country = req.body.listing.country;
  listing.location = req.body.listing.location;
  listing.category = req.body.listing.category;

  // 3. 🔥 Re-geocode if location changed
  if (req.body.listing.location) {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(req.body.listing.location)}`,
      {
        headers: {
          "User-Agent": "Wanderlust/1.0",
          "Accept": "application/json",
        },
      }
    );
    
    if (!response.ok) {
      throw new Error("Location service unavailable");
    }
    
    const data = await response.json();
    
    if (data.length > 0) {
      listing.geometry = {
        type: "Point",
        coordinates: [
          parseFloat(data[0].lon),
          parseFloat(data[0].lat),
        ],
      };
    }
  }

  // 4. Image update (if new image uploaded)
  if (typeof req.file !== "undefined") {
    let url = req.file.path;
    let filename = req.file.filename;
    listing.image = { url, filename };
  }

  // 5. Save everything
  await listing.save();

  req.flash("success", "Listing Updated!");
  res.redirect(`/listings/${id}`);
};



module.exports.destroyListing = async (req, res) => {
  let { id } = req.params;
  let deletedListing = await Listing.findByIdAndDelete(id);
  console.log(deletedListing);
  req.flash("success", "Listing Deleted!");
  res.redirect("/listings");
};