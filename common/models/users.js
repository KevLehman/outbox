'use strict';

const { createJWT } = require('../../server/services/auth');

module.exports = function(Users) {
    const originalLogin = Users.login;

    Users.login = (credentials, include, callback) => {
        return originalLogin(credentials, include, async (err, token) => {
            if (err) return callback(err);
            // get the user data
            const user = await Users.findOne({ where: { id: token.userId }, include: ['roles'] });
            const permissions = user.roles;

            const newToken = createJWT({ token, user }, permissions);

            return callback(null, newToken);
        })
    }
};
