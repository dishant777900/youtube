const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cloudinary = require("../config/cloudinary");


// CREATE TOKEN
const createToken = (user) => {
  return jwt.sign(
    {
      _id: user._id,
      channelName: user.channelName,
      email: user.email,
    },
    process.env.SEC_KEY,
    {
      expiresIn: "365d",
    }
  );
};


// SIGNUP
const signup = async (req, res) => {
  try {
    const {
      channelName,
      email,
      password,
      description = "",
    } = req.body;

    if (!channelName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Channel name, email and password are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    const existingUser = await User.findOne({
      email: email.toLowerCase().trim(),
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email already registered",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      channelName: channelName.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      description: description.trim(),
    });

    const savedUser = await newUser.save();

    return res.status(201).json({
      success: true,
      message: "Account created successfully",

      user: {
        _id: savedUser._id,
        channelName: savedUser.channelName,
        email: savedUser.email,
        description: savedUser.description,
        profilePicUrl: savedUser.profilePicUrl,
        coverPicUrl: savedUser.coverPicUrl,
      },
    });
  } catch (err) {
    console.error("Signup error:", err);

    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};


// login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid password",
      });
    }

    const token = createToken(user);

    return res.status(200).json({
      success: true,
      message: "Login successful",

      data: {
        token: token,

        channelId: user._id,
        channelName: user.channelName,
        email: user.email,

        profilePicUrl: user.profilePicUrl,
        coverPicUrl: user.coverPicUrl,

        subscribersCount: user.subscribers.length,
        subscribedToCount: user.subscribedTo.length,
      },
    });
  } catch (err) {
    console.error("Login error:", err);

    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};


// get profile
const getProfile = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authorization token required",
      });
    }

    const tokenData = jwt.verify(token, process.env.SEC_KEY);

    const user = await User.findById(tokenData._id)
      .select("-password")
      .populate("subscribers", "channelName profilePicUrl")
      .populate("subscribedTo", "channelName profilePicUrl");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,

      data: {
        ...user._doc,
        subscribersCount: user.subscribers.length,
        subscribedToCount: user.subscribedTo.length,
      },
    });
  } catch (err) {
    console.error("Get profile error:", err);

    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }

    if (err.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token expired",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};


//subscribe
const subscribe = async (req, res) => {
  try {
    const channelId = req.params.channelId;

    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authorization token required",
      });
    }

    const tokenData = jwt.verify(token, process.env.SEC_KEY);

    const userId = tokenData._id;

    if (userId.toString() === channelId.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot subscribe to yourself",
      });
    }

    const channel = await User.findById(channelId);

    if (!channel) {
      return res.status(404).json({
        success: false,
        message: "Channel not found",
      });
    }

    const alreadySubscribed = channel.subscribers.some(
      (id) => id.toString() === userId.toString()
    );

    if (alreadySubscribed) {
      return res.status(400).json({
        success: false,
        message: "You already subscribed to this channel",
      });
    }

    channel.subscribers.push(userId);

    await channel.save();

    const user = await User.findById(userId);

    if (user) {
      const alreadyInSubscribedTo = user.subscribedTo.some(
        (id) => id.toString() === channelId.toString()
      );

      if (!alreadyInSubscribedTo) {
        user.subscribedTo.push(channel._id);
        await user.save();
      }
    }

    return res.status(200).json({
      success: true,
      message: "Subscribed successfully",

      subscribe: true,
      subscribersCount: channel.subscribers.length,
    });
  } catch (err) {
    console.error("Subscribe error:", err);

    if (
      err.name === "JsonWebTokenError" ||
      err.name === "TokenExpiredError"
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};


//unsubscribe
const unsubscribe = async (req, res) => {
  try {
    const channelId = req.params.channelId;

    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authorization token required",
      });
    }

    const tokenData = jwt.verify(token, process.env.SEC_KEY);

    const userId = tokenData._id;

    const channel = await User.findById(channelId);

    if (!channel) {
      return res.status(404).json({
        success: false,
        message: "Channel not found",
      });
    }

    const isSubscribed = channel.subscribers.some(
      (id) => id.toString() === userId.toString()
    );

    if (!isSubscribed) {
      return res.status(400).json({
        success: false,
        message: "You have not subscribed to this channel",
      });
    }

    channel.subscribers = channel.subscribers.filter(
      (id) => id.toString() !== userId.toString()
    );

    await channel.save();

    const user = await User.findById(userId);

    if (user) {
      user.subscribedTo = user.subscribedTo.filter(
        (id) => id.toString() !== channelId.toString()
      );

      await user.save();
    }

    return res.status(200).json({
      success: true,
      message: "Unsubscribed successfully",

      subscribe: false,
      subscribersCount: channel.subscribers.length,
    });
  } catch (err) {
    console.error("Unsubscribe error:", err);

    if (
      err.name === "JsonWebTokenError" ||
      err.name === "TokenExpiredError"
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};


//upload profile pic
const uploadProfile = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authorization token required",
      });
    }

    if (!req.files || !req.files.profile) {
      return res.status(400).json({
        success: false,
        message: "Profile image is required",
      });
    }

    const tokenData = jwt.verify(token, process.env.SEC_KEY);

    const user = await User.findById(tokenData._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.profilePicId) {
      await cloudinary.uploader.destroy(user.profilePicId);
    }

    const uploadedProfile = await cloudinary.uploader.upload(
      req.files.profile.tempFilePath,
      {
        folder: "sbstube/profile",
        resource_type: "image",
      }
    );

    user.profilePicUrl = uploadedProfile.secure_url;
    user.profilePicId = uploadedProfile.public_id;

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Profile picture updated successfully",

      profilePicUrl: user.profilePicUrl,
    });
  } catch (err) {
    console.error("Upload profile error:", err);

    return res.status(500).json({
      success: false,
      message: "Failed to upload profile picture",
      error: err.message,
    });
  }
};


// upload cover pic
const uploadCoverProfilePic = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authorization token required",
      });
    }

    if (!req.files || !req.files.coverPic) {
      return res.status(400).json({
        success: false,
        message: "Cover image is required",
      });
    }

    const tokenData = jwt.verify(token, process.env.SEC_KEY);

    const user = await User.findById(tokenData._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.coverPicId) {
      await cloudinary.uploader.destroy(user.coverPicId);
    }

    const uploadedCover = await cloudinary.uploader.upload(
      req.files.coverPic.tempFilePath,
      {
        folder: "sbstube/cover",
        resource_type: "image",
      }
    );

    user.coverPicUrl = uploadedCover.secure_url;
    user.coverPicId = uploadedCover.public_id;

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Cover picture updated successfully",

      coverPicUrl: user.coverPicUrl,
    });
  } catch (err) {
    console.error("Upload cover error:", err);

    return res.status(500).json({
      success: false,
      message: "Failed to upload cover picture",
      error: err.message,
    });
  }
};


module.exports = {
  signup,
  login,
  getProfile,
  subscribe,
  unsubscribe,
  uploadProfile,
  uploadCoverProfilePic,
};