'use strict';

function AlexaSkill(appId) {
  this._appId = appId;
}

function hasOwn(object, property) {
  return Object.prototype.hasOwnProperty.call(object, property);
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function validateEvent(event) {
  if (
    !event ||
    !event.session ||
    !event.session.application ||
    !event.session.application.applicationId
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

  if (!event.request || !hasOwn(event.request, 'type')) {
    throw new Error('Invalid Alexa event: missing request.type');
  }

  if (!isNonEmptyString(event.request.type)) {
    throw new Error(
      'Invalid Alexa event: request.type must be a non-empty string'
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
    this.eventHandlers.onLaunch.call(
      this,
      event.request,
      event.session,
      response
    );
  },

  IntentRequest: function (event, context, response) {
    this.eventHandlers.onIntent.call(
      this,
      event.request,
      event.session,
      response
    );
  },

  SessionEndedRequest: function (event, context) {
    this.eventHandlers.onSessionEnded(event.request, event.session);
    context.succeed();
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
    if (!intentRequest.intent || !hasOwn(intentRequest.intent, 'name')) {
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
      intentHandler.call(this, intent, session, response);
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

AlexaSkill.prototype.execute = function (event, context) {
  try {
    validateEvent(event);

    console.log('session applicationId validated');

    // Validate that this request originated from authorized source.
    if (
      this._appId &&
      event.session.application.applicationId !== this._appId
    ) {
      console.log("The applicationId doesn't match the configured skill id");
      throw new Error('Invalid applicationId');
    }

    if (!isSessionAttributesObject(event.session.attributes)) {
      event.session.attributes = {};
    }

    if (event.session.new) {
      this.eventHandlers.onSessionStarted(event.request, event.session);
    }

    // Route the request to the proper handler which may have been overriden.
    var requestHandler = hasOwn(this.requestHandlers, event.request.type)
      ? this.requestHandlers[event.request.type]
      : undefined;
    if (!requestHandler) {
      throw new Error('Unsupported request type');
    }
    requestHandler.call(
      this,
      event,
      context,
      new Response(context, event.session)
    );
  } catch (e) {
    console.log('Unexpected exception ' + e);
    context.fail(e);
  }
};

var Response = function (context, session) {
  this._context = context;
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
      this._context.succeed(
        buildSpeechletResponse({
          session: this._session,
          output: speechOutput,
          shouldEndSession: true
        })
      );
    },
    tellWithCard: function (speechOutput, cardTitle, cardContent) {
      this._context.succeed(
        buildSpeechletResponse({
          session: this._session,
          output: speechOutput,
          cardTitle: cardTitle,
          cardContent: cardContent,
          shouldEndSession: true
        })
      );
    },
    ask: function (speechOutput, repromptSpeech) {
      this._context.succeed(
        buildSpeechletResponse({
          session: this._session,
          output: speechOutput,
          reprompt: repromptSpeech,
          shouldEndSession: false
        })
      );
    },
    askWithCard: function (
      speechOutput,
      repromptSpeech,
      cardTitle,
      cardContent
    ) {
      this._context.succeed(
        buildSpeechletResponse({
          session: this._session,
          output: speechOutput,
          reprompt: repromptSpeech,
          cardTitle: cardTitle,
          cardContent: cardContent,
          shouldEndSession: false
        })
      );
    }
  };
})();

module.exports = AlexaSkill;
