# Mini Social Media App

A simple full-stack social media application where users can register, log in, create posts with images or videos, like, comment, edit, and delete their own posts. Built with Node.js, Express, MongoDB, and vanilla JavaScript

## Features

- User registration and login with password hashing
- Create, edit, and delete posts with image or video upload
- Like and comment on posts
- Real-time updates with Socket.io
- Profile image upload
- Responsive modern UI

## Project Structure

social-media-app/
  backend/
    controllers/
    models/
    public/
      createPost/
      home/
      login/
      register/
      ...
    routes/
    server.js
    package.json
    ...
  package.json
  README.md

## Prerequisites

- [Node.js](https://nodejs.org/) v16+ recommended
- [MongoDB](https://www.mongodb.com/) local or Atlas
- [npm](https://www.npmjs.com/)


## Backend Setup

1. **Install dependencies**
   ```bash
   cd backend
   npm install

2. **Environment Variables**

   Create a .env file in the backend/ directory with the following content

   MONGO_URI=your_mongodb_connection_string
   PORT=3000

   - Replace your_mongodb_connection_string with your actual MongoDB URI

3. **Start the backend server**
   ```bash
   npm start
   ```
   - The server will run on http://localhost:3000 by default


## Frontend Usage

- The frontend is served statically from the backend
- Open your browser and go to http://localhost:3000 to use the app

## Development

- For hot-reloading during backend development
  npm run server

  Uses nodemon



## File Uploads

- Uploaded images, videos, and profile pictures are stored in the backend/uploads/ directory
- You may need to create this directory if it does not exist

## Environment Variables

- MONGO_URI MongoDB connection string required
- PORT Port for the backend server default 3000



## Scripts

- npm start — Start the backend server
- npm run server — Start the backend server with nodemon for development


## Dependencies

- express
- mongoose
- bcryptjs
- jsonwebtoken
- multer
- socket.io
- dotenv
- cors


