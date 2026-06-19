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
function configuredSkillId(value) {
  if (typeof value !== 'string') {
    return undefined;
  }

  var skillId = value.trim();
  return skillId.length > 0 ? skillId : undefined;
}

function requiredSkillId(value, lambdaFunctionName) {
  var skillId = configuredSkillId(value);

  if (configuredSkillId(lambdaFunctionName) && !skillId) {
    throw new Error('ALEXA_SKILL_ID must be configured in AWS Lambda');
  }

  return skillId;
}

var APP_ID = requiredSkillId(
  process.env.ALEXA_SKILL_ID,
  process.env.AWS_LAMBDA_FUNCTION_NAME
);

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
HelloWorld.prototype.eventHandlers = Object.create(
  AlexaSkill.prototype.eventHandlers
);

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
  return response.ask(speechOutput, repromptText);
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
    return response.tellWithCard('Hello World!', 'Hello World', 'Hello World!');
  },
  'AMAZON.HelpIntent': function (intent, session, response) {
    return response.ask('You can say hello to me!', 'You can say hello to me!');
  },
  'AMAZON.CancelIntent': function (intent, session, response) {
    return response.tell('Goodbye!');
  },
  'AMAZON.StopIntent': function (intent, session, response) {
    return response.tell('Goodbye!');
  }
};

// Create the handler that responds to the Alexa Request.
exports.handler = async function (event, context) {
  // Create an instance of the HelloWorld skill.
  var helloWorld = new HelloWorld();
  return helloWorld.execute(event, context);
};

exports.configuredSkillId = configuredSkillId;
exports.requiredSkillId = requiredSkillId;
