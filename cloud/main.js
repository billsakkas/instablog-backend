const Parse = require("parse/node");
const sharp = require("sharp");

// Modify landmark cloud function
Parse.Cloud.define(
  "modifyLandmark",
  async (request) => {
    // Get the request parameters
    const { landmark, image } = request.params;

    // If there is an image, upload it and get the url
    const imageUrls = await uploadImage(image);

    // Create a new query for the Landmark class
    const Landmark = Parse.Object.extend("Landmark");
    const query = new Parse.Query(Landmark);

    // Check if the landmark id exists and its value is not "new"
    const landmarkIdExistsAndItsValueIsNotEqualToNew =
      landmark.id && landmark.id !== "new";

    // If the landmark id is not "new", add the id to the query
    if (landmarkIdExistsAndItsValueIsNotEqualToNew)
      query.equalTo("objectId", landmark.id);

    // If the landmark exists, get it. Otherwise, create a new one.
    const _landmark = landmarkIdExistsAndItsValueIsNotEqualToNew
      ? await query.first()
      : new Landmark();

    // Save the landmark with the new values
    const parseResponse = await saveLandmark(_landmark, landmark, imageUrls);

    // Return the result as a Landmark
    const newLandmark = {
      ...parseResponse.attributes,
      id: parseResponse.id,
    };

    console.log("Landmark successfully created/updated: ", newLandmark);

    return newLandmark;
  },
  {
    requireUser: true,
  }
);

// Helper functions start here
async function uploadImage(image) {
  // If there is no image, return an empty string
  if (!image) return { imageUrl: "", thumbnailUrl: "" };

  // Create a new Parse file from the provided image
  const parseFile = new Parse.File("photo_", { base64: image });

  // Save the file
  await parseFile.save({ useMasterKey: true });

  // Resize the image and save it in webp format
  const thumbnail = await resizeImage(parseFile.url());

  // Create a new Parse file from the thumbnail
  const parseThumbnail = new Parse.File("photo_thumb.webp", {
    base64: thumbnail,
  });

  // Save the thumbnail
  await parseThumbnail.save({ useMasterKey: true });

  // Return the url
  return { imageUrl: parseFile.url(), thumbnailUrl: parseThumbnail.url() };
}

async function resizeImage(uri) {
  // Get the full sized image from our server, and convert it to a buffer, so we can use it with sharp
  const res = await fetch(uri);
  const blob = await res.blob();
  const arrayBuffer = await blob.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const thumbnailBuffer = await sharp(buffer, {})
    .resize({
      width: parseInt(process.env.PHOTO_WIDTH),
      height: parseInt(process.env.PHOTO_HEIGHT),
    })
    .webp({ lossless: true })
    .toBuffer();

  const thumbnail = await thumbnailBuffer.toString("base64");
  console.log(thumbnail);
  return thumbnail;
}

async function saveLandmark(lm, landmarkData, imageUrls) {
  // Set the new values
  lm.set("title", landmarkData.title);
  lm.set("short_info", landmarkData.short_info);
  lm.set("description", landmarkData.description);
  lm.set("order", landmarkData.order);

  // Update the image, only if a new image file has been uploaded
  if (imageUrls.imageUrl !== "" && imageUrls.thumbnailUrl !== "") {
    lm.set("photo", imageUrls.imageUrl);
    lm.set("photo_thumb", imageUrls.thumbnailUrl);
  }

  // Save the changes
  const parseResponse = await lm.save(null, { useMasterKey: true });
  return parseResponse;
}
// Helper functions end here
