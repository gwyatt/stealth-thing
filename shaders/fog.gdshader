shader_type canvas_item;
// Slowly drifting ground fog.
uniform vec4 fog_color : source_color = vec4(0.6, 0.7, 0.75, 1.0);
uniform float density = 0.35;
uniform float speed = 0.015;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
	vec2 i = floor(p), f = fract(p);
	vec2 u = f * f * (3.0 - 2.0 * f);
	return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}
float fbm(vec2 p) {
	float v = 0.0, a = 0.5;
	for (int i = 0; i < 5; i++) { v += a * noise(p); p *= 2.03; a *= 0.5; }
	return v;
}

void fragment() {
	vec2 p = UV * vec2(4.0, 1.4);
	float n = fbm(p + vec2(TIME * speed * 6.0, 0.0)) * 0.6 + fbm(p * 1.7 - vec2(TIME * speed * 9.0, TIME * speed)) * 0.4;
	float band = smoothstep(0.0, 0.55, UV.y) * smoothstep(1.0, 0.7, UV.y);
	COLOR = vec4(fog_color.rgb, clamp(n * band * density * 1.6, 0.0, 1.0));
}
