/**
 *
 * Examples:
 * One-shot model:
 *  User: "Alexa, tell Hello World to say hello"
 *  Alexa: "Hello World!"
 */

/**
 * App ID for the skill
 */
var APP_ID = process.env.ALEXA_SKILL_ID || undefined;

/**
 * The AlexaSkill prototype and helper functions
 */
var AlexaSkill = require('./AlexaSkill');

/**
 * HelloWorld is a child of AlexaSkill.
 * To read more about inheritance in JavaScript, see the link below.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Introduction_to_Object-Oriented_JavaScript#Inheritance
 */
var HelloWorld = function () {
  AlexaSkill.call(this, APP_ID);
};

// Extend AlexaSkill
HelloWorld.prototype = Object.create(AlexaSkill.prototype);
HelloWorld.prototype.constructor = HelloWorld;

HelloWorld.prototype.eventHandlers.onSessionStarted = function (
  sessionStartedRequest,
  session
) {
  console.log('HelloWorld onSessionStarted');
  // any initialization logic goes here
};

HelloWorld.prototype.eventHandlers.onLaunch = function (
  launchRequest,
  session,
  response
) {
  console.log('HelloWorld onLaunch');
  var speechOutput = 'Welcome to the Alexa Skills Kit, you can say hello';
  var repromptText = 'You can say hello';
  response.ask(speechOutput, repromptText);
};

HelloWorld.prototype.eventHandlers.onSessionEnded = function (
  sessionEndedRequest,
  session
) {
  console.log('HelloWorld onSessionEnded');
  // any cleanup logic goes here
};

HelloWorld.prototype.intentHandlers = {
  // register custom intent handlers
  HelloWorldIntent: function (intent, session, response) {
    response.tellWithCard('Hello World!', 'Hello World', 'Hello World!');
  },
  'AMAZON.HelpIntent': function (intent, session, response) {
    response.ask('You can say hello to me!', 'You can say hello to me!');
  },
  'AMAZON.CancelIntent': function (intent, session, response) {
    response.tell('Goodbye!');
  },
  'AMAZON.StopIntent': function (intent, session, response) {
    response.tell('Goodbye!');
  }
};

// Create the handler that responds to the Alexa Request.
exports.handler = function (event, context) {
  // Create an instance of the HelloWorld skill.
  var helloWorld = new HelloWorld();
  helloWorld.execute(event, context);
};
