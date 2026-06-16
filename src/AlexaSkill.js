'use strict';

var REQUEST_TIMESTAMP_TOLERANCE_MS = 150 * 1000;
var ISO_8601_UTC_PATTERN = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})(?:\.\d+)?Z$/;

function AlexaSkill(appId, now) {
  this._appId = appId;
  this._now = typeof now === 'function' ? now : Date.now;
}

function hasOwn(object, property) {
  return Object.prototype.hasOwnProperty.call(object, property);
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function hasSsmlSpeakEnvelope(speech) {
  var trimmedSpeech = speech.trim();
  var openingTag = trimmedSpeech.match(/^<speak(?:\s[^>]*)?>/);

  if (!openingTag || !trimmedSpeech.endsWith('</speak>')) {
    return false;
  }

  var body = trimmedSpeech.slice(openingTag[0].length, -'</speak>'.length);
  return !/<\/?speak(?:\s|>)/.test(body);
}

function parseRequestTimestamp(timestamp) {
  var match = timestamp.match(ISO_8601_UTC_PATTERN);

  if (!match) {
    return undefined;
  }

  var wholeSecondTimestamp = match[1] + '.000Z';
  var wholeSecondMilliseconds = Date.parse(wholeSecondTimestamp);
  var timestampMilliseconds = Date.parse(timestamp);

  if (
    !Number.isFinite(wholeSecondMilliseconds) ||
    !Number.isFinite(timestampMilliseconds) ||
    new Date(wholeSecondMilliseconds).toISOString() !== wholeSecondTimestamp
  ) {
    return undefined;
  }

  return timestampMilliseconds;
}

function validateEvent(event, nowMilliseconds) {
  if (!event || !hasOwn(event, 'version')) {
    throw new Error('Invalid Alexa event: missing version');
  }

  if (event.version !== '1.0') {
    throw new Error('Invalid Alexa event: version must be 1.0');
  }

  if (
    !hasOwn(event, 'session') ||
    !event.session ||
    !hasOwn(event.session, 'application') ||
    !event.session.application ||
    !hasOwn(event.session.application, 'applicationId')
  ) {
    throw new Error(
      'Invalid Alexa event: missing session.application.applicationId'
    );
  }

  if (!isNonEmptyString(event.session.application.applicationId)) {
    throw new Error(
      'Invalid Alexa event: session.application.applicationId must be a non-empty string'
    );
  }

  if (!hasOwn(event.session, 'sessionId')) {
    throw new Error('Invalid Alexa event: missing session.sessionId');
  }

  if (!isNonEmptyString(event.session.sessionId)) {
    throw new Error(
      'Invalid Alexa event: session.sessionId must be a non-empty string'
    );
  }

  if (!hasOwn(event.session, 'new')) {
    throw new Error('Invalid Alexa event: missing session.new');
  }

  if (typeof event.session.new !== 'boolean') {
    throw new Error('Invalid Alexa event: session.new must be a boolean');
  }

  if (
    !hasOwn(event, 'request') ||
    !event.request ||
    !hasOwn(event.request, 'type')
  ) {
    throw new Error('Invalid Alexa event: missing request.type');
  }

  if (!isNonEmptyString(event.request.type)) {
    throw new Error(
      'Invalid Alexa event: request.type must be a non-empty string'
    );
  }

  if (!hasOwn(event.request, 'requestId')) {
    throw new Error('Invalid Alexa event: missing request.requestId');
  }

  if (!isNonEmptyString(event.request.requestId)) {
    throw new Error(
      'Invalid Alexa event: request.requestId must be a non-empty string'
    );
  }

  if (!hasOwn(event.request, 'timestamp')) {
    throw new Error('Invalid Alexa event: missing request.timestamp');
  }

  if (!isNonEmptyString(event.request.timestamp)) {
    throw new Error(
      'Invalid Alexa event: request.timestamp must be a non-empty string'
    );
  }

  var requestTimestamp = parseRequestTimestamp(event.request.timestamp);
  if (requestTimestamp === undefined) {
    throw new Error(
      'Invalid Alexa event: request.timestamp must be an ISO 8601 UTC string'
    );
  }

  if (
    !Number.isFinite(nowMilliseconds) ||
    Math.abs(nowMilliseconds - requestTimestamp) >
      REQUEST_TIMESTAMP_TOLERANCE_MS
  ) {
    throw new Error(
      'Invalid Alexa event: request.timestamp is outside the allowed freshness window'
    );
  }

  if (!hasOwn(event.request, 'locale')) {
    throw new Error('Invalid Alexa event: missing request.locale');
  }

  if (!isNonEmptyString(event.request.locale)) {
    throw new Error(
      'Invalid Alexa event: request.locale must be a non-empty string'
    );
  }
}

function isSessionAttributesObject(attributes) {
  return (
    attributes !== null &&
    typeof attributes === 'object' &&
    !Array.isArray(attributes)
  );
}

AlexaSkill.speechOutputType = {
  PLAIN_TEXT: 'PlainText',
  SSML: 'SSML'
};

AlexaSkill.prototype.requestHandlers = {
  LaunchRequest: function (event, context, response) {
    return this.eventHandlers.onLaunch.call(
      this,
      event.request,
      event.session,
      response
    );
  },

  IntentRequest: function (event, context, response) {
    return this.eventHandlers.onIntent.call(
      this,
      event.request,
      event.session,
      response
    );
  },

  SessionEndedRequest: function (event, context) {
    return this.eventHandlers.onSessionEnded(event.request, event.session);
  }
};

/**
 * Override any of the eventHandlers as needed
 */
AlexaSkill.prototype.eventHandlers = {
  /**
   * Called when the session starts.
   * Subclasses could have overriden this function to open any necessary resources.
   */
  onSessionStarted: function (sessionStartedRequest, session) {},

  /**
   * Called when the user invokes the skill without specifying what they want.
   * The subclass must override this function and provide feedback to the user.
   */
  onLaunch: function (launchRequest, session, response) {
    throw new Error('onLaunch should be overriden by subclass');
  },

  /**
   * Called when the user specifies an intent.
   */
  onIntent: function (intentRequest, session, response) {
    if (
      !hasOwn(intentRequest, 'intent') ||
      !intentRequest.intent ||
      !hasOwn(intentRequest.intent, 'name')
    ) {
      throw new Error('Invalid intent request: missing intent.name');
    }

    if (!isNonEmptyString(intentRequest.intent.name)) {
      throw new Error(
        'Invalid intent request: intent.name must be a non-empty string'
      );
    }

    var intent = intentRequest.intent,
      intentName = intentRequest.intent.name,
      intentHandler = hasOwn(this.intentHandlers, intentName)
        ? this.intentHandlers[intentName]
        : undefined;
    if (intentHandler) {
      console.log('dispatch intent = ' + intentName);
      return intentHandler.call(this, intent, session, response);
    } else {
      throw new Error('Unsupported intent');
    }
  },

  /**
   * Called when the user ends the session.
   * Subclasses could have overriden this function to close any open resources.
   */
  onSessionEnded: function (sessionEndedRequest, session) {}
};

/**
 * Subclasses should override the intentHandlers with the functions to handle specific intents.
 */
AlexaSkill.prototype.intentHandlers = {};

AlexaSkill.prototype.execute = async function (event, context) {
  try {
    validateEvent(event, this._now());

    console.log('session applicationId validated');

    // Validate that this request originated from authorized source.
    if (
      this._appId &&
      event.session.application.applicationId !== this._appId
    ) {
      console.log("The applicationId doesn't match the configured skill id");
      throw new Error('Invalid applicationId');
    }

    if (
      !hasOwn(event.session, 'attributes') ||
      !isSessionAttributesObject(event.session.attributes)
    ) {
      Object.defineProperty(event.session, 'attributes', {
        value: {},
        writable: true,
        enumerable: true,
        configurable: true
      });
    }

    // Route the request to the proper handler which may have been overriden.
    var requestHandler = hasOwn(this.requestHandlers, event.request.type)
      ? this.requestHandlers[event.request.type]
      : undefined;
    if (typeof requestHandler !== 'function') {
      throw new Error('Unsupported request type');
    }

    if (event.session.new) {
      await this.eventHandlers.onSessionStarted(event.request, event.session);
    }

    return await requestHandler.call(
      this,
      event,
      context,
      new Response(event.session)
    );
  } catch (e) {
    console.log('Alexa request failed');
    throw e;
  }
};

var Response = function (session) {
  this._session = session;
};

function normalizeSpeechOutput(optionsParam) {
  var type;
  var speech;

  if (typeof optionsParam === 'string') {
    type = AlexaSkill.speechOutputType.PLAIN_TEXT;
    speech = optionsParam;
  } else if (
    optionsParam !== null &&
    typeof optionsParam === 'object' &&
    !Array.isArray(optionsParam)
  ) {
    type = optionsParam.type || AlexaSkill.speechOutputType.PLAIN_TEXT;
    speech = optionsParam.speech;
  } else {
    throw new Error(
      'Invalid speech output: expected a string or options object'
    );
  }

  if (
    type !== AlexaSkill.speechOutputType.PLAIN_TEXT &&
    type !== AlexaSkill.speechOutputType.SSML
  ) {
    throw new Error('Invalid speech output: type must be PlainText or SSML');
  }

  if (!isNonEmptyString(speech)) {
    throw new Error('Invalid speech output: speech must be a non-empty string');
  }

  if (
    type === AlexaSkill.speechOutputType.SSML &&
    !hasSsmlSpeakEnvelope(speech)
  ) {
    throw new Error('Invalid speech output: SSML must use a speak envelope');
  }

  return { type: type, speech: speech };
}

function createSpeechObject(optionsParam) {
  var options = normalizeSpeechOutput(optionsParam);

  if (options.type === AlexaSkill.speechOutputType.SSML) {
    return {
      type: options.type,
      ssml: options.speech
    };
  }

  return {
    type: options.type,
    text: options.speech
  };
}

Response.prototype = (function () {
  var buildSpeechletResponse = function (options) {
    var alexaResponse = {
      outputSpeech: createSpeechObject(options.output),
      shouldEndSession: options.shouldEndSession
    };
    if (hasOwn(options, 'reprompt')) {
      alexaResponse.reprompt = {
        outputSpeech: createSpeechObject(options.reprompt)
      };
    }
    if (options.cardTitle && options.cardContent) {
      alexaResponse.card = {
        type: 'Simple',
        title: options.cardTitle,
        content: options.cardContent
      };
    }
    var returnResult = {
      version: '1.0',
      response: alexaResponse
    };
    if (options.session && options.session.attributes) {
      returnResult.sessionAttributes = options.session.attributes;
    }
    return returnResult;
  };

  return {
    tell: function (speechOutput) {
      return buildSpeechletResponse({
        session: this._session,
        output: speechOutput,
        shouldEndSession: true
      });
    },
    tellWithCard: function (speechOutput, cardTitle, cardContent) {
      return buildSpeechletResponse({
        session: this._session,
        output: speechOutput,
        cardTitle: cardTitle,
        cardContent: cardContent,
        shouldEndSession: true
      });
    },
    ask: function (speechOutput, repromptSpeech) {
      return buildSpeechletResponse({
        session: this._session,
        output: speechOutput,
        reprompt: repromptSpeech,
        shouldEndSession: false
      });
    },
    askWithCard: function (
      speechOutput,
      repromptSpeech,
      cardTitle,
      cardContent
    ) {
      return buildSpeechletResponse({
        session: this._session,
        output: speechOutput,
        reprompt: repromptSpeech,
        cardTitle: cardTitle,
        cardContent: cardContent,
        shouldEndSession: false
      });
    }
  };
})();

module.exports = AlexaSkill;
