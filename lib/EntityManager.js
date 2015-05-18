var couchbase = require('couchbase');
var uuid = require('node-uuid');
var validator = require('is-my-json-valid');

var IcyError = require('IcyApiError').IcyError;
var EntityErrorsCodes = require('./errors');

var Entity = require('./Entity');

/**
 * Défini la classe EntityManager.
 * @constructor
 * @returns {EntityManager}
 */
function EntityManager() {
    this.validate = this.getValidate();
    this.filter = this.getFilter();
    this.bucket = this.getBucket();
}

/**
 * Génère un uid.
 * @returns {String}
 */
EntityManager.prototype.generateUid = function (entity, callback) {
    callback(null, uuid.v4());
};

/**
 * Retourne le bucket associé au manager.
 * @returns {Bucket}
 */
EntityManager.prototype.getBucket = function () {
    return require('./../Couchbase/MainBucket');
};

/**
 * Recherche en base et instancie une entity.
 * @param {String} uid L'uid de l'entity
 * @param {Object} options Liste d'options pour couchbase
 * @param {Function} callback
 */
EntityManager.prototype.spawn = function (uid, options, callback) {
    if (options instanceof Function) {
        callback = arguments[1];
        options = {};
    }
    this.bucket.get(uid, options, function (err, result) {
        if (err) {
            return callback(err);
        }
        else {
            var typeOK = this.assertType(result.value);
            if (typeOK !== null) {
                return callback(typeOK);
            }
            var entity = new (this.getEntityClass());
            entity.uid = uid;
            this.insertData(result, entity);
            return callback(null, entity);
        }
    }.bind(this));
};

/**
 * Recherche en base et instancie plusieurs entities.
 * @param {Array.string} uids
 * @param {Function} callback
 */
EntityManager.prototype.multiSpawn = function (uids, callback) {
    if (!uids || uids.length === 0) {
        return callback(null, []);
    }

    this.bucket.getMulti(uids, function (err, results) {
        if (err && isNaN(err)) {
            return callback(null, err);
        }
        var entities = new Array();
        Object.keys(results).forEach(function (key) {
            var result = results[key];
            // Une erreur pour le key
            if (result.error) {

                entities.push(result.error);

            }
            // pas d'erreur pour le moment
            else {
                var typeOK = this.assertType(result.value);
                // Mauvais type ?
                if (typeOK !== null) {
                    entities.push(typeOK);
                }
                // Tout est ok. Ouf !
                else {
                    var entity = new (this.getEntityClass());
                    entity.uid = key;
                    this.insertData(result, entity);
                    entities.push(entity);
                }
            }
        }.bind(this));
        return callback(null, entities);
    }.bind(this));
};

/**
 * Rechercher les entity à partir d'une viewQuery
 * @param {couchbase.ViewQuery} view
 * @param {Object} params
 * @param {Function} callback
 */
EntityManager.prototype.spawnByView = function (view, params, callback) {
    if (params instanceof Function) {
        callback = arguments[1];
        params = {};
    }
    this.bucket.query(view, params, function (err, rows, meta) {
        if (err) {
            return callback(err);

        }
        var nbRows = rows.length;

        if (nbRows === 0) {
            return callback(null, []);
        }
        this.multiSpawn(
                rows.map(function (row) {
                    return row.id;
                }),
                function (err, results) {
                    if (err) {
                        return callback(err);
                    }

                    callback(null, results);
                });
    }.bind(this));
};

/**
 * Supprime de la base l'entity demandée.
 * @param {String} uid L'uid de l'entity
 * @param {Object} options Liste d'options pour couchbase
 * @param {Function} callback
 */
EntityManager.prototype.remove = function (uid, options, callback) {
    if (options instanceof Function) {
        callback = arguments[1];
        options = {};
    }
    if (uid instanceof Object) {
        var typeOK = this.assertType(uid);
        if (typeOK !== null) {
            return callback(typeOK);
        }
        uid = uid.uid;
    }
    this.bucket.remove(uid, options, function (err, result) {
        if (err) {
            return callback(err);
        }
        return callback(null);
    });

};

