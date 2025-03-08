<template>
  <div class="simulation-container">
    <canvas
      ref="canvasRef"
      :width="canvasWidth"
      :height="canvasHeight"
      class="simulation-canvas"
    ></canvas>
  </div>
</template>

<script lang="ts">
import {
  defineComponent,
  ref,
  onMounted,
  onUnmounted,
  watch,
  computed,
  defineEmits
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
    },
    ballDiameter: {
      type: Number,
      default: 0.2
    },
    scaleHeight: {
      type: Number,
      default: 1
    }
  },
  emits: ['fallTimeUpdate'],
  setup(props, { emit }) {
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
    // The floor is at 0 meters, and we go up to the specified scale height.
    // We'll compute pxPerMeter dynamically based on the scale height
    const pxPerMeter = computed(() => {
      return (canvasHeight - topMargin - floorMargin) / props.scaleHeight;
    });

    // -- Ball definition --
    // Ball radius in meters; actual pixel size is derived from pxPerMeter.
    // We'll make the ball radius proportional to the scale height
    const BALL_RADIUS_METERS = computed(() => {
      // Radius is half the diameter
      return props.ballDiameter / 2;
    });
    
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
      return canvasHeight - floorMargin - (yMeter * pxPerMeter.value);
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
      const volume = (4 / 3) * Math.PI * Math.pow(BALL_RADIUS_METERS.value, 3);
      return density * volume;
    }

    function computeDragConstant(mass: number): number {
      // Drag formula: F = 0.5 * rho * Cd * A * v²
      // We'll store the portion (0.5 * rho * Cd * A / mass).
      const crossSection = Math.PI * Math.pow(BALL_RADIUS_METERS.value, 2);
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
        // Redraw to update the weight display
        draw();
      }
    );

    // Watch for changes in gravity
    watch(
      () => props.gravity,
      () => {
        // Redraw with new gravity (which affects weight)
        draw();
      },
      { immediate: true } // Ensure it runs on initial mount
    );

    // Add a watch for scaleHeight changes
    watch(
      () => props.scaleHeight,
      () => {
        // Recalculate physics parameters when scale height changes
        mass = computeMass(props.ballDensity);
        dragConstant = computeDragConstant(mass);
        
        // Make sure the ball is within the new scale bounds
        if (ball.y > props.scaleHeight) {
          ball.y = props.scaleHeight;
        }
        
        // Redraw with new scale
        draw();
      }
    );

    // Add a watch for ballDiameter changes
    watch(
      () => props.ballDiameter,
      () => {
        // Recalculate physics parameters when ball diameter changes
        mass = computeMass(props.ballDensity);
        dragConstant = computeDragConstant(mass);
        
        // Redraw with new ball size
        draw();
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
      const ballY = meterToPixel(ball.y + BALL_RADIUS_METERS.value);

      // Pixel radius with minimum size for interaction
      const radiusPx = BALL_RADIUS_METERS.value * pxPerMeter.value;
      
      // Minimum interaction radius in pixels (15px or actual radius, whichever is larger)
      const minInteractionRadius = Math.max(radiusPx, 15);
      
      const dx = mouseX - ballX;
      const dy = mouseY - ballY;
      return dx * dx + dy * dy <= minInteractionRadius * minInteractionRadius;
    }

    // Add these variables to track fall time
    let fallStartTime: number | null = null;
    let fallEndTime: number | null = null;
    
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
      let newY = (canvasHeight - floorMargin - pos.y) / pxPerMeter.value - BALL_RADIUS_METERS.value;
      // Clamp so the ball can't go below the floor or above scaleHeight
      newY = Math.max(0, Math.min(newY, props.scaleHeight));
      ball.y = newY;
      draw();
    }

    function onMouseUp(event: MouseEvent | TouchEvent) {
      if (isDragging) {
        isDragging = false;
        simulationRunning = true;
        lastTimestamp = null;
        
        // Reset fall time tracking when ball is released
        if (ball.y > 0) {
          fallStartTime = performance.now();
          fallEndTime = null;
          emit('fallTimeUpdate', { time: null, measuring: true });
        }
        
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
          
          // Record fall time on first contact with ground
          if (fallStartTime !== null && fallEndTime === null) {
            fallEndTime = performance.now();
            const fallDuration = (fallEndTime - fallStartTime) / 1000; // Convert to seconds
            emit('fallTimeUpdate', { time: fallDuration, measuring: false });
          }
          
          // If velocity is tiny, stop.
          if (Math.abs(ball.v) < 0.05) {
            ball.v = 0;
            simulationRunning = false;
          }
        }
        // Also clamp if the ball goes above the top scale
        if (ball.y > props.scaleHeight) {
          ball.y = props.scaleHeight;
          ball.v = 0; // just stop if user flung it too high
        }

        // Update fall time continuously during the fall
        if (fallStartTime !== null && fallEndTime === null) {
          const currentTime = performance.now();
          const currentDuration = (currentTime - fallStartTime) / 1000;
          emit('fallTimeUpdate', { time: currentDuration, measuring: true });
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
      const yTopPx = meterToPixel(props.scaleHeight);

      context.beginPath();
      context.moveTo(xLine, yFloorPx);
      context.lineTo(xLine, yTopPx);
      context.strokeStyle = '#000';
      context.lineWidth = 2;
      context.stroke();

      // Add unit label "m" at the top of the scale
      context.font = '12px sans-serif';
      context.textAlign = 'center';
      context.textBaseline = 'bottom';
      context.fillStyle = '#000';
      context.fillText('m', xLine - 20, yTopPx - 5);

      // Tick marks every 0.2 m
      for (let m = 0; m <= props.scaleHeight; m += getTickInterval(props.scaleHeight)) {
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

    function drawBallInfo() {
      if (!ctx.value) return;
      const context = ctx.value;
      
      // Calculate the ball diameter in meters (2 * radius)
      const ballDiameter = BALL_RADIUS_METERS.value * 2;
      
      // Recalculate mass to ensure it's current
      const currentMass = computeMass(props.ballDensity);
      
      // Calculate the ball weight in kg (mass * gravity)
      const ballWeight = currentMass * props.gravity / 9.81; // Convert to weight in kg
      
      // Format the weight with appropriate units (g or kg)
      let weightText;
      if (ballWeight < 1) {
        // Show in grams if less than 1kg
        weightText = `${(ballWeight * 1000).toFixed(0)}g`;
      } else {
        // Show in kg with 2 decimal places
        weightText = `${ballWeight.toFixed(2)}kg`;
      }
      
      // Display at the top of the canvas
      context.font = '12px sans-serif';
      context.textAlign = 'center';
      context.textBaseline = 'top';
      context.fillStyle = '#000';
      
      // Display diameter and weight
      context.fillText(
        `Ball Ø: ${ballDiameter.toFixed(2)}m   Weight: ${weightText}`, 
        scaleMargin + (canvasWidth - scaleMargin) / 2, 
        5
      );
    }

    function draw() {
      if (!ctx.value || !canvasRef.value) return;
      const context = ctx.value;
      context.clearRect(0, 0, canvasWidth, canvasHeight);

      // Draw the scale on the left side
      drawScale();
      
      // Draw the ball info (diameter and weight)
      drawBallInfo();

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
      const ballY = meterToPixel(ball.y + BALL_RADIUS_METERS.value); // Add radius here instead
      const radiusPx = BALL_RADIUS_METERS.value * pxPerMeter.value;

      context.beginPath();
      context.arc(ballX, ballY, radiusPx, 0, 2 * Math.PI);
      context.fillStyle = '#007bff';
      context.fill();
      context.strokeStyle = '#003f7f';
      context.stroke();
    }

    // Add a helper function to determine appropriate tick intervals based on scale height
    function getTickInterval(height: number): number {
      if (height <= 2) return 0.2;
      if (height <= 5) return 0.5;
      if (height <= 10) return 1;
      if (height <= 20) return 2;
      return 5;
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
.simulation-container {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.simulation-canvas {
  border: 1px solid #ccc;
  touch-action: none; /* helps with mobile dragging */
  background: #fff;
}
</style>
