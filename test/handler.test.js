const assert = require('node:assert/strict');
const test = require('node:test');

delete process.env.ALEXA_SKILL_ID;
const { configuredSkillId, handler } = require('../src/index');

function loadHandlerWithSkillId(skillId) {
  const modulePath = require.resolve('../src/index');
  delete require.cache[modulePath];

  if (skillId) {
    process.env.ALEXA_SKILL_ID = skillId;
  } else {
    delete process.env.ALEXA_SKILL_ID;
  }

  return require('../src/index').handler;
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

  assert.equal(result.type, 'fail');
  assert.equal(result.error, 'Unsupported intent = UnknownIntent');
});

test('inherited intent names are not dispatched', async () => {
  const result = await invoke({
    type: 'IntentRequest',
    intent: { name: 'constructor' }
  });

  assert.equal(result.type, 'fail');
  assert.equal(result.error, 'Unsupported intent = constructor');
});

test('unsupported request types fail with a clear message', async () => {
  const result = await invoke({ type: 'AudioPlayer.PlaybackStarted' });

  assert.equal(result.type, 'fail');
  assert.equal(
    result.error,
    'Unsupported request type = AudioPlayer.PlaybackStarted'
  );
});

test('inherited request type names are not dispatched', async () => {
  const result = await invoke({ type: 'constructor' });

  assert.equal(result.type, 'fail');
  assert.equal(result.error, 'Unsupported request type = constructor');
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

  assert.equal(result.type, 'fail');
  assert.equal(
    result.error,
    'Invalid Alexa event: missing session.application.applicationId'
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

  assert.equal(result.type, 'fail');
  assert.equal(result.error, 'Invalid Alexa event: missing request.type');
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

  assert.equal(result.type, 'fail');
  assert.equal(
    result.error,
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

  assert.equal(result.type, 'fail');
  assert.equal(result.error, 'Invalid intent request: missing intent.name');
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

  assert.equal(result.type, 'fail');
  assert.equal(
    result.error,
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

  assert.equal(result.type, 'fail');
  assert.equal(result.error, 'Invalid applicationId');
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

  assert.equal(result.type, 'fail');
  assert.equal(result.error, 'Invalid applicationId');
  assert.match(logText, /configured skill id/);
  assert.doesNotMatch(logText, /expected-private/);
  assert.doesNotMatch(logText, /other-private/);
});
