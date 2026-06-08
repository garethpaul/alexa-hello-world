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

    return new Promise((resolve) => {
        const requestHandler = options.handler || handler;

        requestHandler(event, {
            succeed: (response) => resolve({ type: 'succeed', response }),
            fail: (error) => resolve({ type: 'fail', error })
        });
    });
}

test('launch request returns welcome prompt and keeps the session open', async () => {
    const result = await invoke({ type: 'LaunchRequest' });

    assert.equal(result.type, 'succeed');
    assert.equal(
        result.response.response.outputSpeech.text,
        'Welcome to the Alexa Skills Kit, you can say hello'
    );
    assert.equal(result.response.response.reprompt.outputSpeech.text, 'You can say hello');
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
    assert.equal(result.response.response.outputSpeech.text, 'You can say hello to me!');
    assert.equal(result.response.response.reprompt.outputSpeech.text, 'You can say hello to me!');
    assert.equal(result.response.response.shouldEndSession, false);
});

test('unsupported intents fail the lambda invocation', async () => {
    const result = await invoke({
        type: 'IntentRequest',
        intent: { name: 'UnknownIntent' }
    });

    assert.equal(result.type, 'fail');
    assert.equal(result.error, 'Unsupported intent = UnknownIntent');
});

test('configured Alexa skill id rejects requests from another application', async () => {
    const configuredHandler = loadHandlerWithSkillId('amzn1.echo-sdk-ams.app.expected');
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
