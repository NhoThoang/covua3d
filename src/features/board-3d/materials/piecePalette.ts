import * as THREE from 'three';

export function luxuryMaterial(
  sourceMaterial: THREE.Material,
  { type = 'p', color = 'w', minY = -0.5, maxY = 0.5 }: { type?: string; color?: string; minY?: number; maxY?: number } = {}
): THREE.MeshPhysicalMaterial {
  const m = new THREE.MeshPhysicalMaterial();
  THREE.MeshStandardMaterial.prototype.copy.call(m, sourceMaterial as any);
  m.color.set(0xffffff);
  m.metalness = 1;
  m.roughness = 1;
  m.envMapIntensity = 0.82;
  m.clearcoat = (type === 'q' || type === 'n') ? 0.26 : 0.42;
  m.clearcoatRoughness = 0.2;

  const character = type === 'q' || type === 'n';
  const board = type === 'board';

  m.onBeforeCompile = (shader) => {
    if (type === 'q') {
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\nvarying float royalHeight;varying float royalX;varying float royalZ;')
        .replace('#include <begin_vertex>', `#include <begin_vertex>\nroyalHeight=(position.y-(${minY.toFixed(8)}))/${(maxY - minY).toFixed(8)};royalX=position.x/${(maxY - minY).toFixed(8)};royalZ=position.z/${(maxY - minY).toFixed(8)};`);
      shader.fragmentShader = 'varying float royalHeight;varying float royalX;varying float royalZ;\n' + shader.fragmentShader;
    }

    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <map_fragment>',
        `
        #include <map_fragment>
        vec3 source = diffuseColor.rgb;
        float hi=max(source.r,max(source.g,source.b));
        float lo=min(source.r,min(source.g,source.b));
        float saturation=(hi-lo)/max(hi,.001);
        float luminance=dot(source,vec3(.2126,.7152,.0722));
        float goldMask=smoothstep(.15,.38,(source.g-source.b)/max(source.g,.025))
                      *smoothstep(.2,.48,(source.r-source.b)/max(source.r,.025));
        float gemMask=smoothstep(.4,.7,saturation)*smoothstep(.005,.09,source.b-source.r)*(1.-goldMask);
        vec3 pearl=vec3(.92,.86,.75)*(.46+.54*pow(clamp(luminance,0.,1.),.72));
        vec3 body=${board ? 'mix(source,vec3(.025,.020,.060)*(.48+.52*sqrt(luminance)),smoothstep(.005,.045,source.b-source.g)*(1.-goldMask))' : 'pearl'};
        ${character && color === 'w' ? `${type === 'q' ? `float faceRegion=smoothstep(.68,.76,royalHeight)*(1.-smoothstep(.92,.98,royalHeight))
                           *(1.-smoothstep(.10,.18,abs(royalX)))*smoothstep(.015,.12,royalZ);
        float handA=1.-smoothstep(.65,1.,length(vec2((royalX+.20)/.068,(royalHeight-.58)/.045)));
        float handB=1.-smoothstep(.65,1.,length(vec2((royalX-.025)/.055,(royalHeight-.69)/.028)));
        float skinTone=smoothstep(.055,.15,source.r-source.b)*smoothstep(.018,.075,source.g-source.b)
                      *(1.-smoothstep(.42,.72,saturation))*smoothstep(.35,.66,luminance);
        float frontSide=smoothstep(-.02,.08,royalZ);
        float skinMask=max(faceRegion,skinTone*max(handA,handB)*frontSide);` : 'float skinMask=0.;'}
        body=mix(body,source,skinMask*(1.-goldMask));
        body=mix(body,mix(source,vec3(.36,.48,.92),.16),gemMask);` : ''}
        ${color === 'b' ? `vec3 amethyst=vec3(.095,.026,.18)*(.48+.52*pow(clamp(luminance,0.,1.),.72));
        vec3 jewel=mix(source,vec3(.20,.24,.72),.18);
        vec3 teamBody=mix(amethyst,jewel,gemMask);
        ${type === 'q' ? `float headShape=1.-smoothstep(.70,1.,length(vec3(royalX/.19,(royalHeight-.84)/.19,royalZ/.17)));
        float backHairShape=(1.-smoothstep(.72,1.,length(vec3(royalX/.27,(royalHeight-.58)/.34,(royalZ+.09)/.17))))
                           *(1.-smoothstep(.015,.10,royalZ));
        float paleHair=smoothstep(.34,.70,luminance)*(1.-smoothstep(.20,.50,saturation));
        float hairMask=max(headShape,backHairShape)*paleHair;
        vec3 silverHair=vec3(.74,.68,.84)*(.56+.44*pow(clamp(luminance,0.,1.),.72));
        body=mix(teamBody,silverHair,hairMask);
        float faceRegion=smoothstep(.68,.76,royalHeight)*(1.-smoothstep(.92,.98,royalHeight))
                         *(1.-smoothstep(.10,.18,abs(royalX)))*smoothstep(.015,.12,royalZ);
        float skinTone=smoothstep(.055,.15,source.r-source.b)*smoothstep(.018,.075,source.g-source.b)
                      *(1.-smoothstep(.42,.72,saturation))*smoothstep(.35,.66,luminance);
        float handA=1.-smoothstep(.65,1.,length(vec2((royalX+.20)/.068,(royalHeight-.58)/.045)));
        float handB=1.-smoothstep(.65,1.,length(vec2((royalX-.025)/.055,(royalHeight-.69)/.028)));
        float frontSide=smoothstep(-.02,.08,royalZ);
        float naturalMask=max(faceRegion,skinTone*max(handA,handB)*frontSide);
        body=mix(body,source,naturalMask);
        goldMask*=1.-naturalMask;` : 'body=teamBody;'}` : ''}
        vec3 champagne=vec3(.94,.70,.34)*(.70+.30*sqrt(clamp(luminance,0.,1.)));
        diffuseColor.rgb=mix(body,champagne,goldMask);
      `
      )
      .replace(
        '#include <metalnessmap_fragment>',
        `
        #include <metalnessmap_fragment>
        metalnessFactor=mix(${character ? '.035' : '.07'},.92,goldMask);
      `
      )
      .replace(
        '#include <roughnessmap_fragment>',
        `
        #include <roughnessmap_fragment>
        roughnessFactor=mix(mix(${character ? '.31' : '.24'},.11,gemMask),.24,goldMask);
      `
      )
      .replace(
        '#include <opaque_fragment>',
        `
        float edge=pow(1.-clamp(dot(normal,normalize(vViewPosition)),0.,1.),3.);
        vec3 spectral=mix(vec3(.17,.38,.85),vec3(.6,.26,.78),clamp(normal.x*.5+.5,0.,1.));
        outgoingLight += diffuseColor.rgb * goldMask * .025;
        outgoingLight += spectral * edge * gemMask * .10;
        #include <opaque_fragment>
      `
      );
  };

  m.customProgramCacheKey = () => `celestial-luxury-11-${type}-${color}`;
  return m;
}
