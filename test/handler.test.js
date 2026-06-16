const assert = require('node:assert/strict');
const test = require('node:test');

delete process.env.ALEXA_SKILL_ID;
delete process.env.AWS_LAMBDA_FUNCTION_NAME;
const AlexaSkill = require('../src/AlexaSkill');
const baseEventHandlers = AlexaSkill.prototype.eventHandlers;
const baseLifecycleHandlers = {
  onSessionStarted: baseEventHandlers.onSessionStarted,
  onLaunch: baseEventHandlers.onLaunch,
  onSessionEnded: baseEventHandlers.onSessionEnded
};
const { configuredSkillId, requiredSkillId, handler } = require('../src/index');

function restoreEnvironment(name, value) {
  if (value === undefined) {
    delete process.env[name];
  } else {
    process.env[name] = value;
  }
}

function loadIndexWithEnvironment(options = {}) {
  const modulePath = require.resolve('../src/index');
  const previousSkillId = process.env.ALEXA_SKILL_ID;
  const previousFunctionName = process.env.AWS_LAMBDA_FUNCTION_NAME;
  delete require.cache[modulePath];

  restoreEnvironment('ALEXA_SKILL_ID', options.skillId);
  restoreEnvironment('AWS_LAMBDA_FUNCTION_NAME', options.lambdaFunctionName);

  try {
    return require('../src/index');
  } finally {
    restoreEnvironment('ALEXA_SKILL_ID', previousSkillId);
    restoreEnvironment('AWS_LAMBDA_FUNCTION_NAME', previousFunctionName);
  }
}

function loadHandlerWithSkillId(skillId, lambdaFunctionName) {
  return loadIndexWithEnvironment({ skillId, lambdaFunctionName }).handler;
}

function invokeEvent(event, options = {}) {
  return new Promise((resolve) => {
    const requestHandler = options.handler || handler;
    const originalLog = console.log;
    const logs = [];

    if (options.captureLogs) {
      console.log = (...args) => {
        logs.push(args.join(' '));
      };
    }

    function finish(result) {
      if (options.captureLogs) {
        console.log = originalLog;
      }

      resolve(Object.assign({ logs }, result));
    }

    Promise.resolve()
      .then(() => requestHandler(event, options.context || {}))
      .then(
        (response) => finish({ type: 'succeed', response }),
        (error) => finish({ type: 'fail', error })
      );
  });
}

function invoke(request, options = {}) {
  const event = {
    version: Object.hasOwn(options, 'version') ? options.version : '1.0',
    session: {
      new: true,
      sessionId: 'session-id',
      application: {
        applicationId: options.applicationId || 'amzn1.echo-sdk-ams.app.test'
      },
      attributes: {}
    },
    request: Object.assign(
      {
        requestId: 'request-id',
        timestamp: new Date().toISOString(),
        locale: Object.hasOwn(options, 'locale') ? options.locale : 'en-US'
      },
      request
    )
  };

  if (options.omitTimestamp) {
    delete event.request.timestamp;
  }

  if (options.omitVersion) {
    delete event.version;
  }

  if (options.omitRequestId) {
    delete event.request.requestId;
  }

  if (options.omitLocale) {
    delete event.request.locale;
  }

  if (Object.hasOwn(options, 'sessionNew')) {
    event.session.new = options.sessionNew;
  }

  if (Object.hasOwn(options, 'sessionId')) {
    event.session.sessionId = options.sessionId;
  }

  if (options.omitSessionId) {
    delete event.session.sessionId;
  }

  if (options.omitSessionNew) {
    delete event.session.new;
  }

  return invokeEvent(event, options);
}

test('Alexa request envelopes require their own protocol version', async () => {
  const missing = await invoke(
    { type: 'LaunchRequest' },
    { omitVersion: true }
  );
  const inheritedEvent = Object.assign(Object.create({ version: '1.0' }), {
    session: {
      new: true,
      sessionId: 'session-id',
      application: {
        applicationId: 'amzn1.echo-sdk-ams.app.test'
      },
      attributes: {}
    },
    request: {
      requestId: 'request-id',
      timestamp: new Date().toISOString(),
      locale: 'en-US',
      type: 'LaunchRequest'
    }
  });
  const inherited = await invokeEvent(inheritedEvent);

  assertFailure(missing, 'Invalid Alexa event: missing version');
  assertFailure(inherited, 'Invalid Alexa event: missing version');
});

test('Alexa request envelope versions must use supported value 1.0', async () => {
  for (const version of ['', '   ', 1, null, {}, [], '2.0']) {
    const result = await invoke({ type: 'LaunchRequest' }, { version });

    assertFailure(result, 'Invalid Alexa event: version must be 1.0');
  }
});

test('Alexa request envelopes tolerate unknown additional properties', async () => {
  const event = {
    version: '1.0',
    futureEnvelopeProperty: { ignored: true },
    session: {
      new: true,
      sessionId: 'session-id',
      application: {
        applicationId: 'amzn1.echo-sdk-ams.app.test'
      },
      attributes: {}
    },
    request: {
      requestId: 'request-id',
      timestamp: new Date().toISOString(),
      locale: 'en-US',
      futureRequestProperty: { ignored: true },
      type: 'LaunchRequest'
    }
  };

  const result = await invokeEvent(event);

  assert.equal(result.type, 'succeed');
  assert.equal(
    result.response.response.outputSpeech.text,
    'Welcome to the Alexa Skills Kit, you can say hello'
  );
});

