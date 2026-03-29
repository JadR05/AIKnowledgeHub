import {config} from "dotenv";

// reads the .env file and populates the process.env
config({path: ".env"}); 

export const {PORT, DB_URI} = process.env;