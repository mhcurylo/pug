
const canvas = document.getElementById("ican") as HTMLCanvasElement

const vertexShaderSource = `#version 300 es

// an attribute is an input (in) to a vertex shader.
// It will receive data from a buffer
in vec4 a_position;

// all shaders have a main function
void main() {

  // gl_Position is a special variable a vertex shader
  // is responsible for setting
  gl_Position = a_position;
}
`

const fragmentShaderSource = `#version 300 es

// fragment shaders don't have a default precision so we need
// to pick one. mediump is a good default. It means "medium precision"
precision mediump float;

// we need to declare an output for the fragment shader
out vec4 outColor;

void main() {
  // Just set the output to a constant reddish-purple
  outColor = vec4(1, 0, 0.5, 1);
}
`

const webgl = canvas.getContext("webgl2") as WebGL2RenderingContext

if (!webgl) {
  console.log("NO WEBGL2!")
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


const positionAttributeLocation = webgl.getAttribLocation(program, "a_position")

const positionBuffer = webgl.createBuffer()


webgl.bindBuffer(webgl.ARRAY_BUFFER, positionBuffer);

const positions = [
  0, 0,
  0, 0.5,
  0.7, 0,
];

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


  // draw
const primitiveType = webgl.TRIANGLES;
const count = 3;
webgl.drawArrays(primitiveType, offset, count);

console.log('boo')
