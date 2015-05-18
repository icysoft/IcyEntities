var IcyError = require('IcyApiError');

var IcyBddErrorCode = IcyError.TechnicCodes.bdd;

module.exports = {
    base: IcyBddErrorCode,
    schemaMismatch: IcyBddErrorCode | 1,
    typeMismatch: IcyBddErrorCode | 2 
};
