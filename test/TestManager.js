var util = require("util");
var validator = require('is-my-json-valid');
var EntityManager = require('..').EntityManager;
var TestEntity = require("./TestEntity");

function TestManager() {
    EntityManager.call(this);
}
util.inherits(TestManager, EntityManager);

TestManager.prototype.getEntityClass = function () {
    return TestEntity;
};

TestManager.prototype.getBucket = function () {
    return require('./TestBucket');
};

TestManager.prototype.type = 'test';

var schema = {
    type: "object",
    properties: {
        dataRequired: {
            type: "string"
        },
        dataBonus: {
            type: "integer"
        }
    },
    required: ["dataRequired"],
    additionalProperties: false
};
EntityManager.prototype.getValidate = function () {
    return validator(schema);
};

EntityManager.prototype.getFilter = function () {
    return validator.filter(schema);
};

module.exports = new TestManager();