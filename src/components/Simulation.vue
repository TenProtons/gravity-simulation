<template>
  <canvas
    ref="canvasRef"
    :width="canvasWidth"
    :height="canvasHeight"
    class="simulation-canvas"
  ></canvas>
</template>

<script lang="ts">
import {
  defineComponent,
  ref,
  onMounted,
  onUnmounted,
  watch
} from 'vue';

export default defineComponent({
  name: 'Simulation',
  props: {
    gravity: {
      type: Number,
      required: true
    },
    ballDensity: {
      type: Number,
      required: true
    }
  },
  setup(props) {
    /*********************************
     *    1. CONSTANTS & VARIABLES   *
     *********************************/
    // -- Canvas sizing and margins --
    const canvasWidth = 300;
    const canvasHeight = 400;
    // Left margin for the scale
    const scaleMargin = 40;
    // Spacing from the top and bottom edges for the simulation
    const topMargin = 20;
    const floorMargin = 20;

    // -- Scale definition --
    // The floor is at 0 meters, and we go up to 2 meters.
    const SCALE_HEIGHT_METERS = 2;
    // Convert meters to pixels based on available vertical space.
    // We'll reserve topMargin at the top and floorMargin at the bottom for some padding.
    const pxPerMeter = (canvasHeight - topMargin - floorMargin) / SCALE_HEIGHT_METERS;

    // -- Ball definition --
    // Ball radius in meters; actual pixel size is derived from pxPerMeter.
    const BALL_RADIUS_METERS = 0.1;
    // We'll compute mass and drag based on ballDensity.
    // The ball's vertical position y is in meters, with y=0 at the floor.
    // We'll track velocity in m/s (positive = upward, negative = downward).
    let ball = {
      y: 0,    // starts on the floor (center of ball will be at radius height)
      v: 0     // velocity
    };

    // Canvas refs
    const canvasRef = ref<HTMLCanvasElement | null>(null);
    const ctx = ref<CanvasRenderingContext2D | null>(null);

    // Animation loop
    let animationFrameId: number | null = null;
    let lastTimestamp: number | null = null;
    let isDragging = false;
    let simulationRunning = false;

    // -- Floor is at y=0 in meters. We can define a helper to convert from meter -> pixel.
    function meterToPixel(yMeter: number): number {
      // 0 meters is at the bottom (floorMargin from bottom),
      // so we invert by subtracting yMeter * pxPerMeter from the floor pixel line.
      return canvasHeight - floorMargin - (yMeter * pxPerMeter);
    }

    /*********************************
     *     2. PHYSICS PARAMETERS     *
     *********************************/
    // Physical constants
    const airDensity = 1.2; // kg/m³ at 20°C
    const Cd = 0.47;        // drag coefficient for a sphere
    const ironDensity = 7870; // kg/m³

    // We'll compute restitution based on ballDensity vs. ironDensity
    function computeRestitution(density: number): number {
      const ratio = Math.pow(density / ironDensity, 1 / 3);
      return Math.min(0.9, ratio);
    }

    // Functions for mass and drag
    function computeMass(density: number): number {
      // Volume of a sphere: (4/3)πr³
      const volume = (4 / 3) * Math.PI * Math.pow(BALL_RADIUS_METERS, 3);
      return density * volume;
    }

    function computeDragConstant(mass: number): number {
      // Drag formula: F = 0.5 * rho * Cd * A * v²
      // We'll store the portion (0.5 * rho * Cd * A / mass).
      const crossSection = Math.PI * Math.pow(BALL_RADIUS_METERS, 2);
      return (0.5 * airDensity * Cd * crossSection) / mass;
    }

    // We'll keep these updated when ballDensity changes.
    let mass = computeMass(props.ballDensity);
    let dragConstant = computeDragConstant(mass);
    let restitution = computeRestitution(props.ballDensity);

    // Watch for changes in ballDensity
    watch(
      () => props.ballDensity,
      (newDensity) => {
        mass = computeMass(newDensity);
        dragConstant = computeDragConstant(mass);
        restitution = computeRestitution(newDensity);
      }
    );

    /*********************************
     *   3. EVENT HANDLERS & DRAG    *
     *********************************/
    function getMousePos(event: MouseEvent | TouchEvent) {
      const canvas = canvasRef.value;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();

      let clientX, clientY;
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
      // The ball is drawn horizontally at the center of the simulation area
      const ballX = scaleMargin + (canvasWidth - scaleMargin) / 2;
      // The ball's visual center Y in pixels includes the radius offset
      const ballY = meterToPixel(ball.y + BALL_RADIUS_METERS);

      // Pixel radius
      const radiusPx = BALL_RADIUS_METERS * pxPerMeter;
      const dx = mouseX - ballX;
      const dy = mouseY - ballY;
      return dx * dx + dy * dy <= radiusPx * radiusPx;
    }

    function onMouseDown(event: MouseEvent | TouchEvent) {
      event.preventDefault();
      const pos = getMousePos(event);
      if (isInsideBall(pos.x, pos.y)) {
        isDragging = true;
        simulationRunning = false;
        ball.v = 0;
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
      // Convert from pixel to meter, accounting for the radius offset
      let newY = (canvasHeight - floorMargin - pos.y) / pxPerMeter - BALL_RADIUS_METERS;
      // Clamp so the ball can't go below the floor or above scaleHeight
      newY = Math.max(0, Math.min(newY, SCALE_HEIGHT_METERS));
      ball.y = newY;
      draw();
    }

    function onMouseUp(event: MouseEvent | TouchEvent) {
      if (isDragging) {
        isDragging = false;
        simulationRunning = true;
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

    /*********************************
     *       4. SIMULATION LOOP      *
     *********************************/
    function simulationLoop(timestamp: number) {
      if (!lastTimestamp) lastTimestamp = timestamp;
      const dt = (timestamp - lastTimestamp) / 1000; // seconds
      lastTimestamp = timestamp;

      if (simulationRunning && !isDragging) {
        // v < 0 => ball is moving downward
        // Gravity is negative: a = -props.gravity + dragAcc
        // Drag is opposite to velocity
        const dragAcc = -dragConstant * ball.v * Math.abs(ball.v);
        const acceleration = -props.gravity + dragAcc; // note the minus sign for gravity
        ball.v += acceleration * dt;
        ball.y += ball.v * dt;

        // Bounce if the ball goes below the floor (y < 0).
        if (ball.y < 0) {
          ball.y = 0;
          ball.v = -restitution * ball.v;
          // If velocity is tiny, stop.
          if (Math.abs(ball.v) < 0.05) {
            ball.v = 0;
            simulationRunning = false;
          }
        }
        // Also clamp if the ball goes above the top scale
        if (ball.y > SCALE_HEIGHT_METERS) {
          ball.y = SCALE_HEIGHT_METERS;
          ball.v = 0; // just stop if user flung it too high
        }
      }

      draw();
      if (simulationRunning || isDragging) {
        animationFrameId = requestAnimationFrame(simulationLoop);
      } else {
        animationFrameId = null;
      }
    }

    /*********************************
     *       5. DRAWING METHODS      *
     *********************************/
    function drawScale() {
      if (!ctx.value) return;
      const context = ctx.value;

      // Draw a vertical line from floor (y=0) to top (y=SCALE_HEIGHT_METERS).
      const xLine = scaleMargin - 5;
      const yFloorPx = meterToPixel(0);
      const yTopPx = meterToPixel(SCALE_HEIGHT_METERS);

      context.beginPath();
      context.moveTo(xLine, yFloorPx);
      context.lineTo(xLine, yTopPx);
      context.strokeStyle = '#000';
      context.lineWidth = 2;
      context.stroke();

      // Tick marks every 0.2 m
      for (let m = 0; m <= SCALE_HEIGHT_METERS; m += 0.2) {
        const yTick = meterToPixel(m);
        context.beginPath();
        context.moveTo(xLine, yTick);
        context.lineTo(xLine - 10, yTick);
        context.stroke();

        // Label
        context.font = '10px sans-serif';
        context.textAlign = 'right';
        context.textBaseline = 'middle';
        context.fillStyle = '#000';
        context.fillText(m.toFixed(1), xLine - 15, yTick);
      }
    }

    function draw() {
      if (!ctx.value || !canvasRef.value) return;
      const context = ctx.value;
      context.clearRect(0, 0, canvasWidth, canvasHeight);

      // Draw the scale on the left side
      drawScale();

      // Draw the floor as a horizontal line in the simulation area
      const floorYpx = meterToPixel(0);
      context.beginPath();
      context.moveTo(scaleMargin, floorYpx);
      context.lineTo(canvasWidth, floorYpx);
      context.strokeStyle = '#000';
      context.lineWidth = 2;
      context.stroke();

      // Draw the ball - add radius to y position to lift center point
      const ballX = scaleMargin + (canvasWidth - scaleMargin) / 2;
      const ballY = meterToPixel(ball.y + BALL_RADIUS_METERS); // Add radius here instead
      const radiusPx = BALL_RADIUS_METERS * pxPerMeter;

      context.beginPath();
      context.arc(ballX, ballY, radiusPx, 0, 2 * Math.PI);
      context.fillStyle = '#007bff';
      context.fill();
      context.strokeStyle = '#003f7f';
      context.stroke();
    }

    /*********************************
     *     6. LIFECYCLE HOOKS        *
     *********************************/
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

    /*********************************
     *       7. RETURN BINDINGS      *
     *********************************/
    return {
      canvasRef,
      canvasWidth,
      canvasHeight,
      simulationRunning
    };
  }
});
</script>

<style scoped>
.simulation-canvas {
  border: 1px solid #ccc;
  touch-action: none; /* helps with mobile dragging */
  background: #fff;
}
</style>
