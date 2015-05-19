var util = require("util");
var Entity = require('..').Entity;

function TestEntity() {
    Entity.call(this);
    this.dataRequired;
    this.dataBonus;
}
util.inherits(TestEntity, Entity);

module.exports = TestEntity;