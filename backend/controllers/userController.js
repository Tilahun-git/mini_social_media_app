import bcrypt from "bcryptjs";
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import User from "../models/User.js";

export const registerUser = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      username,
      email,
      password,
      gender,
      birthDate,
    } = req.body;
    const parsedBirthDate = {
      day: parseInt(birthDate?.day),
      month: parseInt(birthDate?.month),
      year: parseInt(birthDate?.year),
    };
    const trimedEmail = email.trim().toLowerCase();
    if (
      !firstName ||
      !lastName ||
      !username ||
      !trimedEmail ||
      !password ||
      !gender ||
      !birthDate
    ) {
      return res.status(400).json({ error: "All fields are required" });
    }
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(409).json({ error: "Username already taken" });
    }
    const existingEmail = await User.findOne({ email: trimedEmail });
    if (existingEmail) {
      return res.status(409).json({ error: "Email already registered" });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const newUser = new User({
      firstName,
      lastName,
      username,
      email: trimedEmail,
      password: hashedPassword,
      gender,
      birthDate: parsedBirthDate,
    });
    await newUser.save();
    res.status(201).json({
      message: "Registration successful",
      username: newUser.username,
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

async function verifyPassword(plainPassword, hashedPassword) {
  return await bcrypt.compare(plainPassword, hashedPassword);
}

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid email or password" });
    }
    const isMatch = await verifyPassword(password, user.password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid email or password" });
    }
    generateToken(user._id, res);
    res.status(200).json({
      success: true,
      user: {
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Server error during login" });
  }
};

export const getUserProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    if(!userId){
      return res.status(401).json({error:'Unauthrized access'});
    }
    const user = await User.findById(userId).select('username profileImage _id firstName lastName');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({
      _id: user._id,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      profileImage: user.profileImage || null
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const updateProfileImage = async (req, res) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({ error: 'Unauthorized access' });
    }
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    if (user.profileImage && user.profileImage.startsWith('/uploads/')) {
      const filePath = path.join(process.cwd(), user.profileImage);
      fs.unlink(filePath, (err) => {});
    }
    user.profileImage = `/uploads/${req.file.filename}`;
    await user.save();
    res.json({ message: 'Profile image updated', profileImage: user.profileImage });
  } catch (err) {
    res.status(500).json({ error: 'Unable to update profile image', details: err.message });
  }
};

export const generateToken = (userId, res) => {
  const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
  res.cookie('jwt', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};
