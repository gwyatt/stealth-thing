shader_type canvas_item;
// Film grain + vignette drawn over the whole screen (alpha-blended overlay).
uniform float grain_amount = 0.07;
uniform float vignette_strength = 0.8;
uniform float vignette_start = 0.42;

float hash(vec2 p) {
	return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

void fragment() {
	vec2 uv = SCREEN_UV;
	float vig = smoothstep(vignette_start, 1.05, distance(uv, vec2(0.5, 0.46)) * 1.25) * vignette_strength;
	float g = hash(floor(uv * vec2(960.0, 540.0)) + fract(TIME * 7.0) * 113.0) - 0.5;
	float grain_a = abs(g) * grain_amount * (1.0 - vig);
	float a = vig + grain_a;
	// Grain is light or dark specks; the vignette is pure black.
	vec3 speck = vec3(step(0.0, g));
	COLOR = vec4(mix(vec3(0.0), speck, grain_a / max(a, 0.0001)), a);
}
