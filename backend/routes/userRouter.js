import express from "express";
import multer from "multer";
import { registerUser,loginUser,getUserProfile,updateProfileImage } from "../controllers/userController.js";
import { protect } from "../controllers/authMiddleware.js";

const userRouter = express.Router();

const uploadMemory = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
const uploadDisk = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, uniqueSuffix + '-' + file.originalname);
    }
  }),
  limits: { fileSize: 10 * 1024 * 1024 }
});

userRouter.post("/register", registerUser);
userRouter.post("/login", loginUser);
userRouter.post("/profile", protect, getUserProfile);
userRouter.put('/update-profile-image', protect, uploadDisk.single('profileImage'), updateProfileImage);

export default userRouter;