/**
 * Crée une entity.
 * @returns {Entity}
 */
EntityManager.prototype.create = function () {
    return new (this.getEntityClass());
};

/**
 * Insert une entity.
 * @param {String} uid L'uid de l'entity
 * @param {Object} options Liste d'options pour couchbase
 * @param {Function} callback
 */
EntityManager.prototype.insert = function (entity, options, callback) {
    if (options instanceof Function) {
        callback = arguments[1];
        options = {};
    }
    var typeOK = this.assertType(entity);
    if (typeOK !== null) {
        return callback(typeOK);
    }
    if (entity.uid === 0) {
        this.generateUid(entity, function (err, result) {
            if (err) {
                return callback(err);
            }
            else {
                entity.uid = result;
                return this.insert(entity, options, callback);
            }
        }.bind(this));
    }
    else {
        var data = this.getData(entity);
        if (data instanceof Error) {
            return callback(data);
        }
        this.bucket.insert(entity.uid, data, options, function (err, result) {
            if (err) {
                return callback(err);
            }
            entity.cas = result.cas;
            return callback(null, entity);
        });
    }
};

/**
 * Met à jour une entity.
 * @param {String} uid L'uid de l'entity
 * @param {Object} options Liste d'options pour couchbase
 * @param {Function} callback
 */
EntityManager.prototype.update = function (entity, options, callback) {
    if (options instanceof Function) {
        callback = arguments[1];
        options = {};
    }
    var typeOK = this.assertType(entity);
    if (typeOK !== null) {
        return callback(typeOK);
    }
    var data = this.getData(entity);
    if (data instanceof Error) {
        return callback(data);
    }
    this.bucket.replace(entity.uid, data, options, function (err, result) {
        if (err) {
            return callback(err);
        }
        return callback(null, entity);
    });
};

/**
 * Retourne toutes les valeurs à sauvegarder.
 * @returns {object} Les valeurs à sauvegarder.
 */
EntityManager.prototype.getData = function (entity) {
    var data = {type: this.type};

    Object.keys(entity).forEach(function (key) {
        if (key !== 'uid' && key !== 'cas') {
            data[key] = entity[key];
        }
    });
    var valide = this.validate(this.filter(data));
    if (valide) {
        return data;
    }
    console.error(data, this.validate.errors);
    return new IcyError(EntityErrorsCodes.schemaMismatch, null, 'BDD: Schema incompatible');
};

/**
 * Ajout à l'objet les données passées en paramètre.    
 * @param {Object} rawData Les données à ajouter.
 */
EntityManager.prototype.insertData = function (rawData, entity) {
    var value = rawData.value;
    Object.keys(value).forEach(function (key) {
        entity[key] = value[key];
    });
    entity.cas = rawData.cas;
};

/**
 * Vérifie que les données sont bien du même type que celui géré par le manager.
 * @param {Object} data
 */
EntityManager.prototype.assertType = function (data) {
    if (data instanceof Object && (data.type === this.type || data instanceof this.getEntityClass())) {
        return null;
    }
    return new IcyError(EntityErrorsCodes.typeMismatch, null, 'BDD: Type incompatible');
};

/**
 * Retourne le type d'entité associé au manager.
 * @returns {Entity}
 */
EntityManager.prototype.getEntityClass = function () {
    return Entity;
};

/**
 * Retourne le schéma de donnée de l'entity.
 * @returns {String}
 */
EntityManager.prototype.getValidate = function () {
    return validator({});
};

EntityManager.prototype.getFilter = function () {
    return validator.filter({});
};

/**
 * Le tag pour déterminer le type d'objet.
 * @type String
 */
EntityManager.prototype.type = 'none';

module.exports = EntityManager;