function assertFailure(result, message) {
  assert.equal(result.type, 'fail');
  assert.ok(result.error instanceof Error);
  assert.equal(result.error.message, message);
  assert.match(result.error.stack, /^Error: /);
}

function responseHandler(output, reprompt, shouldAsk, now) {
  return function (event) {
    const skill = new AlexaSkill(undefined, now);
    skill.eventHandlers = Object.assign({}, skill.eventHandlers, {
      onLaunch: function (launchRequest, session, response) {
        if (shouldAsk) {
          return response.ask(output, reprompt);
        }

        return response.tell(output);
      }
    });
    return skill.execute(event);
  };
}

function throwingResponseHandler(error) {
  return function (event) {
    const skill = new AlexaSkill();
    skill.eventHandlers = Object.assign({}, skill.eventHandlers, {
      onLaunch: function () {
        throw error;
      }
    });
    return skill.execute(event);
  };
}

function invokeResponse(output, reprompt) {
  return invoke(
    { type: 'LaunchRequest' },
    { handler: responseHandler(output, reprompt, false) }
  );
}

function invokeAskResponse(output, reprompt) {
  return invoke(
    { type: 'LaunchRequest' },
    { handler: responseHandler(output, reprompt, true) }
  );
}

test('sample lifecycle handlers do not mutate the AlexaSkill prototype', () => {
  assert.equal(AlexaSkill.prototype.eventHandlers, baseEventHandlers);
  assert.equal(
    AlexaSkill.prototype.eventHandlers.onSessionStarted,
    baseLifecycleHandlers.onSessionStarted
  );
  assert.equal(
    AlexaSkill.prototype.eventHandlers.onLaunch,
    baseLifecycleHandlers.onLaunch
  );
  assert.equal(
    AlexaSkill.prototype.eventHandlers.onSessionEnded,
    baseLifecycleHandlers.onSessionEnded
  );
});

test('launch request returns welcome prompt and keeps the session open', async () => {
  const result = await invoke({ type: 'LaunchRequest' });

  assert.equal(result.type, 'succeed');
  assert.equal(
    result.response.response.outputSpeech.text,
    'Welcome to the Alexa Skills Kit, you can say hello'
  );
  assert.equal(
    result.response.response.reprompt.outputSpeech.text,
    'You can say hello'
  );
  assert.equal(result.response.response.shouldEndSession, false);
});

test('Lambda handler resolves through its returned promise', async () => {
  const event = {
    version: '1.0',
    session: {
      new: true,
      sessionId: 'session-id',
      application: {
        applicationId: 'amzn1.echo-sdk-ams.app.test'
      },
      attributes: {}
    },
    request: {
      requestId: 'request-id',
      timestamp: new Date().toISOString(),
      locale: 'en-US',
      type: 'LaunchRequest'
    }
  };
  const completion = handler(event);

  assert.equal(typeof completion.then, 'function');
  const response = await completion;
  assert.equal(
    response.response.outputSpeech.text,
    'Welcome to the Alexa Skills Kit, you can say hello'
  );
});

test('Lambda handler rejects through its returned promise', async () => {
  await assert.rejects(handler({}), {
    message: 'Invalid Alexa event: missing version'
  });
});

test('AlexaSkill awaits asynchronous lifecycle handlers before dispatch', async () => {
  const order = [];
  const skill = new AlexaSkill();
  skill.eventHandlers = Object.assign({}, skill.eventHandlers, {
    onSessionStarted: async function () {
      await Promise.resolve();
      order.push('started');
    },
    onLaunch: function (launchRequest, session, response) {
      order.push('launch');
      return response.tell('ready');
    }
  });
  const event = {
    version: '1.0',
    session: {
      new: true,
      sessionId: 'session-id',
      application: {
        applicationId: 'amzn1.echo-sdk-ams.app.test'
      },
      attributes: {}
    },
    request: {
      requestId: 'request-id',
      timestamp: new Date().toISOString(),
      locale: 'en-US',
      type: 'LaunchRequest'
    }
  };

  const response = await skill.execute(event);

  assert.deepEqual(order, ['started', 'launch']);
  assert.equal(response.response.outputSpeech.text, 'ready');
});

test('AlexaSkill preserves Lambda context for custom request handlers', async () => {
  const context = { awsRequestId: 'lambda-request-id' };
  const skill = new AlexaSkill();
  skill.requestHandlers = Object.assign({}, skill.requestHandlers, {
    LaunchRequest: function (event, receivedContext, response) {
      assert.equal(receivedContext, context);
      return response.tell('context preserved');
    }
  });
  const event = {
    version: '1.0',
    session: {
      new: false,
      sessionId: 'session-id',
      application: {
        applicationId: 'amzn1.echo-sdk-ams.app.test'
      },
      attributes: {}
    },
    request: {
      requestId: 'request-id',
      timestamp: new Date().toISOString(),
      locale: 'en-US',
      type: 'LaunchRequest'
    }
  };

  const response = await skill.execute(event, context);

  assert.equal(response.response.outputSpeech.text, 'context preserved');
});

