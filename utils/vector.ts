
import type { Vector2D } from './types';

export const V = {
    create: (x = 0, y = 0): Vector2D => ({ x, y }),
    add: (v1: Vector2D, v2: Vector2D): Vector2D => ({ x: v1.x + v2.x, y: v1.y + v2.y }),
    sub: (v1: Vector2D, v2: Vector2D): Vector2D => ({ x: v1.x - v2.x, y: v1.y - v2.y }),
    mult: (v: Vector2D, scalar: number): Vector2D => ({ x: v.x * scalar, y: v.y * scalar }),
    div: (v: Vector2D, scalar: number): Vector2D => ({ x: v.x / scalar, y: v.y / scalar }),
    mag: (v: Vector2D): number => Math.sqrt(v.x * v.x + v.y * v.y),
    normalize: (v: Vector2D): Vector2D => {
        const magnitude = V.mag(v);
        return magnitude > 0 ? V.div(v, magnitude) : V.create();
    },
    distance: (v1: Vector2D, v2: Vector2D): number => V.mag(V.sub(v1, v2)),
    angle: (v: Vector2D): number => Math.atan2(v.y, v.x),
    fromAngle: (angle: number, magnitude = 1): Vector2D => ({
        x: Math.cos(angle) * magnitude,
        y: Math.sin(angle) * magnitude,
    }),
    rotate: (v: Vector2D, angle: number): Vector2D => ({
        x: v.x * Math.cos(angle) - v.y * Math.sin(angle),
        y: v.x * Math.sin(angle) + v.y * Math.cos(angle),
    }),
    dot: (v1: Vector2D, v2: Vector2D): number => v1.x * v2.x + v1.y * v2.y,
    limit: (v: Vector2D, max: number): Vector2D => {
        if (V.mag(v) > max) {
            return V.mult(V.normalize(v), max);
        }
        return v;
    }
};
