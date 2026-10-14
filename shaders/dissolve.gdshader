shader_type canvas_item;
// Burns a sprite away into embers. Animate `progress` from 0 to 1.
uniform float progress : hint_range(0.0, 1.0) = 0.0;
uniform vec4 edge_color : source_color = vec4(1.0, 0.55, 0.15, 1.0);
uniform float flash : hint_range(0.0, 1.0) = 0.0;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
	vec2 i = floor(p), f = fract(p);
	vec2 u = f * f * (3.0 - 2.0 * f);
	return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}

void fragment() {
	vec4 c = texture(TEXTURE, UV);
	float n = noise(UV * 18.0) * 0.6 + noise(UV * 47.0) * 0.4;
	n = n * 0.85 + (1.0 - UV.y) * 0.15;
	float cut = progress * 1.15;
	float edge = smoothstep(cut - 0.08, cut, n) - step(cut, n);
	if (n < cut - 0.08) { c.a = 0.0; }
	c.rgb = mix(c.rgb, edge_color.rgb * 2.0, clamp(edge, 0.0, 1.0));
	c.rgb = mix(c.rgb, vec3(1.0, 0.92, 0.85), flash * c.a);
	COLOR = c * COLOR;
}
