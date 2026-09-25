require("dotenv").config();

const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const fileUpload = require("express-fileupload");

const connectDB = require("./config/db");

const userRoute = require("./routes/user");
const videoRoute = require("./routes/video");
const commentRoute = require("./routes/comment");

const app = express();

// Connect to Database
connectDB();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(
    fileUpload({
        useTempFiles: true,
        tempFileDir: "/tmp/"
    })
);

// Routes
app.use("/user", userRoute);
app.use("/video", videoRoute);
app.use("/comment", commentRoute);

// Test Route
app.get("/", (req, res) => {
    res.send("YouTube API is running...");
});

// Export App
module.exports = app;