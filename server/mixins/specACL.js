const permissions = require('./permissions/owner.js');

module.exports = (AclModel, options) => {
    const Model = AclModel;
    // get the allowed and denied roles
    const { DENY: denyList = [], ALLOW: allowList = [] } = options;

    Model.checkAccess = async (accessToken, modelId, sharedMethods, ctx, callback) => {
        const hasToken = !!accessToken;
        const userData = ctx.args.options.userInfo || { permisions: [], roles: [] }
        let canAccess = false; 
        const isOwner = await permissions.isOwner(Model, modelId, userData.userId);

        if (allowList.length && allowList.some(e => userData.roles.includes(e))) canAccess = true;
        if (denyList.length && denyList.some(e => userData.roles.includes(e))) canAccess = false;
        if (isOwner) canAccess = true;
        
        return callback(null, canAccess)
    }
}