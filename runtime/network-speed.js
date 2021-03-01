module.exports = {
    gprs: {
        offline: false,
        downloadThroughput: (50 * 1024) / 8,
        uploadThroughput: (20 * 1024) / 8,
        latency: 500
    },
    '2g': {
        offline: false,
        downloadThroughput: (450 * 1024) / 8,
        uploadThroughput: (150 * 1024) / 8,
        latency: 150
    },
    '3g': {
        offline: false,
        downloadThroughput: (1.5 * 1024 * 1024) / 8,
        uploadThroughput: (750 * 1024) / 8,
        latency: 40
    },
    '4g': {
        offline: false,
        downloadThroughput: (4 * 1024 * 1024) / 8,
        uploadThroughput: (3 * 1024 * 1024) / 8,
        latency: 20
    },
    dsl: {
        offline: false,
        downloadThroughput: (2 * 1024 * 1024) / 8,
        uploadThroughput: (1 * 1024 * 1024) / 8,
        latency: 5
    },
    wifi: {
        offline: false,
        downloadThroughput: (30 * 1024 * 1024) / 8,
        uploadThroughput: (15 * 1024 * 1024) / 8,
        latency: 2
    }
};
