import mongoose from 'mongoose'

const MAX_RETRIES = 3;
const RETRY_INTERVAL = 5000; // 3 seconds



class DatabaseConnection {
    constructor() {
        this.retryCount = 0;
        this.isConnected = false;

        //NOTE - configure mongoose to use strict query
        mongoose.set('strictQuery', true);

        mongoose.connection.on('connected', () => {
            console.log("MONGODB Connected Successfully");

            this.isConnected = true;

        })

        mongoose.connection.on('error', () => {
            console.log("MONGODB Connection error");

            this.isConnected = false;
        })

        mongoose.connection.on('disconnected', () => {
            console.log("MONGODB Disconnected Successfully");

            // NOTE - Handle Disconnection: Attempt to reconnect
            this.handleDisconnection();
        })

        process.on('SIGTERM', this.handleAppTermination.bind(this));
    }


    // NOTE - Connect to MongoDB
    async connect() {
        try {
            if (!process.env.MONGODB_URL) {
                throw new Error("MONGODB_URL is not defined in .env file");
            }


            // NOTE - Configure Mongoose Connection Options
            const connectionOptions = {
                useNewUrlParser: true,
                useUnifiedTopology: true,
                maxPoolSize: 10,
                serverSelectionTimeoutMS: 5000, // 5 seconds
                socketTimeoutMS: 45000, // 45 seconds
                family: 4, // use IPv4
            }


            // NOTE - Check and Apply for mongoose .set to enable debug mode in development
            if (process.env.NODE_ENV === 'development') {
                mongoose.set('debug', true);
            }


            // NOTE - Connect to MongoDB
            await mongoose.connect(process.env.MONGO_URI, connectionOptions);

            this.retryCount = 0;    // NOTE - Reset retry count on successful connection

        } catch (error) {
            console.error(error.message);

            // NOTE - Handle Connection Errors
            await this.handleConnectionError();
        }
    }


    // NOTE - Handle Connection Errors
    async handleConnectionError() {

        // NOTE - Check if retry count is less than maximum retries
        if (this.retryCount < MAX_RETRIES) {
            this.retryCount++;
            console.log(`Retrying to connect to MongoDB...Attempt: {${this.retryCount}} of {${MAX_RETRIES}}`);

            await new Promise(resolve =>
                setTimeout(() => {
                    resolve
                }, RETRY_INTERVAL)
            )

            return this.connect();
        } else {
            console.log(`Failed to connect to MongoDB after ${MAX_RETRIES} attempts. Exiting...`);

            process.exit(1);
        }
    }



    // NOTE - Handle Disconnection
    async handleDisconnection() {
        if (!this.isConnected) {
            console.log("Attempting to reconnect to MongoDB...");

            this.connect();
        }
    }


    // NOTE - Handle App Termination
    async handleAppTermination() {
        try {
            await mongoose.connection.close();

            console.log("MONGODB connection closed through app termination...");

        } catch (error) {
            console.error(error.message || "Failed to close MONGODB connection");
            process.exit(1);
        }
    }



    // NOTE - Get Mongoose Connection Status
    getMongooseConnectionStatus() {
        return {
            isConnected: this.isConnected,
            readyState: mongoose.connection.readyState,
            retryCount: this.retryCount,
            host: mongoose.connection.host,
            name: mongoose.connection.name
        }
    }
}



// NOTE - Create One Singleton Instance
const dbConnection = new DatabaseConnection();

export default dbConnection.connect.bind(dbConnection)

export const getDBConnectionStatus = dbConnection.getMongooseConnectionStatus.bind(dbConnection)