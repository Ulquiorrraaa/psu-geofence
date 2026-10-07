const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');
const vm = require('node:vm');
const ts = require('typescript');

// Execute the production hook with deterministic browser and React hook adapters.
// No simulated coordinates are bundled into the application.
function setup({ secure = true, supported = true, throws = false } = {}) {
    const slots = [];
    const effects = [];
    const watches = [];
    const cleared = [];
    let cursor = 0;
    let effectCursor = 0;
    let pending = [];
    const react = {
        useState(initial) {
            const index = cursor++;

            if (!(index in slots)) {
slots[index] = typeof initial === 'function' ? initial() : initial;
}

            return [slots[index], (value) => {
 slots[index] = typeof value === 'function' ? value(slots[index]) : value; 
}];
        },
        useRef(initial) {
            const index = cursor++;

            if (!(index in slots)) {
slots[index] = { current: initial };
}

            return slots[index];
        },
        useEffect(callback, dependencies) {
            const index = effectCursor++;
            const previous = effects[index];

            if (!previous || dependencies.some((value, i) => value !== previous.dependencies[i])) {
                pending.push(() => {
                    previous?.cleanup?.();
                    effects[index] = { dependencies, cleanup: callback() };
                });
            }
        },
    };
    const geolocation = {
        watchPosition(success, error, options) {
            if (throws) {
throw new Error('Provider unavailable');
}

            watches.push({ success, error, options });

            return watches.length - 1;
        },
        clearWatch(id) {
 cleared.push(id); 
},
    };
    const source = fs.readFileSync('resources/js/hooks/use-live-location.ts', 'utf8');
    const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
    const context = { exports: {}, require: () => react, window: { isSecureContext: secure },
        navigator: supported ? { geolocation } : {}, Date, Number, Math, queueMicrotask };
    vm.runInNewContext(compiled, context);
    const render = () => {
        cursor = 0;
        effectCursor = 0;
        const result = context.exports.useLiveLocation();
        const callbacks = pending;
        pending = [];
        callbacks.forEach((callback) => callback());

        return result;
    };

    return { render, watches, cleared, unmount: () => effects.forEach((effect) => effect.cleanup?.()) };
}
const fix = (latitude = -14.921534123, longitude = -120.589347123, accuracy = 8, timestamp = Date.now() + 1000) =>
    ({ coords: { latitude, longitude, accuracy }, timestamp });

test('fresh high-accuracy watch updates exact coordinates and reported accuracy', () => {
    const app = setup();
    assert.equal(app.render().position, null);
    assert.equal(JSON.stringify(app.watches[0].options), JSON.stringify({ enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }));
    app.watches[0].success(fix());
    let state = app.render();
    assert.equal(state.position.latitude, -14.921534123);
    assert.equal(state.position.longitude, -120.589347123);
    assert.equal(state.position.accuracy, 8);
    app.watches[0].success(fix(14.000001, 120.000001, 80, Date.now() + 2000));
    state = app.render();
    assert.equal(state.position.latitude, 14.000001);
    assert.equal(state.position.accuracy, 80);
});

test('OFF clears watch ID zero and blocks queued fixes; ON and refresh begin empty', () => {
    const app = setup();
    app.render();
    app.watches[0].success(fix());
    app.render().toggleTracking();
    assert.ok(app.cleared.includes(0));
    app.watches[0].success(fix());
    assert.equal(app.render().position, null);
    assert.equal(app.render().tracking, false);
    app.render().toggleTracking();
    assert.equal(app.render().position, null);
    assert.equal(app.watches.length, 2);
    app.unmount();
    assert.ok(app.cleared.includes(1));
    assert.equal(setup().render().position, null);
});

for (const [code, message] of [[1, /permission denied/], [2, /Enable device location/], [3, /timed out/]]) {
    test('location error ' + code + ' clears the previous fix and reports recovery guidance', () => {
        const app = setup();
        app.render();
        app.watches[0].success(fix());
        app.watches[0].error({ code });
        const state = app.render();
        assert.equal(state.position, null);
        assert.match(state.gpsError, message);

        if (code === 1) {
            assert.equal(state.tracking, false);
            assert.ok(app.cleared.includes(0));
        } else {
            app.watches[0].success(fix(14.1, 120.1, 12, Date.now() + 2000));
            assert.equal(app.render().gpsError, null);
            assert.equal(app.render().position.accuracy, 12);
        }
    });
}

test('insecure and unsupported contexts never start a watcher', () => {
    for (const options of [{ secure: false }, { supported: false }]) {
        const app = setup(options);
        assert.ok(app.render().gpsError);
        assert.equal(app.watches.length, 0);
    }
});

test('cached, out-of-order, and invalid fixes never become current location', () => {
    const app = setup();
    app.render();
    app.watches[0].success(fix(14, 120, 8, Date.now() - 10000));
    assert.equal(app.render().position, null);
    app.watches[0].success(fix());
    app.watches[0].success(fix(14, 120, 8, Date.now() - 1000));
    assert.equal(app.render().position, null);
    app.watches[0].success(fix(91));
    assert.equal(app.render().position, null);
});

test('provider startup exceptions are handled', async () => {
    const app = setup({ throws: true });
    app.render();
    await Promise.resolve();
    assert.match(app.render().gpsError, /Unable to start GPS/);
    assert.equal(app.render().tracking, false);
});
