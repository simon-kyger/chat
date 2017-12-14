/**
 * var bootstrap loads modules
 *
 * @param  {type} client        description the instance of ChatClient to configure
 * @param  {type} configuration description a JSON object with the following structure
 *                               {
 *                                  "uuid": 767697-6757667rt-45e5e5-7656u6,
 *                                  "modules": ["m1", "m2", ...],
 *                                  "m1" : {...},
 *                                  "m2" : {...},
 *                                  ...
 *                               }
 */
var bootstrap = function(client, configuration, env) {

  client.getConfiguration = function() {
    return configuration;
  };

  var modules = configuration.modules;
  if (configuration.modules === '*') {
    modules = _.keys(ChatClient.modules);
    configuration.modules = modules;
  }

  for (var i = 0; i < modules.length; i++) {
    ChatClient.modules[modules[i]](client, configuration, env);
  }
};



/**
 * ChatClient - description
 *
 * @return {type}  description
 */
function ChatClient() {

  var args = Array.prototype.slice.apply(arguments);
  var callback = args.pop();

  if (!(this instanceof ChatClient)) {
    return new ChatClient(args, callback);
  }

  // this is where these variables to when they're converted to ES6
  var env = {
    socket: io()
  };

  if (args.length) {
    if (typeof args[0] === 'object') {
      options = args[0];
    }
    // else if (typeof args[0] === 'string') {
    //   options.modules = args;
    // }
  }

  // for use with either "new ChatClient('*', callback...)
  // or with "new ChatClient(callback...)"
  // if (!options.modules || options.modules[0] === '*') {
  //   options.modules = [];
  //   for (m in ChatClient.modules) {
  //     options.modules.push(m);
  //   }
  // }

  var self = this;
  env.socket.on('bootstrap', function(configuration) {

    // first, bootstrap the system
    bootstrap(self, configuration, env);

    // then release control
    callback(self);
  });
}



/**
 * var getOrCreateList - lazy initializer for lists that modules need to share
 *
 * @param  {type} env      map of unique run-time tweaks
 * @param  {type} listName the name of the list to get or create
 * @return {type}          the property of env identified by 'listName'
 */
var getOrCreateList = function(env, listName) {
  if (!env[listName]) {
    env[listName] = [];
  }
  return env[listName];
};


/**
 * var using - description
 *
 * @param  {type} configuration description
 * @param  {type} dependencies  description
 * @return {type}               description
 */
var using = function(configuration, dependencies) {
  return configuration.modules !== '*' || _.forEach(dependencies, function(dep) {
    return _.includes(configuration.modules, dep);
  });
};


/**
 * A map to store the ChatClient modules in
 */
ChatClient.modules = {

  /**
   * dom - description
   *
   * @param  {type} client        description
   * @param  {type} configuration description
   * @param  {type} env           description
   * @return {type}               description
   */
  'dom' : function(client, configuration, env) {
    var $el = $(configuration.el || 'body');
    client.get$Root = function() {
      return $el;
    };
  },

  /**
   * users - description
   *
   * @param  {type} client        description
   * @param  {type} configuration description
   * @param  {type} env           description
   * @return {type}               description
   */
  'users' : function(client, configuration, env) {

    var users = [];
    client.getUsers = function() {
      return users;
    };

    env.socket.on('updateUsers', function(data) {
      var oldUsers = users;
      users = data.users;
      _.forEach(getOrCreateList(env, 'updateUsersListeners'), function(listener) {
        listener.handleUpdateUsersEvent(oldUsers, users);
      });
    });
  },

  /**
   * messaging - description
   *
   * @param  {type} client        description
   * @param  {type} configuration description
   * @param  {type} env           description
   * @return {type}               description
   */
  'messaging' : function(client, configuration, env) {

    if (!using(configuration, ['users'])) {
      return; // module dependencies not met
    }

    getOrCreateList(env, 'updateUsersListeners').push(this);

    this.handleUpdateUsersEvent = function(oldUsers, newUsers) {
      // adjust private messaging concerns
    };

    env.socket.on('addToChat', function(data) {
      // TODO: route message to correct window
      _.forEach(getOrCreateList(env, 'updateUsersListeners'), function(listener) {
        listener.handleUpdateUsersEvent(oldUsers, users);
      });
    });
  },
};

module.exports = ChatClient;