test('response helper accepts explicit PlainText and SSML speech', async () => {
  const plainText = await invokeResponse({
    type: 'PlainText',
    speech: 'Hello from options'
  });
  const ssml = await invokeResponse({
    type: 'SSML',
    speech: '<speak>Hello</speak>'
  });

  assert.equal(plainText.type, 'succeed');
  assert.deepEqual(plainText.response.response.outputSpeech, {
    type: 'PlainText',
    text: 'Hello from options'
  });
  assert.equal(ssml.type, 'succeed');
  assert.deepEqual(ssml.response.response.outputSpeech, {
    type: 'SSML',
    ssml: '<speak>Hello</speak>'
  });
});

test('SSML speech accepts a trimmed speak envelope with opening attributes', async () => {
  const result = await invokeResponse({
    type: 'SSML',
    speech: '  <speak xml:lang="en-US">Hello</speak>  '
  });

  assert.equal(result.type, 'succeed');
  assert.equal(
    result.response.response.outputSpeech.ssml,
    '  <speak xml:lang="en-US">Hello</speak>  '
  );
});

for (const [name, speech] of [
  ['plain text mislabeled as SSML', 'Hello'],
  ['alternate SSML root', '<emphasis>Hello</emphasis>'],
  ['missing speak close tag', '<speak>Hello'],
  ['deceptive speak opening prefix', '<speaker>Hello</speak>'],
  ['deceptive speak closing prefix', '<speak>Hello</speaker>'],
  ['content after speak root', '<speak>Hello</speak><speak>Again</speak>']
]) {
  test(`${name} fails before returning an Alexa response`, async () => {
    const result = await invokeResponse({ type: 'SSML', speech });

    assertFailure(
      result,
      'Invalid speech output: SSML must use a speak envelope'
    );
    assert.doesNotMatch(result.error.message, /Hello|emphasis|speaker/);
  });
}

test('invalid SSML reprompt fails through the shared envelope validation', async () => {
  const result = await invokeAskResponse('Valid primary speech', {
    type: 'SSML',
    speech: '<speak>Missing close'
  });

  assertFailure(
    result,
    'Invalid speech output: SSML must use a speak envelope'
  );
});

for (const [name, output, message] of [
  [
    'missing speech output',
    undefined,
    'Invalid speech output: expected a string or options object'
  ],
  [
    'blank speech output',
    '   ',
    'Invalid speech output: speech must be a non-empty string'
  ],
  [
    'non-string speech content',
    { type: 'PlainText', speech: 42 },
    'Invalid speech output: speech must be a non-empty string'
  ],
  [
    'unsupported speech type',
    { type: 'Audio', speech: 'caller-controlled-type' },
    'Invalid speech output: type must be PlainText or SSML'
  ]
]) {
  test(`${name} fails before returning an Alexa response`, async () => {
    const result = await invokeResponse(output);

    assertFailure(result, message);
    assert.doesNotMatch(result.error.message, /caller-controlled-type/);
  });
}

test('missing reprompt speech fails before returning an Alexa response', async () => {
  const result = await invokeAskResponse('Valid primary speech', undefined);

  assertFailure(
    result,
    'Invalid speech output: expected a string or options object'
  );
});

test('blank reprompt speech fails before returning an Alexa response', async () => {
  const result = await invokeAskResponse('Valid primary speech', {
    type: 'SSML',
    speech: ''
  });

  assertFailure(
    result,
    'Invalid speech output: speech must be a non-empty string'
  );
});

test('HelloWorldIntent returns the hello card and ends the session', async () => {
  const result = await invoke({
    type: 'IntentRequest',
    intent: { name: 'HelloWorldIntent' }
  });

  assert.equal(result.type, 'succeed');
  assert.equal(result.response.response.outputSpeech.text, 'Hello World!');
  assert.equal(result.response.response.card.title, 'Hello World');
  assert.equal(result.response.response.card.content, 'Hello World!');
  assert.equal(result.response.response.shouldEndSession, true);
});

test('help intent returns help prompt and keeps the session open', async () => {
  const result = await invoke({
    type: 'IntentRequest',
    intent: { name: 'AMAZON.HelpIntent' }
  });

  assert.equal(result.type, 'succeed');
  assert.equal(
    result.response.response.outputSpeech.text,
    'You can say hello to me!'
  );
  assert.equal(
    result.response.response.reprompt.outputSpeech.text,
    'You can say hello to me!'
  );
  assert.equal(result.response.response.shouldEndSession, false);
});

test('session ended request completes without a speech response', async () => {
  const result = await invoke({
    type: 'SessionEndedRequest',
    reason: 'USER_INITIATED'
  });

  assert.equal(result.type, 'succeed');
  assert.equal(result.response, undefined);
});

for (const intentName of ['AMAZON.CancelIntent', 'AMAZON.StopIntent']) {
  test(`${intentName} returns goodbye and ends the session`, async () => {
    const result = await invoke({
      type: 'IntentRequest',
      intent: { name: intentName }
    });

    assert.equal(result.type, 'succeed');
    assert.equal(result.response.response.outputSpeech.text, 'Goodbye!');
    assert.equal(result.response.response.shouldEndSession, true);
  });
}

test('unsupported intents fail the lambda invocation', async () => {
  const result = await invoke({
    type: 'IntentRequest',
    intent: { name: 'UnknownIntent' }
  });

  assertFailure(result, 'Unsupported intent');
});

