var couchbase = require('couchbase').Mock;
var cluster = new couchbase.Cluster();
var bucket = cluster.openBucket();

module.exports = bucket;