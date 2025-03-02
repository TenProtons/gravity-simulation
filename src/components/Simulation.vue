<template>
  <canvas ref="canvasRef" :width="canvasWidth" :height="canvasHeight" class="simulation-canvas"></canvas>
</template>

<script lang="ts">
export default { name: 'Simulation' }
</script>

<script lang="ts" setup>
import { ref, onMounted, onUnmounted, watch, defineProps, defineEmits } from 'vue';

interface Ball {
  y: number; // vertical position in meters
  v: number; // vertical velocity in m/s (positive downward)
}

const props = defineProps<{
  gravity: number;      // m/s² (input)
  ballDensity: number;  // kg/m³ (input)
  resetCounter: number; // incremented by parent to trigger a reset
}>()

const emits = defineEmits<{
  (e: 'simulationEnded'): void;
  (e: 'simulationStarted'): void;
}>()

// Constants
const scale = 100; // pixels per meter
const canvasWidth = 600;
const canvasHeight = 400;
const ballRadius = 0.2; // in meters (≈20px)
const airDensity = 1.2; // kg/m³ at 20°C
const Cd = 0.47; // drag coefficient for a sphere
const floorMargin = 10; // pixels margin from bottom

const ironDensity = 7870; // kg/m³ for iron
// Compute the restitution coefficient from ball density; maximum value clamped to 0.9.
function computeRestitution(density: number): number {
  const restitution = Math.pow(density / ironDensity, 1/3);
  return Math.min(0.9, restitution);
}
let restitutionCoefficient = computeRestitution(props.ballDensity);

// Compute floor position (in meters) – the floor is drawn at canvasHeight - floorMargin.
const floorY = (canvasHeight - floorMargin) / scale; // in meters

// Animation loop vars
let animationFrameId: number | null = null;
let lastTimestamp: number | null = null;

const canvasRef = ref<HTMLCanvasElement | null>(null);
const ctx = ref<CanvasRenderingContext2D | null>(null);

// Ball state (vertical only; x is fixed to center)
let ball: Ball = {
  y: floorY - ballRadius, // initially sitting on the floor
  v: 0,
};

let isDragging = false;
let simulationRunning = false;

// Compute ball mass and drag constant
function computeMass(density: number): number {
  const volume = (4/3) * Math.PI * Math.pow(ballRadius, 3);
  return density * volume;
}
let mass = computeMass(props.ballDensity);

function computeDragConstant(): number {
  const area = Math.PI * Math.pow(ballRadius, 2);
  return (0.5 * airDensity * Cd * area) / mass;
}
let dragConstant = computeDragConstant();

// Update physics parameters when the ballDensity prop changes.
watch(() => props.ballDensity, (newDensity) => {
  mass = computeMass(newDensity);
  dragConstant = computeDragConstant();
  restitutionCoefficient = computeRestitution(newDensity);
});

// Watch the external resetCounter: when it changes, reset the simulation.
watch(() => props.resetCounter, () => {
  resetSimulation();
});

// --- Event Handlers for Dragging ---

function getMousePos(event: MouseEvent | TouchEvent): { x: number, y: number } {
  const canvas = canvasRef.value;
  if (!canvas) return { x: 0, y: 0 };
  const rect = canvas.getBoundingClientRect();
  let clientX: number, clientY: number;
  if (event instanceof TouchEvent) {
    clientX = event.touches[0].clientX;
    clientY = event.touches[0].clientY;
  } else {
    clientX = event.clientX;
    clientY = event.clientY;
  }
  return {
    x: clientX - rect.left,
    y: clientY - rect.top
  };
}

function isInsideBall(mouseX: number, mouseY: number): boolean {
  const canvas = canvasRef.value;
  if (!canvas) return false;
  const ballX = canvas.width / 2;
  const ballY = ball.y * scale;
  const dx = mouseX - ballX;
  const dy = mouseY - ballY;
  return dx * dx + dy * dy <= Math.pow(ballRadius * scale, 2);
}

function onMouseDown(event: MouseEvent | TouchEvent) {
  event.preventDefault();
  const pos = getMousePos(event);
  if (isInsideBall(pos.x, pos.y)) {
    isDragging = true;
    simulationRunning = false;
    ball.v = 0;
    // Cancel any ongoing animation frame while dragging.
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
  }
}

