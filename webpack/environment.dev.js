module.exports = {
  // APP_VERSION is passed as an environment variable from the Gradle / Maven build tasks.
  VERSION: process.env.hasOwnProperty('APP_VERSION') ? process.env.APP_VERSION : 'DEV',
  // The root URL for API calls, ending with a '/' - for example: `"https://www.jhipster.tech:8081/myservice/"`.
  // If this URL is left empty (""), then it will be relative to the current context.
  // If you use an API server, in `prod` mode, you will need to enable CORS
  // (see the `jhipster.cors` common JHipster property in the `application-*.yml` configurations)

  SERVER_ADMIN_API_URL: 'http://164.92.188.249:8089',
  SERVER_API_URL: 'http://164.92.188.249:8080',
  SERVER_DOMAIN: 'http://164.92.188.249'
};