test('inherited intent names are not dispatched', async () => {
  const result = await invoke({
    type: 'IntentRequest',
    intent: { name: 'constructor' }
  });

  assertFailure(result, 'Unsupported intent');
});

test('unsupported intent names are not reflected into logs or failures', async () => {
  const intentName = 'UnknownIntent\nforged-intent-log';
  const result = await invoke(
    {
      type: 'IntentRequest',
      intent: { name: intentName }
    },
    { captureLogs: true }
  );
  const logText = result.logs.join('\n');

  assertFailure(result, 'Unsupported intent');
  assert.doesNotMatch(logText, /UnknownIntent/);
  assert.doesNotMatch(logText, /forged-intent-log/);
});

test('unsupported request types fail with a clear message', async () => {
  const result = await invoke(
    { type: 'AudioPlayer.PlaybackStarted' },
    { captureLogs: true }
  );
  const unsupportedRequestLogs = result.logs.join('\n');

  assertFailure(result, 'Unsupported request type');
  assert.doesNotMatch(unsupportedRequestLogs, /onSessionStarted/);
});

test('non-callable request handlers fail before session lifecycle hooks', async () => {
  let sessionStarts = 0;
  const result = await invoke(
    { type: 'LaunchRequest' },
    {
      handler: function (event) {
        const skill = new AlexaSkill();
        skill.requestHandlers = Object.assign({}, skill.requestHandlers, {
          LaunchRequest: {}
        });
        skill.eventHandlers = Object.assign({}, skill.eventHandlers, {
          onSessionStarted: function () {
            sessionStarts += 1;
          }
        });
        return skill.execute(event);
      }
    }
  );

  assertFailure(result, 'Unsupported request type');
  assert.equal(sessionStarts, 0);
});

test('inherited request type names are not dispatched', async () => {
  const result = await invoke({ type: 'constructor' });

  assertFailure(result, 'Unsupported request type');
});

test('unsupported request types are not reflected into logs or failures', async () => {
  const requestType = 'AudioPlayer.Unknown\nforged-request-log';
  const result = await invoke({ type: requestType }, { captureLogs: true });
  const logText = result.logs.join('\n');

  assertFailure(result, 'Unsupported request type');
  assert.doesNotMatch(logText, /AudioPlayer\.Unknown/);
  assert.doesNotMatch(logText, /forged-request-log/);
});

test('malformed events without an application id fail with a clear message', async () => {
  const result = await invokeEvent({
    version: '1.0',
    session: {
      new: true,
      sessionId: 'session-id',
      attributes: {}
    },
    request: {
      requestId: 'request-id',
      type: 'LaunchRequest'
    }
  });

  assertFailure(
    result,
    'Invalid Alexa event: missing session.application.applicationId'
  );
});

test('malformed events with non-string application ids fail before validation', async () => {
  const result = await invokeEvent({
    version: '1.0',
    session: {
      new: true,
      sessionId: 'session-id',
      application: {
        applicationId: {
          toString() {
            return 'amzn1.echo-sdk-ams.app.test';
          }
        }
      },
      attributes: {}
    },
    request: {
      requestId: 'request-id',
      type: 'LaunchRequest'
    }
  });

  assertFailure(
    result,
    'Invalid Alexa event: session.application.applicationId must be a non-empty string'
  );
});

test('Alexa application identity fields must be own properties', async () => {
  const inheritedIdentity = 'forged-inherited-application-id';
  const request = {
    requestId: 'request-id',
    timestamp: new Date().toISOString(),
    locale: 'en-US',
    type: 'LaunchRequest'
  };
  const validSession = {
    new: true,
    sessionId: 'session-id',
    application: { applicationId: 'amzn1.echo-sdk-ams.app.test' },
    attributes: {}
  };
  const inheritedSessionEvent = Object.assign(
    Object.create({ session: validSession }),
    { version: '1.0', request }
  );
  const inheritedApplicationSession = Object.assign(
    Object.create({
      application: { applicationId: inheritedIdentity }
    }),
    { new: true, sessionId: 'session-id', attributes: {} }
  );
  const inheritedApplicationId = Object.create({
    applicationId: inheritedIdentity
  });
  const inheritedApplicationIdSession = {
    new: true,
    sessionId: 'session-id',
    application: inheritedApplicationId,
    attributes: {}
  };

  for (const event of [
    inheritedSessionEvent,
    { version: '1.0', session: inheritedApplicationSession, request },
    { version: '1.0', session: inheritedApplicationIdSession, request }
  ]) {
    const result = await invokeEvent(event, { captureLogs: true });
    const logText = result.logs.join('\n');

    assertFailure(
      result,
      'Invalid Alexa event: missing session.application.applicationId'
    );
    assert.doesNotMatch(result.error.message, /forged-inherited/);
    assert.doesNotMatch(logText, /forged-inherited/);
  }
});

test('Alexa sessions require their own session ID', async () => {
  const missing = await invoke(
    { type: 'LaunchRequest' },
    { omitSessionId: true }
  );
  const inheritedSession = Object.assign(
    Object.create({ sessionId: 'inherited-session-id' }),
    {
      new: true,
      application: {
        applicationId: 'amzn1.echo-sdk-ams.app.test'
      },
      attributes: {}
    }
  );
  const inherited = await invokeEvent({
    version: '1.0',
    session: inheritedSession,
    request: {
      requestId: 'request-id',
      timestamp: new Date().toISOString(),
      locale: 'en-US',
      type: 'LaunchRequest'
    }
  });

  assertFailure(missing, 'Invalid Alexa event: missing session.sessionId');
  assertFailure(inherited, 'Invalid Alexa event: missing session.sessionId');
});

