/**
 * This file contains a few helper methods that are used in webapp.jsonnet.
 * They're put here as to not distract the reader from the stuff that really matters --
 * that is the code that produces their application's configuration.
 */
{
    local util = self,

    /**
     * We're pinned to jsonnet 0.12.0, std.any was added after that version.
     * So we implement our own.
     */
    any(list):
        std.length(std.filter(function(x) x, list)) > 0,

    isCustomHost(host):
        if std.endsWith(host, '.allen.ai') then
            if std.length(std.split(host, '.')) != 3 then
                true
            else
                false
        else if std.endsWith(host, '.apps.allenai.org') then
            if std.length(std.split(host, '.')) != 4 then
                true
            else
                false
        else
            true,

    /**
     * Groups by the provided TLDs. Returns a tuple. The first value is a map of hosts
     * by TLD. The second a list of hosts that didn't match a TLD.
     */
    groupHosts(hosts, tlds):
        local byTLD = { [tld]: std.filter(function(host) std.endsWith(host, tld), hosts) for tld in tlds };
        local rest = std.filter(function(host) !self.any([ std.endsWith(host, tld) for tld in tlds ]), hosts);
        [ byTLD, rest ],

    hasCustomHost(hosts):
        std.length(std.filter(util.isCustomHost, hosts)) > 0,

    /**
     * Returns a list of hostnames, given the provided environment identifier, Skiff config
     * and top level domain.
     */
    getHosts(env, config, tld):
        if env == 'prod' then
            [ config.appName + tld ]
        else
            [ config.appName + '-' + env + tld ],

    /**
     * Returns a few TLS related constructs given the provided hosts. If the application is
     * only using direct subdomains of `.apps.allenai.org` then an empty configuration is provided,
     * as the wildcard certificate that's managed by Skiff Bermuda can be used instead.
     */
    getTLSConfig(fqn, hosts): {
        local needsTLSCert = util.hasCustomHost(hosts),

        ingressAnnotations:
            if needsTLSCert then
                { 'cert-manager.io/cluster-issuer': 'letsencrypt-prod' }
            else {},
        spec:
            if needsTLSCert then
                { secretName: fqn + '-tls' }
            else
                {},
    },

    /**
     * Returns the path to authenticate requets with our Skiff Login system (OAuth2 Proxy).
     * If config has an array of strings in the field "login_allowed_emails", then they are
     * used to limit access to account with those email addresses.
     */
    authPath(config):
      if 'login_allowed_emails' in config && std.length(config.login_allowed_emails) > 0 then
          '/oauth2/auth?allowed_emails=' + std.join(',', config.login_allowed_emails)
      else if 'login_allowed_domains' in config && std.length(config.login_allowed_domains) > 0 then
          '/oauth2/auth?allowed_email_domains=' + std.join(',', config.login_allowed_domains)
      else
          '/oauth2/auth',

    /**
     * Returns Ingress annotations that enable authentication, given the provided Skiff config.
     */
    getAuthAnnotations(config, tld):
        if !('login' in config) then
            {}
        else if config.login == "ai2" then
            if 'login_allowed_domains' in config then
              error 'login_allowed_domains is not supported with ai2 login'
            else
              {
                  'nginx.ingress.kubernetes.io/auth-url': 'https://ai2.login' + tld + $.authPath(config),
                  'nginx.ingress.kubernetes.io/auth-signin': 'https://ai2.login' + tld + '/oauth2/start?rd=https://$host$request_uri',
                  'nginx.ingress.kubernetes.io/auth-response-headers': 'X-Auth-Request-User, X-Auth-Request-Email'
              }
        else if config.login == "google" then
            {
                'nginx.ingress.kubernetes.io/auth-url': 'https://google.login' + tld + $.authPath(config),
                'nginx.ingress.kubernetes.io/auth-signin': 'https://google.login' + tld + '/oauth2/start?rd=https://$host$request_uri',
                'nginx.ingress.kubernetes.io/auth-response-headers': 'X-Auth-Request-User, X-Auth-Request-Email'
            }
        else
            error 'Unknown login type: ' + config.login,

    /**
     * Returns elements in list that are repeated.
     */
    repeated(list):
        std.filter(
            function(item) item != null,
            [
                if std.count(list, candidate) > 1 then
                   candidate
                else
                   null
                for candidate in std.set(list)
            ]
        ),

    /**
     * Returns empty string if the configuration is okay, else returns a string describing the error.
     */
    verifyLoginConfig(config):
      // As a convenience, we define local vars for login_path_prefixes and
      // nologin_path_prefixes, defaulting to empty lists.
      //
      // We do this because if login_path_prefixes isn't in the config, then
      // evaluating "config.login_path_prefixes" in Jsonnet raises the error
      // "Error: RUNTIME ERROR: Field does not exist".
      local login_path_prefixes   = if 'login_path_prefixes'   in config then config.login_path_prefixes   else [];
      local nologin_path_prefixes = if 'nologin_path_prefixes' in config then config.nologin_path_prefixes else [];

      // Ensure that login is configured if login_path_prefixes or nologin_path_prefixes are specified.
      if !('login' in config) && login_path_prefixes != [] then
          "login must be configured if login_path_prefixes is specified"
      else if !('login' in config) && nologin_path_prefixes != [] then
          "login must be configured if nologin_path_prefixes is specified"

      // Ensure that if nologin_path_prefixes is specified, that login_path_prefixes is also
      // specified.
      else if nologin_path_prefixes != [] && login_path_prefixes == [] then
          "login_path_prefixes must be specified if nologin_path_prefixes is specified"

      // Ensure these each have no repeated prefixes.
      else if self.repeated(login_path_prefixes) != [] then
          "login_path_prefixes have repeats: " + self.repeated(login_path_prefixes)
      else if self.repeated(nologin_path_prefixes) != [] then
          "nologin_path_prefixes have repeats: " + self.repeated(nologin_path_prefixes)

      else
        // If we got here, then these path prefixes are individually okay.
        // Now we can check that they don't overlap.
        local both = login_path_prefixes + nologin_path_prefixes;
        if self.repeated(both) != [] then
            "login_path_prefixes and nologin_prefixes have overlapping paths: " + self.repeated(both)
        else
            // If we got here, then everything is okay.
            "",

    /**
     * Returns true if the configuration is okay, else raises an error.
     */
    assertLoginConfig(config):
      local result = self.verifyLoginConfig(config);
      if result != "" then
        error result
      else
        true,

    /**
     * Returns paths that a login-supporting ingress should respond do.
     */
    ingressPathsSupportingLogin(config, fullyQualifiedName, proxyPort):
      local pathPrefixes =
          if ('login' in config && 'login_path_prefixes' in config) then
             // Skiff Login is set up, and some path prefixes are explicitly requested, so
             // this login-supporting ingress should support the path prefixes provided.
             config.login_path_prefixes
          else
             // Skiff Login is not set up, or no path prefixes are explicitly requested,
             // so this login-supporting ingress should support all requests.
             ['/'];
      [
          {
              path: pathPrefix,
              pathType: 'Prefix',
              backend: {
                  service: {
                      name: fullyQualifiedName,
                      port: {
                          number: proxyPort
                      }
                  }
              }
          }
          for pathPrefix in pathPrefixes
      ],

    /**
     * Returns paths that a non-login-supporting ingress should respond do.
     */
    ingressPathsNoLogin(config, fullyQualifiedName, proxyPort):
      local pathPrefixes =
          if ('login' in config && 'nologin_path_prefixes' in config) then
             // Skiff Login is set up, and some path prefixes are explicitly requested to
             // have no auth, so this NoLogin ingress should support the path prefixes
             // provided.
             config.nologin_path_prefixes
          else
            // Skiff Login is not set up, or it is but no path prefixes are requested
            // to have no auth, so this NoLogin ingress should support all requests.
             ['/'];
      [
          {
              path: pathPrefix,
              pathType: 'Prefix',
              backend: {
                  service: {
                      name: fullyQualifiedName,
                      port: {
                          number: proxyPort
                      }
                  }
              }
          }
          for pathPrefix in pathPrefixes
      ],

    /**
     * Invoke functions in this utility object and assert that they work as expected.
     */
    assertTests():
      // Test the any() function.
      assert self.any([]) == false:                   "empty list should return false";
      assert self.any([false]) == false:              "list with false values should return false";
      assert self.any([false, false]) == false:       "list with false values should return false";
      assert self.any([true]) == true:                "list with true values should return true";
      assert self.any([false, true]) == true:         "list with true values should return true";
      assert self.any([true, true]) == true:          "list with true values should return true";
      assert self.any([true, false, true]) == true:   "list with true values should return true";

      // Test the repeated() function.
      assert self.repeated(["a", "b"]) == []:                   "calling repeated(): no repeats should be found";
      assert self.repeated(["a", "a", "b"]) == ["a"]:           "calling repeated(): one repeat should be found";
      assert self.repeated(["a", "a", "a", "b"]) == ["a"]:      "calling repeated(): one repeat should be found";
      assert self.repeated(["b", "a", "a", "b"]) == ["a", "b"]: "calling repeated(): two repeats should be found";

      // Test the verifyLoginConfig() function.
      assert self.verifyLoginConfig({"login": "ai2"}) == "":
        "config with login should be okay";
      assert self.verifyLoginConfig({"login_path_prefixes": ["/foo"]}) == "login must be configured if login_path_prefixes is specified":
        "prefixes without login should trigger failure";
      assert self.verifyLoginConfig({"nologin_path_prefixes": ["/foo"]}) == "login must be configured if nologin_path_prefixes is specified":
        "prefixes without login should trigger failure";
      assert self.verifyLoginConfig({"login": "ai2", "login_path_prefixes": ["/foo", "/foo"]}) == 'login_path_prefixes have repeats: ["/foo"]':
        "repeats should trigger failure";
      assert self.verifyLoginConfig({"login": "ai2", "login_path_prefixes": ["/"], "nologin_path_prefixes": ["/foo", "/foo"]}) == 'nologin_path_prefixes have repeats: ["/foo"]':
        "repeats should trigger failure";
      assert self.verifyLoginConfig({"login": "ai2", "login_path_prefixes": ["/foo"], "nologin_path_prefixes": ["/foo"]}) == 'login_path_prefixes and nologin_prefixes have overlapping paths: ["/foo"]':
        "overlapping prefixes should trigger failure";

      // We're done.
      true

}

