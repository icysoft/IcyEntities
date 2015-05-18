/**
 * Gère un objet persistant de base.
 * @constructor
 * @returns {Entity} Une instance de l'objet.
 */
function Entity() {
}

/**
 * L'id unique de l'entity.
 * @type Number
 */
Entity.prototype.uid = 0;

/**
 * Cas Couchbase. 
 * @type Object
 */
Entity.prototype.cas = 0;


module.exports = Entity;