test('Alexa session IDs must be non-empty strings', async () => {
  for (const sessionId of ['', '   ', 0, null, {}, []]) {
    const result = await invoke({ type: 'LaunchRequest' }, { sessionId });

    assertFailure(
      result,
      'Invalid Alexa event: session.sessionId must be a non-empty string'
    );
  }
});

test('session ID failures do not reflect caller input into logs or failures', async () => {
  const result = await invoke(
    { type: 'LaunchRequest' },
    {
      captureLogs: true,
      sessionId: {
        toString() {
          return 'forged-session\nforged-session-log';
        }
      }
    }
  );

  assertFailure(
    result,
    'Invalid Alexa event: session.sessionId must be a non-empty string'
  );
  assert.doesNotMatch(result.error.message, /forged-session/);
  assert.doesNotMatch(result.logs.join('\n'), /forged-session/);
});

test('session ID shape is validated before lifecycle and application authorization', async () => {
  const configuredHandler = loadHandlerWithSkillId(
    'amzn1.echo-sdk-ams.app.expected'
  );
  const result = await invoke(
    { type: 'LaunchRequest', requestId: undefined },
    {
      applicationId: 'amzn1.echo-sdk-ams.app.other',
      handler: configuredHandler,
      sessionId: 42,
      sessionNew: 'false'
    }
  );

  assertFailure(
    result,
    'Invalid Alexa event: session.sessionId must be a non-empty string'
  );
});

test('Alexa sessions require their own new-session flag', async () => {
  const missing = await invoke(
    { type: 'LaunchRequest' },
    { omitSessionNew: true }
  );

  const inheritedSession = Object.assign(Object.create({ new: true }), {
    sessionId: 'session-id',
    application: {
      applicationId: 'amzn1.echo-sdk-ams.app.test'
    },
    attributes: {}
  });
  const inherited = await invokeEvent({
    version: '1.0',
    session: inheritedSession,
    request: {
      requestId: 'request-id',
      timestamp: new Date().toISOString(),
      locale: 'en-US',
      type: 'LaunchRequest'
    }
  });

  assertFailure(missing, 'Invalid Alexa event: missing session.new');
  assertFailure(inherited, 'Invalid Alexa event: missing session.new');
});

test('Alexa session new flags must be booleans', async () => {
  for (const sessionNew of ['false', 0, 1, null, {}, []]) {
    const result = await invoke({ type: 'LaunchRequest' }, { sessionNew });

    assertFailure(result, 'Invalid Alexa event: session.new must be a boolean');
  }
});

test('false session new flags skip session-start lifecycle only', async () => {
  const result = await invoke(
    { type: 'LaunchRequest' },
    { captureLogs: true, sessionNew: false }
  );
  const logText = result.logs.join('\n');

  assert.equal(result.type, 'succeed');
  assert.doesNotMatch(logText, /HelloWorld onSessionStarted/);
  assert.match(logText, /HelloWorld onLaunch/);
});

test('session new shape is validated before request and application authorization', async () => {
  const configuredHandler = loadHandlerWithSkillId(
    'amzn1.echo-sdk-ams.app.expected'
  );
  const result = await invoke(
    { type: 'LaunchRequest', requestId: undefined, timestamp: undefined },
    {
      applicationId: 'amzn1.echo-sdk-ams.app.other',
      handler: configuredHandler,
      sessionNew: 'false'
    }
  );

  assertFailure(result, 'Invalid Alexa event: session.new must be a boolean');
});

test('malformed events without a request type fail with a clear message', async () => {
  const result = await invokeEvent({
    version: '1.0',
    session: {
      new: true,
      sessionId: 'session-id',
      application: {
        applicationId: 'amzn1.echo-sdk-ams.app.test'
      },
      attributes: {}
    },
    request: {
      requestId: 'request-id'
    }
  });

  assertFailure(result, 'Invalid Alexa event: missing request.type');
});

test('Alexa events require their own request envelope', async () => {
  const inheritedRequest = {
    requestId: 'inherited-request-id',
    timestamp: new Date().toISOString(),
    locale: 'en-US',
    type: 'LaunchRequest'
  };
  const event = Object.assign(Object.create({ request: inheritedRequest }), {
    version: '1.0',
    session: {
      new: true,
      sessionId: 'session-id',
      application: {
        applicationId: 'amzn1.echo-sdk-ams.app.test'
      },
      attributes: {}
    }
  });

  const result = await invokeEvent(event);

  assertFailure(result, 'Invalid Alexa event: missing request.type');
});

test('malformed events with non-string request types fail before dispatch', async () => {
  const result = await invokeEvent({
    version: '1.0',
    session: {
      new: true,
      sessionId: 'session-id',
      application: {
        applicationId: 'amzn1.echo-sdk-ams.app.test'
      },
      attributes: {}
    },
    request: {
      requestId: 'request-id',
      type: {
        toString() {
          return 'LaunchRequest';
        }
      }
    }
  });

  assertFailure(
    result,
    'Invalid Alexa event: request.type must be a non-empty string'
  );
});

