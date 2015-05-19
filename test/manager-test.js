var assert = require('assert');
var couchbase = require('couchbase');

var TestManager = require('./TestManager');
var TestEntity = require('./TestEntity');

describe('EntityManager', function () {

    describe('#create()', function () {
        it('should return TestEntity', function () {
            var entity = TestManager.create();
            assert(entity instanceof TestEntity, 'New entity must be instance of TestEntity');
            assert.strictEqual(0, entity.uid, 'Default UID must be 0');
        });
    });
    describe('#insert()', function () {
        it('should insert without error', function (done) {
            var entity = TestManager.create();
            entity.dataRequired = 'Test string data';
            TestManager.insert(entity, function (err, result) {
                assert.ifError(err);
                assert.strictEqual(entity, result);
                assert.notEqual(entity.uid, 0, 'UID not generated');
                done(err);
            });
        });
    });
});