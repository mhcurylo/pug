
const canvas = document.getElementById("ican") as HTMLCanvasElement

const vertexShaderSource = `#version 300 es

// an attribute is an input (in) to a vertex shader.
// It will receive data from a buffer
in vec2 a_position;
uniform mediump vec2 u_resolution;
uniform mediump float u_scroll;

// all shaders have a main function
void main() {

  // convert the position from pixels to 0.0 to 1.0
  vec2 zeroToOne = (a_position - vec2(u_scroll, 0)) / u_resolution;

  // convert from 0->1 to 0->2
  vec2 zeroToTwo = zeroToOne * 2.0;

  // convert from 0->2 to -1->+1 (clip space)
  vec2 clipSpace = zeroToTwo - 1.0;

  gl_Position = vec4(clipSpace, 0, 1);
}
`

const fragmentShaderSource = `#version 300 es

// fragment shaders don't have a default precision so we need
// to pick one. mediump is a good default. It means "medium precision"
precision mediump float;
uniform mediump vec2 u_resolution;
uniform mediump float u_scroll;

// we need to declare an output for the fragment shader
out vec4 outColor;

void main() {
  vec2 st = gl_FragCoord.xy / u_resolution;
  // Just set the output to a constant reddish-purple
  outColor = vec4(pow(u_scroll,0.01), 0, abs(sin(u_scroll*0.02)), 1);
}
`
type Vec2 = { x: number, y: number }

const flatten: (vecs: Vec2[]) => number[]
= vecs => vecs.flatMap(({x, y})=> [x, y]);


const webgl = canvas.getContext("webgl2") as WebGL2RenderingContext

if (!webgl) {
  console.log("NO WEBGL2!")
}
webgl.canvas.width  = window.innerWidth,
webgl.canvas.height = window.innerHeight
const gameResolution: Vec2 = { x: 200, y: 100 };
const actualResolution: Vec2 = {
  x: window.innerWidth,
  y: window.innerHeight
}

webgl.viewport(0, 0, canvas.width, canvas.height);

function createShader(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader {
  const shader = gl.createShader(type);
  if (shader) {
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (success) {
      return shader
    }
    console.log(gl.getShaderInfoLog(shader))
    gl.deleteShader(shader)
  }
  console.log(shader);
  throw "very bad"
}

function createProgram(gl: WebGL2RenderingContext, vertexShader: WebGLShader, fragmentShader: WebGLShader): WebGLProgram {
  const program = gl.createProgram();
  if (program) {
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    const success = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (success) {
      return program;
    }

    console.log(gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
  }
  throw "very bad program"
}

const vertexShader = createShader(webgl, webgl.VERTEX_SHADER, vertexShaderSource)
const fragmentShader = createShader(webgl, webgl.FRAGMENT_SHADER, fragmentShaderSource)

const program = createProgram(webgl, vertexShader, fragmentShader)
const resolutionUniformLocation = webgl.getUniformLocation(program, "u_resolution");
const scrollUniformLocation = webgl.getUniformLocation(program, "u_scroll");
const positionAttributeLocation = webgl.getAttribLocation(program, "a_position")


const createFloor = (minHeight: number, maxHeight: number, minWidth: number, maxWidth: number, iteration: number) => {
  const floors: number[] = [];
  const heightDiff = maxHeight - minHeight;
  const widthDiff = maxWidth - minWidth;

  const addFloor = (startingX: number, it: number) => {
    if (it == 0) {
      return ;
    }
    const hs = minHeight + Math.random()*heightDiff;
    const ws = minWidth + Math.random()*widthDiff;
    floors.push(startingX);
    floors.push(minHeight);
    floors.push(startingX);
    floors.push(hs);
    addFloor(startingX + ws, it - 1);
  }

  addFloor(0, iteration);

  return floors;
};

const positionBuffer = webgl.createBuffer()

webgl.bindBuffer(webgl.ARRAY_BUFFER, positionBuffer);

const positions = createFloor(0, 200, 20, 100, 100)
  .concat(createFloor(800, 600, 20, 40, 100))
  .concat([0, 0, 0, 50, 1300, 0, 1300, 50])
  .concat([0, 800, 0, 750, 1300, 800, 1300, 750]);

console.log(positions);

webgl.bufferData(webgl.ARRAY_BUFFER, new Float32Array(positions), webgl.STATIC_DRAW);

const vao = webgl.createVertexArray();

webgl.bindVertexArray(vao)
webgl.enableVertexAttribArray(positionAttributeLocation);

const size = 2;          // 2 components per iteration
const type = webgl.FLOAT;   // the data is 32bit floats
const normalize = false; // don't normalize the data
const stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
const offset = 0;        // start at the beginning of the buffer

webgl.vertexAttribPointer(
        positionAttributeLocation, size, type, normalize, stride, offset)

webgl.clearColor(1,1,0,0)
webgl.clear(webgl.COLOR_BUFFER_BIT)

webgl.useProgram(program)
webgl.bindVertexArray(vao)
webgl.uniform2f(resolutionUniformLocation, actualResolution.x, actualResolution.y);


const go = (scroll: number) => {
  webgl.uniform1f(scrollUniformLocation, scroll);
    // draw
  const primitiveType = webgl.TRIANGLE_STRIP;
  webgl.drawArrays(primitiveType, 0, 200);
  webgl.drawArrays(primitiveType, 200, 200);
  webgl.drawArrays(primitiveType, 400, 4);
  webgl.drawArrays(primitiveType, 404, 4);


  window.requestAnimationFrame(() => {
    go(scroll + 1);
  });
}

go(0);

console.log('boo')