test('malformed session attributes are reset before responses are built', async () => {
  const result = await invokeEvent({
    version: '1.0',
    session: {
      new: true,
      sessionId: 'session-id',
      application: {
        applicationId: 'amzn1.echo-sdk-ams.app.test'
      },
      attributes: 'not-an-object'
    },
    request: {
      requestId: 'request-id',
      timestamp: new Date().toISOString(),
      locale: 'en-US',
      type: 'LaunchRequest'
    }
  });

  assert.equal(result.type, 'succeed');
  assert.deepEqual(result.response.sessionAttributes, {});
});

test('inherited session attributes are reset before responses are built', async () => {
  let interceptedAttributes;
  const sessionPrototype = {};
  Object.defineProperty(sessionPrototype, 'attributes', {
    get() {
      return { inherited: 'must-not-reach-response' };
    },
    set(value) {
      interceptedAttributes = value;
    }
  });
  const session = Object.create(sessionPrototype);
  Object.assign(session, {
    new: true,
    sessionId: 'session-id',
    application: {
      applicationId: 'amzn1.echo-sdk-ams.app.test'
    }
  });

  const result = await invokeEvent({
    version: '1.0',
    session,
    request: {
      requestId: 'request-id',
      timestamp: new Date().toISOString(),
      locale: 'en-US',
      type: 'LaunchRequest'
    }
  });

  assert.equal(result.type, 'succeed');
  assert.deepEqual(result.response.sessionAttributes, {});
  assert.equal(result.response.sessionAttributes.inherited, undefined);
  assert.equal(interceptedAttributes, undefined);
  assert.equal(Object.hasOwn(session, 'attributes'), true);
});

test('Alexa requests require their own request ID', async () => {
  const result = await invoke(
    { type: 'LaunchRequest' },
    { omitRequestId: true }
  );

  assertFailure(result, 'Invalid Alexa event: missing request.requestId');
});

test('Alexa request IDs must be non-empty strings', async () => {
  for (const requestId of ['', '   ', 42, {}, []]) {
    const result = await invoke({ type: 'LaunchRequest', requestId });

    assertFailure(
      result,
      'Invalid Alexa event: request.requestId must be a non-empty string'
    );
  }
});

test('inherited Alexa request IDs are rejected', async () => {
  const request = Object.create({ requestId: 'inherited-request-id' });
  request.type = 'LaunchRequest';
  request.timestamp = new Date().toISOString();

  const result = await invokeEvent({
    version: '1.0',
    session: {
      new: true,
      sessionId: 'session-id',
      application: {
        applicationId: 'amzn1.echo-sdk-ams.app.test'
      },
      attributes: {}
    },
    request
  });

  assertFailure(result, 'Invalid Alexa event: missing request.requestId');
});

test('request ID failures do not reflect caller input into logs or failures', async () => {
  const requestId = {
    toString() {
      return 'forged-request-id\nforged-request-id-log';
    }
  };
  const result = await invoke(
    { type: 'LaunchRequest', requestId },
    { captureLogs: true }
  );
  const logText = result.logs.join('\n');

  assertFailure(
    result,
    'Invalid Alexa event: request.requestId must be a non-empty string'
  );
  assert.doesNotMatch(result.error.message, /forged-request-id/);
  assert.doesNotMatch(logText, /forged-request-id/);
});

test('request ID shape is validated before timestamp and application id authorization', async () => {
  const result = await invoke(
    {
      type: 'LaunchRequest',
      timestamp: '2000-01-01T00:00:00.000Z'
    },
    {
      applicationId: 'amzn1.echo-sdk-ams.app.untrusted',
      handler: loadHandlerWithSkillId('amzn1.echo-sdk-ams.app.trusted'),
      omitRequestId: true
    }
  );

  assertFailure(result, 'Invalid Alexa event: missing request.requestId');
});

test('Alexa requests require a timestamp', async () => {
  const result = await invoke(
    { type: 'LaunchRequest' },
    { omitTimestamp: true }
  );

  assertFailure(result, 'Invalid Alexa event: missing request.timestamp');
});

test('Alexa request timestamps must be non-empty strings', async () => {
  for (const timestamp of ['', '   ', 42, {}, []]) {
    const result = await invoke({ type: 'LaunchRequest', timestamp });

    assertFailure(
      result,
      'Invalid Alexa event: request.timestamp must be a non-empty string'
    );
  }
});

test('Alexa request timestamps must be valid ISO 8601 UTC values', async () => {
  for (const timestamp of [
    'not-a-date',
    '2026-06-13 12:00:00Z',
    '2026-06-13T12:00:00+00:00',
    '2026-02-30T12:00:00Z',
    '2026-06-13T12:00:00.Z'
  ]) {
    const result = await invoke({ type: 'LaunchRequest', timestamp });

    assertFailure(
      result,
      'Invalid Alexa event: request.timestamp must be an ISO 8601 UTC string'
    );
  }
});

test('Alexa request timestamps accept fractional-second precision', async () => {
  const now = Date.parse('2026-06-13T12:00:00.123Z');
  const result = await invoke(
    {
      type: 'LaunchRequest',
      timestamp: '2026-06-13T12:00:00.123456Z'
    },
    {
      handler: responseHandler('fresh request', undefined, false, () => now)
    }
  );

  assert.equal(result.type, 'succeed');
  assert.equal(result.response.response.outputSpeech.text, 'fresh request');
});