function onMouseMove(event: MouseEvent | TouchEvent) {
  if (!isDragging) return;
  event.preventDefault();
  const pos = getMousePos(event);
  // Update ball position (in meters) from mouse y; clamp so the ball cannot go below the floor.
  let newY = pos.y / scale;
  newY = Math.min(newY, floorY - ballRadius);
  ball.y = newY;
  draw(); // immediately redraw to show dragging
}

function onMouseUp(event: MouseEvent | TouchEvent) {
  if (isDragging) {
    isDragging = false;
    // Start the simulation (i.e. let gravity take over) when the ball is released.
    simulationRunning = true;
    // Inform parent that the simulation has started.
    emits('simulationStarted');
    lastTimestamp = null;
    if (!animationFrameId) {
      animationFrameId = requestAnimationFrame(simulationLoop);
    }
  }
}

function addEventListeners() {
  const canvas = canvasRef.value;
  if (!canvas) return;
  canvas.addEventListener('mousedown', onMouseDown);
  canvas.addEventListener('mousemove', onMouseMove);
  canvas.addEventListener('mouseup', onMouseUp);
  canvas.addEventListener('mouseleave', onMouseUp);
  canvas.addEventListener('touchstart', onMouseDown);
  canvas.addEventListener('touchmove', onMouseMove);
  canvas.addEventListener('touchend', onMouseUp);
}

function removeEventListeners() {
  const canvas = canvasRef.value;
  if (!canvas) return;
  canvas.removeEventListener('mousedown', onMouseDown);
  canvas.removeEventListener('mousemove', onMouseMove);
  canvas.removeEventListener('mouseup', onMouseUp);
  canvas.removeEventListener('mouseleave', onMouseUp);
  canvas.removeEventListener('touchstart', onMouseDown);
  canvas.removeEventListener('touchmove', onMouseMove);
  canvas.removeEventListener('touchend', onMouseUp);
}

// --- Simulation Loop ---

function simulationLoop(timestamp: number) {
  if (!lastTimestamp) lastTimestamp = timestamp;
  const dt = (timestamp - lastTimestamp) / 1000; // delta time in seconds
  lastTimestamp = timestamp;

  if (simulationRunning && !isDragging) {
    // Air drag: F_drag = - dragConstant * v * |v|, so acceleration is:
    const dragAcc = - dragConstant * ball.v * Math.abs(ball.v);
    const acceleration = props.gravity + dragAcc;
    ball.v += acceleration * dt;
    ball.y += ball.v * dt;

    // Check for collision with the floor.
    if (ball.y + ballRadius >= floorY) {
      ball.y = floorY - ballRadius;
      ball.v = - restitutionCoefficient * ball.v;
      // If the bounce is very weak, stop the simulation.
      if (Math.abs(ball.v) < 0.1) {
        simulationRunning = false;
        ball.v = 0;
        emits('simulationEnded');
      }
    }
  }

  draw();
  if (simulationRunning || isDragging) {
    animationFrameId = requestAnimationFrame(simulationLoop);
  } else {
    animationFrameId = null;
  }
}

function draw() {
  const canvas = canvasRef.value;
  if (!canvas) return;
  const context = ctx.value;
  if (!context) return;

  // Clear the canvas.
  context.clearRect(0, 0, canvas.width, canvas.height);

  // Draw the floor as a horizontal line.
  context.beginPath();
  const floorPixelY = floorY * scale;
  context.moveTo(0, floorPixelY);
  context.lineTo(canvas.width, floorPixelY);
  context.strokeStyle = '#000';
  context.lineWidth = 2;
  context.stroke();

  // Draw the ball.
  const ballX = canvas.width / 2;
  const ballY = ball.y * scale;
  context.beginPath();
  context.arc(ballX, ballY, ballRadius * scale, 0, 2 * Math.PI);
  context.fillStyle = '#007bff';
  context.fill();
  context.strokeStyle = '#003f7f';
  context.stroke();
}

function resetSimulation() {
  simulationRunning = false;
  isDragging = false;
  ball.y = floorY - ballRadius;
  ball.v = 0;
  draw();
}

onMounted(() => {
  const canvas = canvasRef.value;
  if (canvas) {
    ctx.value = canvas.getContext('2d');
  }
  addEventListeners();
  draw();
});

onUnmounted(() => {
  removeEventListeners();
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
  }
});
</script>

<style scoped>
.simulation-canvas {
  border: 1px solid #ccc;
  touch-action: none;
}
</style>
