const { validateJWt } = require('../services/auth')

module.exports = (app) => {
  app
    .remotes()
    .phases.addBefore('auth', 'options-from-request')
    .use((ctx, next) => {
      const jwt = ctx.req.query.access_token || ctx.req.headers.authorization;

      // ensure options are defined
      ctx.req.remotingContext.args.options = ctx.req.remotingContext.args.options
        ? ctx.req.remotingContext.args.options
        : {};
      if (!jwt) return next();
      validateJWt(jwt, (err, decoded) => {
        if (err) next(err);
        else {
          app.models.AccessTokens.findById(decoded.accessToken)
            .then((access) => {
              if (access) {
                ctx.req.remotingContext.args.options.accessToken = decoded.accessToken;
                ctx.req.remotingContext.args.options.userInfo = decoded;
                ctx.args.access_token = decoded.accessToken;
                ctx.req.accessToken = access;
              }
              next();
            })
            .catch(next);
        }
      });
    });
};
