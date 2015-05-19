var IcyErrors = require('IcyErrors');

var errorsManager = IcyErrors.ErrorsManager({moduleCode: 10});

module.exports.manager = errorsManager;
module.exports.codes = {
    generic: 0,
    schemaMismatch: 1,
    typeMismatch: 2,
    bucketNotSet: 3
};
