// Cut erosion. Alpha below the cut threshold is removed, so thin regions clear
// before dense cores. openingsPass outputs the removed alpha instead.
vec2 cutUv = vCutClip.xy / vCutClip.w * 0.5 + 0.5;
float cut = texture2D(cutMap, cutUv).r * 1.2;
float kept = smoothstep(cut - 0.3, cut, diffuseColor.a);
float cloudAlpha = diffuseColor.a * vOpacity;
if (openingsPass > 0.5) {
  gl_FragColor = vec4(1.0, 1.0, 1.0, cloudAlpha * (1.0 - kept));
} else {
  gl_FragColor = vec4(outgoingLight, cloudAlpha * kept);
}
