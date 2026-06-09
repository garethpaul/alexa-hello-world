const assert = require('node:assert/strict');
const test = require('node:test');

delete process.env.ALEXA_SKILL_ID;
const { handler } = require('../src/index');

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

    requestHandler(event, {
      succeed: (response) => resolve({ type: 'succeed', response }),
      fail: (error) => resolve({ type: 'fail', error })
    });
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

test('unsupported request types fail with a clear message', async () => {
  const result = await invoke({ type: 'AudioPlayer.PlaybackStarted' });

  assert.equal(result.type, 'fail');
  assert.equal(
    result.error,
    'Unsupported request type = AudioPlayer.PlaybackStarted'
  );
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

test('malformed intent requests fail with a clear message', async () => {
  const result = await invoke({
    type: 'IntentRequest',
    intent: {}
  });

  assert.equal(result.type, 'fail');
  assert.equal(result.error, 'Invalid intent request: missing intent.name');
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
