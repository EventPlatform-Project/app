'use strict';

/**
 * Registers this Node.js service in the Netflix Eureka discovery-server, so
 * the Spring Cloud Gateway can reach us via `lb://notification-service`.
 *
 * If Eureka isn't reachable, we silently keep retrying in the background —
 * the HTTP server + SSE stream still work when the client hits us directly.
 */

const { Eureka } = require('eureka-js-client');

const DISABLED = String(process.env.EUREKA_DISABLED || 'false') === 'true';

const APP_NAME = 'NOTIFICATION-SERVICE'; // Eureka convention: upper-case
const APP_ID_LOWER = 'notification-service';

const HOST = process.env.EUREKA_HOST || 'localhost';
const PORT = parseInt(process.env.EUREKA_PORT, 10) || 8761;

const INSTANCE_HOST = process.env.EUREKA_INSTANCE_HOST || 'localhost';
const INSTANCE_IP = process.env.EUREKA_INSTANCE_IP || '127.0.0.1';

let client = null;

function start(servicePort) {
    if (DISABLED) {
        console.log('[eureka] disabled via EUREKA_DISABLED=true');
        return;
    }

    const instanceId = `${INSTANCE_HOST}:${APP_ID_LOWER}:${servicePort}`;

    client = new Eureka({
        instance: {
            instanceId,
            app: APP_NAME,
            hostName: INSTANCE_HOST,
            ipAddr: INSTANCE_IP,
            port: {
                $: servicePort,
                '@enabled': true,
            },
            vipAddress: APP_ID_LOWER,
            secureVipAddress: APP_ID_LOWER,
            statusPageUrl: `http://${INSTANCE_HOST}:${servicePort}/health`,
            healthCheckUrl: `http://${INSTANCE_HOST}:${servicePort}/health`,
            homePageUrl: `http://${INSTANCE_HOST}:${servicePort}/`,
            dataCenterInfo: {
                '@class': 'com.netflix.appinfo.InstanceInfo$DefaultDataCenterInfo',
                name: 'MyOwn',
            },
        },
        eureka: {
            host: HOST,
            port: PORT,
            servicePath: '/eureka/apps/',
            maxRetries: Number.MAX_SAFE_INTEGER,
            requestRetryDelay: 10_000,
            heartbeatInterval: 30_000,
            registryFetchInterval: 30_000,
        },
    });

    client.logger.level('warn');

    client.start((err) => {
        if (err) {
            console.warn(
                `[eureka] registration failed (${err.message}) — will keep retrying in the background`
            );
        } else {
            console.log(
                `[eureka] registered "${APP_NAME}" at ${INSTANCE_HOST}:${servicePort} with ${HOST}:${PORT}`
            );
        }
    });
}

function stop() {
    return new Promise((resolve) => {
        if (!client) return resolve();
        client.stop((err) => {
            if (err) {
                console.warn('[eureka] deregistration error:', err.message);
            } else {
                console.log('[eureka] deregistered cleanly');
            }
            resolve();
        });
    });
}

module.exports = { start, stop };
