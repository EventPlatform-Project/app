'use strict';

const { Eureka } = require('eureka-js-client');
const { eureka, port } = require('./env');

let client = null;

function start() {
  if (!eureka.enabled) {
    console.log('[eureka] disabled (EUREKA_ENABLED=false)');
    return;
  }

  client = new Eureka({
    instance: {
      app: eureka.appName,
      instanceId: `${eureka.hostName}:${eureka.appName}:${port}`,
      hostName: eureka.hostName,
      ipAddr: eureka.ipAddr,
      port: { $: port, '@enabled': true },
      vipAddress: eureka.appName,
      dataCenterInfo: {
        '@class': 'com.netflix.appinfo.InstanceInfo$DefaultDataCenterInfo',
        name: 'MyOwn',
      },
      statusPageUrl: `http://${eureka.hostName}:${port}/health`,
      healthCheckUrl: `http://${eureka.hostName}:${port}/health`,
    },
    eureka: {
      host: eureka.host,
      port: eureka.port,
      servicePath: '/eureka/apps/',
      maxRetries: 10,
      requestRetryDelay: 3000,
    },
  });

  client.start((err) => {
    if (err) {
      console.error('[eureka] registration failed:', err.message);
    } else {
      console.log(`[eureka] registered as "${eureka.appName}" on ${eureka.host}:${eureka.port}`);
    }
  });
}

function stop() {
  if (client) {
    client.stop();
  }
}

module.exports = { start, stop };
