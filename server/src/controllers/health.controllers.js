import { getDBConnectionStatus } from '../database/db_config.js'

export async function checkHealth(request, response) {
    try {
        const dbConnectionStatus = getDBConnectionStatus();

        const healthStatus = {
            status: 'OK',
            timeStamp: new Date().toISOString(),
            services: {
                database: {
                    status: dbConnectionStatus.isConnected ? 'HEALTHY' : 'UNHEALTHY',
                    details: {
                        ...dbConnectionStatus,
                        readyState: getReadyStateText(dbConnectionStatus.readyState)
                    }
                },
                server: {
                    status: 'HEALTHY',
                    uptime: process.uptime(),
                    memoryUsage: process.memoryUsage()
                }
            }

        }


        // NOTE - Crafting of http status code
        const httpStatusCode = healthStatus.services.database.status === 'HEALTHY' ? 200 : 500;

        return response
            .status(httpStatusCode)
            .json(healthStatus)

    } catch (error) {
        console.log("Error checking health\n", error.message);

        return response
            .status(500)
            .json({
                success: false,
                status: 'ERROR',
                timeStamp: new Date().toISOString(),
                message: error.message
            })

    }

}



// NOTE - Utility function [Get ready state text]
function getReadyStateText(state) {
    switch (state) {
        case 0:
            return 'DISCONNECTED';
        case 1:
            return 'CONNECTED';
        case 2:
            return 'CONNECTING';
        case 3:
            return 'DISCONNECTING';

        default:
            return 'unknown';
    }
}