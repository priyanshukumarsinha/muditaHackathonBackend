// require('dotenv').config({path: './env'})
import dotenv from 'dotenv'

// code to connect to database (using mongoose and DB_NAME from constants.js)
import connectDB from "./db/index.js";

// import app from app.js
import app  from './app.js';

// Now, we need to config dotenv
dotenv.config({
    path : './.env'
})

// connectDB is an async function, so it will return a promise
// hence we can use .then and .catch here to handle the response and error
connectDB()
  .then(
    app.listen(process.env.PORT || 8000, () => {
      console.log(`Server is Running at Port ${process.env.PORT}`)
    })
  )
  .catch((error) => {
    console.log("MongoDB Connection Failed :: ", error)
  })


const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

export {app};