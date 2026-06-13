const assert = require('node:assert/strict');
const test = require('node:test');

delete process.env.ALEXA_SKILL_ID;
delete process.env.AWS_LAMBDA_FUNCTION_NAME;
const AlexaSkill = require('../src/AlexaSkill');
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

    try {
      requestHandler(event, {
        succeed: (response) => finish({ type: 'succeed', response }),
        fail: (error) => finish({ type: 'fail', error })
      });
    } catch (error) {
      finish({ type: 'throw', error });
    }
  });
}

function invoke(request, options = {}) {
  const event = {
    session: {
      new: true,
      sessionId: 'session-id',
      application: {
        applicationId: options.applicationId || 'amzn1.echo-sdk-ams.app.test'
      },
      attributes: {}
    },
    request: Object.assign({ requestId: 'request-id' }, request)
  };

  return invokeEvent(event, options);
}

function assertFailure(result, message) {
  assert.equal(result.type, 'fail');
  assert.ok(result.error instanceof Error);
  assert.equal(result.error.message, message);
  assert.match(result.error.stack, /^Error: /);
}

function responseHandler(output, reprompt, shouldAsk) {
  return function (event, context) {
    const skill = new AlexaSkill();
    skill.eventHandlers = Object.assign({}, skill.eventHandlers, {
      onLaunch: function (launchRequest, session, response) {
        if (shouldAsk) {
          response.ask(output, reprompt);
        } else {
          response.tell(output);
        }
      }
    });
    skill.execute(event, context);
  };
}

function throwingResponseHandler(error) {
  return function (event, context) {
    const skill = new AlexaSkill();
    skill.eventHandlers = Object.assign({}, skill.eventHandlers, {
      onLaunch: function () {
        throw error;
      }
    });
    skill.execute(event, context);
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
  const result = await invoke({ type: 'AudioPlayer.PlaybackStarted' });

  assertFailure(result, 'Unsupported request type');
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

test('malformed events without a request type fail with a clear message', async () => {
  const result = await invokeEvent({
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

test('malformed events with non-string request types fail before dispatch', async () => {
  const result = await invokeEvent({
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
      type: 'LaunchRequest'
    }
  });

  assert.equal(result.type, 'succeed');
  assert.deepEqual(result.response.sessionAttributes, {});
});

test('malformed intent requests fail with a clear message', async () => {
  const result = await invoke({
    type: 'IntentRequest',
    intent: {}
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
