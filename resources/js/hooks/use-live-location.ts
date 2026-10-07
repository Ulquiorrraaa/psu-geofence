import { useEffect, useRef, useState } from 'react';

export type LivePosition = {
    latitude: number;
    longitude: number;
    accuracy: number;
    timestamp: number;
};

function availabilityError(): string | null {
    if (typeof window === 'undefined') {
        return null;
    }

    if (!window.isSecureContext) {
        return 'Location requires HTTPS or localhost. Open the portal using a secure address.';
    }

    if (!navigator.geolocation) {
        return 'Geolocation is not supported by this browser.';
    }

    return null;
}

export function useLiveLocation() {
    // Never hydrate the current position from props, storage, or attendance records.
    const [tracking, setTracking] = useState(true);
    const [position, setPosition] = useState<LivePosition | null>(null);
    const [gpsError, setGpsError] = useState<string | null>(availabilityError);
    const stopWatch = useRef<(() => void) | null>(null);

    useEffect(() => {
        if (!tracking || availabilityError()) {
            return;
        }

        const geolocation = navigator.geolocation;
        let active = true;
        const requestedAt = Date.now();
        let lastTimestamp = requestedAt;
        let watchId: number | null = null;
        const stop = () => {
            active = false;

            if (watchId !== null) {
                geolocation.clearWatch(watchId);
                watchId = null;
            }
        };
        stopWatch.current = stop;

        const fail = (message: string) => {
            setPosition(null);
            setGpsError(message);
        };

        try {
            watchId = geolocation.watchPosition(
                (result) => {
                    if (!active) {
                        return;
                    }

                    const { latitude, longitude, accuracy } = result.coords;

                    if (
                        !Number.isFinite(latitude) ||
                        Math.abs(latitude) > 90 ||
                        !Number.isFinite(longitude) ||
                        Math.abs(longitude) > 180 ||
                        !Number.isFinite(accuracy) ||
                        accuracy < 0 ||
                        !Number.isFinite(result.timestamp) ||
                        result.timestamp < lastTimestamp
                    ) {
                        fail(
                            'The browser returned an invalid or old location. Turn GPS off and on to try again.',
                        );

                        return;
                    }

                    lastTimestamp = result.timestamp;
                    setPosition({
                        latitude,
                        longitude,
                        accuracy,
                        timestamp: result.timestamp,
                    });
                    setGpsError(null);
                },
                (error) => {
                    if (!active) {
                        return;
                    }

                    switch (error.code) {
                        case 1:
                            fail(
                                'Location permission denied. Allow location access in your browser and turn GPS on again.',
                            );
                            stop();
                            setTracking(false);
                            break;
                        case 2:
                            fail(
                                'Location unavailable. Enable device location services/GPS, move near a window or outdoors, and try again.',
                            );
                            break;
                        case 3:
                            fail(
                                'Location request timed out after 15 seconds. Move near a window or outdoors. GPS is still trying; toggle off and on to retry.',
                            );
                            break;
                        default:
                            fail(
                                'Unable to read your location. Turn GPS off and on to try again.',
                            );
                    }
                },
                { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
            );
        } catch {
            queueMicrotask(() => {
                if (active) {
                    fail(
                        'Unable to start GPS. Check browser location permissions and device location services.',
                    );
                    stop();
                    setTracking(false);
                }
            });
        }

        return () => {
            stop();
            stopWatch.current = null;
        };
    }, [tracking]);

    function toggleTracking() {
        // Stop immediately so already queued callbacks cannot restore an old fix.
        stopWatch.current?.();
        setPosition(null);
        setGpsError(availabilityError());
        setTracking(!tracking);
    }

    return { tracking, position, gpsError, toggleTracking };
}
