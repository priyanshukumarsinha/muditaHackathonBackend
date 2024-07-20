import {v2 as cloudinary} from 'cloudinary';
import fs from 'fs'
// fs : file system (comes with node_modules already installed)
// used to manage file
// Mainly what we need from here is filepath
// how fs works is :
//  - it links or unlinks files from fs

// cludinary configuration
const config = cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "dpwosfzhg", 
    api_key: process.env.CLOUDINARY_API_KEY || "518777628771669", 
    api_secret: process.env.CLOUDINARY_API_SECRET || "TgIkJXucvSGbloqPaeTabVDzjs4"
});

console.log(config);


// So first, we will upload the file to cloudinary, and then unlink file
const uploadOnCloudinary = async(localFilePath) => {
    try {
        if(!localFilePath) return null;
        // upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type : "auto",
        })

        console.log(response);
        // file has been uploaded successfully
        return response;
    } catch (error) {
        // remove the locally saved temporary file as the upload operation got failed
        console.log("Error in uploading file on cloudinary", error);
        return null;
    } finally{
        fs.unlink(localFilePath, () => {})
    }
}

// delete from cloudinary
const deleteFromCloudinary = async(fileName) => {
    try {
        if(!fileName) return null;
        const response = await cloudinary.api.delete_resources([fileName], { type: 'upload', resource_type: 'auto' })
        return response;
    } catch (error) {
        return null;
    }
}

export {uploadOnCloudinary, deleteFromCloudinary}

// const uploadResult = await cloudinary.uploader.upload("https://res.cloudinary.com/demo/image/upload/getting-started/shoes.jpg", {
//         public_id: "shoes"
//     }).catch((error)=>{console.log(error)});
    
//     console.log(uploadResult);

// files will come to us from filesystem : it will give us path of localfile i.e Server
// from server we will get a localfile path which we can use to upload file on cloudinary

// Now if the file is already uploaded on cloudinary, we don't need it to be on the server
// Hence, we will delete it from the server