test('Alexa request timestamps accept both 150-second freshness boundaries', async () => {
  const now = Date.parse('2026-06-13T12:00:00.000Z');
  const handlerAtNow = responseHandler(
    'fresh request',
    undefined,
    false,
    () => now
  );

  for (const offset of [-150000, 150000]) {
    const result = await invoke(
      {
        type: 'LaunchRequest',
        timestamp: new Date(now + offset).toISOString()
      },
      { handler: handlerAtNow }
    );

    assert.equal(result.type, 'succeed');
    assert.equal(result.response.response.outputSpeech.text, 'fresh request');
  }
});

test('Alexa request timestamps reject stale and excessive future values', async () => {
  const now = Date.parse('2026-06-13T12:00:00.000Z');
  const handlerAtNow = responseHandler(
    'fresh request',
    undefined,
    false,
    () => now
  );

  for (const offset of [-150001, 150001]) {
    const result = await invoke(
      {
        type: 'LaunchRequest',
        timestamp: new Date(now + offset).toISOString()
      },
      { handler: handlerAtNow }
    );

    assertFailure(
      result,
      'Invalid Alexa event: request.timestamp is outside the allowed freshness window'
    );
  }
});

test('timestamp failures do not reflect caller input into logs or failures', async () => {
  const timestamp = 'forged-timestamp\nforged-timestamp-log';
  const result = await invoke(
    { type: 'LaunchRequest', timestamp },
    { captureLogs: true }
  );
  const logText = result.logs.join('\n');

  assertFailure(
    result,
    'Invalid Alexa event: request.timestamp must be an ISO 8601 UTC string'
  );
  assert.doesNotMatch(result.error.message, /forged-timestamp/);
  assert.doesNotMatch(logText, /forged-timestamp/);
});

test('timestamp freshness is validated before application id authorization', async () => {
  const configuredHandler = loadHandlerWithSkillId(
    'amzn1.echo-sdk-ams.app.expected'
  );
  const result = await invoke(
    {
      type: 'LaunchRequest',
      timestamp: '2000-01-01T00:00:00.000Z'
    },
    {
      applicationId: 'amzn1.echo-sdk-ams.app.other',
      handler: configuredHandler
    }
  );

  assertFailure(
    result,
    'Invalid Alexa event: request.timestamp is outside the allowed freshness window'
  );
});

test('Alexa requests require their own locale', async () => {
  const missing = await invoke({ type: 'LaunchRequest' }, { omitLocale: true });
  const inheritedRequest = Object.assign(Object.create({ locale: 'en-US' }), {
    type: 'LaunchRequest',
    requestId: 'request-id',
    timestamp: new Date().toISOString()
  });
  const inherited = await invokeEvent({
    version: '1.0',
    session: {
      new: true,
      sessionId: 'session-id',
      application: { applicationId: 'amzn1.echo-sdk-ams.app.test' },
      attributes: {}
    },
    request: inheritedRequest
  });

  assertFailure(missing, 'Invalid Alexa event: missing request.locale');
  assertFailure(inherited, 'Invalid Alexa event: missing request.locale');
});

test('Alexa request locales must be non-empty strings', async () => {
  for (const locale of ['', '   ', 1, null, {}, []]) {
    const result = await invoke({ type: 'LaunchRequest' }, { locale });

    assertFailure(
      result,
      'Invalid Alexa event: request.locale must be a non-empty string'
    );
  }
});

test('Alexa request locales accept future non-empty string values', async () => {
  const result = await invoke(
    { type: 'LaunchRequest', futureRequestProperty: { ignored: true } },
    { locale: 'en-XY' }
  );

  assert.equal(result.type, 'succeed');
});

test('locale shape is validated before lifecycle and application authorization', async () => {
  const configuredHandler = loadHandlerWithSkillId(
    'amzn1.echo-sdk-ams.app.expected'
  );
  const result = await invoke(
    { type: 'LaunchRequest' },
    {
      applicationId: 'amzn1.echo-sdk-ams.app.other',
      captureLogs: true,
      handler: configuredHandler,
      locale: 42
    }
  );

  assertFailure(
    result,
    'Invalid Alexa event: request.locale must be a non-empty string'
  );
  assert.doesNotMatch(result.logs.join('\n'), /onSessionStarted/);
});

test('malformed intent requests fail with a clear message', async () => {
  const result = await invoke({
    type: 'IntentRequest',
    intent: {}
  });

  assertFailure(result, 'Invalid intent request: missing intent.name');
});

test('inherited intent envelopes are rejected before dispatch', async () => {
  const request = Object.create({
    intent: { name: 'HelloWorldIntent' }
  });
  request.type = 'IntentRequest';
  request.requestId = 'request-id';
  request.timestamp = new Date().toISOString();
  request.locale = 'en-US';

  const result = await invokeEvent({
    version: '1.0',
    session: {
      new: true,
      sessionId: 'session-id',
      application: {
        applicationId: 'amzn1.echo-sdk-ams.app.test'
      },
      attributes: {}
    },
    request
  });

  assertFailure(result, 'Invalid intent request: missing intent.name');
});

