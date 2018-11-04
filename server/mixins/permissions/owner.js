const async = require('async');
const utils = require('../../lib/utils.js');

/**
   * Check if a given user ID is the owner the model instance.
   * @param {Function} modelClass The model class
   * @param {*} modelId The model ID
   * @param {*} userId The user ID
   * @options {Object} options
   * @property {accessToken} The access token used to authorize the current user.
   * @callback {Function} [callback] The callback function
   * @param {String|Error} err The error string or object
   * @param {Boolean} isOwner True if the user is an owner.
   */
function isOwner(modelClass, modelId, userId, options, callback) {
  if (!callback && typeof options === 'function') {
    // eslint-disable-next-line no-param-reassign
    callback = options;

    // eslint-disable-next-line no-param-reassign
    options = {};
  }

  // eslint-disable-next-line no-param-reassign
  if (!callback) callback = utils.createPromiseCallback();

  // Resolve isOwner false if modelId or userId is missing
  if (!modelId || !userId) {
    process.nextTick(() => {
      callback(null, false);
    });
    return callback.promise;
  }

  // Is the modelClass User or a subclass of User?
  if (utils.isUserClass(modelClass)) {
    process.nextTick(() => {
      callback(null, utils.matches(modelId, userId));
    });
    return callback.promise;
  }

  function legacyOwnershipCheck(inst) {
    const ownerId = inst.userId || inst.owner;

    function processRelation(r, cb) {
      inst[r]((err, user) => {
        if (err || !user) return cb(err, false);

        console.log(`User found: ${user.id} (through ${r})`);
        cb(null, utils.matches(user.id, userId));
        return null;
      });
    }

    if (ownerId && typeof ownerId !== 'function') {
      return callback(null, utils.matches(ownerId, userId));
    }

    // collecting related users
    const relWithUsers = [];

    // Try to follow belongsTo
    Object.keys(modelClass.relations).some((r) => {
      const rel = modelClass.relations[r];

      // relation should be belongsTo and target a User based class
      const belongsToUser = rel.type === 'belongsTo' && utils.isUserClass(rel.modelTo);
      if (!belongsToUser) {
        return false;
      }

      relWithUsers.push(r);

      return null;
    });

    if (relWithUsers.length === 0) {
      return callback(null, false);
    }

    // check related users: someSeries is used to avoid spamming the db
    // The same as some but runs only a single async operation at a time.
    async.someSeries(relWithUsers, processRelation, callback);

    return null;
  }

  modelClass.findById(modelId, options, (err, inst) => {
    if (err || !inst) {
      return callback(null, false);
    }
    return legacyOwnershipCheck(inst);
  });
  return callback.promise;
}

module.exports = {
  isOwner,
};