test('malformed intent requests with non-string names fail before dispatch', async () => {
  const result = await invoke({
    type: 'IntentRequest',
    intent: {
      name: {
        toString() {
          return 'HelloWorldIntent';
        }
      }
    }
  });

  assertFailure(
    result,
    'Invalid intent request: intent.name must be a non-empty string'
  );
});

test('configured Alexa skill id rejects requests from another application', async () => {
  const configuredHandler = loadHandlerWithSkillId(
    'amzn1.echo-sdk-ams.app.expected'
  );
  const result = await invoke(
    { type: 'LaunchRequest' },
    {
      applicationId: 'amzn1.echo-sdk-ams.app.other',
      handler: configuredHandler
    }
  );

  assertFailure(result, 'Invalid applicationId');
});

test('configured Alexa skill id trims configured values', async () => {
  assert.equal(
    configuredSkillId('  amzn1.echo-sdk-ams.app.expected  '),
    'amzn1.echo-sdk-ams.app.expected'
  );

  const configuredHandler = loadHandlerWithSkillId(
    '  amzn1.echo-sdk-ams.app.expected  '
  );
  const result = await invoke(
    { type: 'LaunchRequest' },
    {
      applicationId: 'amzn1.echo-sdk-ams.app.expected',
      handler: configuredHandler
    }
  );

  assert.equal(result.type, 'succeed');
});

test('blank configured Alexa skill id leaves application validation disabled', async () => {
  assert.equal(configuredSkillId('   '), undefined);

  const configuredHandler = loadHandlerWithSkillId('   ');
  const result = await invoke(
    { type: 'LaunchRequest' },
    {
      applicationId: 'amzn1.echo-sdk-ams.app.any',
      handler: configuredHandler
    }
  );

  assert.equal(result.type, 'succeed');
});

test('local module loading permits a missing Alexa skill id', () => {
  assert.equal(requiredSkillId(undefined, undefined), undefined);
  assert.equal(
    loadIndexWithEnvironment().configuredSkillId(undefined),
    undefined
  );
});

test('Lambda requires a non-empty Alexa skill id', () => {
  for (const skillId of [undefined, '   ', 42]) {
    assert.throws(
      () => requiredSkillId(skillId, 'hello-world-production'),
      (error) => {
        assert.ok(error instanceof Error);
        assert.equal(
          error.message,
          'ALEXA_SKILL_ID must be configured in AWS Lambda'
        );
        assert.doesNotMatch(error.message, /hello-world-production/);
        return true;
      }
    );
  }
});

test('Lambda module loading fails before exporting an unguarded handler', () => {
  for (const skillId of [undefined, '   ']) {
    assert.throws(
      () =>
        loadIndexWithEnvironment({
          skillId,
          lambdaFunctionName: 'hello-world-production'
        }),
      /^Error: ALEXA_SKILL_ID must be configured in AWS Lambda$/
    );
  }
});

test('Lambda module loading accepts a configured trimmed Alexa skill id', async () => {
  const configuredHandler = loadHandlerWithSkillId(
    '  amzn1.echo-sdk-ams.app.expected  ',
    'hello-world-production'
  );
  const result = await invoke(
    { type: 'LaunchRequest' },
    {
      applicationId: 'amzn1.echo-sdk-ams.app.expected',
      handler: configuredHandler
    }
  );

  assert.equal(result.type, 'succeed');
});

test('routine logs do not include raw Alexa request identifiers', async () => {
  const result = await invoke(
    { type: 'LaunchRequest' },
    {
      applicationId: 'amzn1.echo-sdk-ams.app.private',
      captureLogs: true
    }
  );
  const logText = result.logs.join('\n');

  assert.equal(result.type, 'succeed');
  assert.match(logText, /HelloWorld onSessionStarted/);
  assert.match(logText, /HelloWorld onLaunch/);
  assert.doesNotMatch(logText, /request-id/);
  assert.doesNotMatch(logText, /session-id/);
  assert.doesNotMatch(logText, /amzn1\.echo-sdk-ams\.app\.private/);
});

test('application id rejection logs do not include compared identifiers', async () => {
  const configuredHandler = loadHandlerWithSkillId(
    'amzn1.echo-sdk-ams.app.expected-private'
  );
  const result = await invoke(
    { type: 'LaunchRequest' },
    {
      applicationId: 'amzn1.echo-sdk-ams.app.other-private',
      captureLogs: true,
      handler: configuredHandler
    }
  );
  const logText = result.logs.join('\n');

  assertFailure(result, 'Invalid applicationId');
  assert.match(logText, /configured skill id/);
  assert.doesNotMatch(logText, /expected-private/);
  assert.doesNotMatch(logText, /other-private/);
});

test('handler exceptions retain failure details without reflecting them into logs', async () => {
  const sensitiveError = new Error(
    'private handler detail\nforged-exception-log'
  );
  const result = await invoke(
    { type: 'LaunchRequest' },
    { captureLogs: true, handler: throwingResponseHandler(sensitiveError) }
  );
  const logText = result.logs.join('\n');

  assert.equal(result.type, 'fail');
  assert.equal(result.error, sensitiveError);
  assert.match(result.error.stack, /^Error: private handler detail/);
  assert.match(logText, /Alexa request failed/);
  assert.doesNotMatch(logText, /private handler detail/);
  assert.doesNotMatch(logText, /forged-exception-log/);
});
