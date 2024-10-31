# Self-Driving Car Simulation

A fascinating deep learning visualization project that demonstrates the beauty of neural networks learning to navigate through traffic in real-time. This project brings together the elegance of autonomous driving and the complexity of neural evolution.

## Overview

This simulator creates an environment where AI-controlled cars learn to navigate through traffic using neural networks. Each car is equipped with sensors and a brain that evolves over time, showcasing the remarkable ability of deep learning systems to adapt and improve through experience.

### Neural Network Visualization

- **Real-time Brain Activity**: Watch neural networks think and make decisions as cars navigate
- **Interactive Network Display**: Visualizes neuron activations, weights, and biases in real-time
- **Sensor System**: Shows how cars perceive their environment through multiple sensors

### Learning Environment

- **Dynamic Traffic**: Add or remove traffic cars to create varying levels of complexity
- **Speed Control**: Adjust traffic speed to create different learning scenarios
- **Mutation System**: Cars learn through genetic evolution, with each generation improving upon the last

### Training Controls

- **Save Best Performer**: Preserve the neural network of the most successful car
- **Parallel Learning**: Multiple cars learn simultaneously, accelerating the evolution process
- **Progressive Difficulty**: Traffic patterns that challenge the AI to develop robust driving strategies

![{7712F6A4-D2A4-4FDC-95A8-17B469AA8670}](https://github.com/user-attachments/assets/77efdf3f-b62b-44e6-a183-1b7f95afa428)


## Core Components

**Canvas Setup**

- Uses two HTML canvases: one for the driving simulation and another for neural network visualization[1]
- The world is rendered using 2D canvas context with a road and multiple car objects

**Car Physics**

- Each car is represented by a polygon with four points forming a rectangle[1]
- Cars have properties like position (x, y), dimensions (width, height), speed, acceleration, and angle[1]
- Collision detection is implemented using polygon intersection checks

## Neural Network Architecture

**Sensor System**

### Network Structure

```jsx
class NeuralNetwork {
  constructor(neuronCounts) {
    this.levels = [];
    for (let i = 0; i < neuronCounts.length - 1; i++) {
      this.levels.push(new Level(neuronCounts[i], neuronCounts[i + 1]));
    }
  }
}
```

**Network Structure**

- Input layer: 5 neurons (sensor readings)
- Hidden layer: 6 neurons
- Output layer: 4 neurons (controls)
- Each level contains weights and biases
- Fully connected between layers

### Feedforward Process

```jsx
static feedForward(givenInputs, network) {
    let outputs = Level.feedForward(givenInputs, network.levels[0]);
    for (let i = 1; i < network.levels.length; i++) {
        outputs = Level.feedForward(outputs, network.levels[i]);
    }
    return outputs;
}

static feedForward(givenInputs, level) {
    for (let i = 0; i < level.inputs.length; i++) {
        level.inputs[i] = givenInputs[i];
    }

    for (let i = 0; i < level.outputs.length; i++) {
        let sum = 0;
        for (let j = 0; j < level.inputs.length; j++) {
            sum += level.inputs[j] * level.weights[j][i];
        }

        if (sum > level.biases[i]) {
            level.outputs[i] = 1;
        } else {
            level.outputs[i] = 0;
        }
    }

    return level.outputs;
}

```

Neural processing:

- Inputs are sensor readings (distances to obstacles)
- Each neuron computes weighted sum of inputs
- Binary activation based on bias threshold
- Output determines car controls:
  - Forward movement
  - Left turn
  - Right turn
  - Reverse movement
- Each car has 5 raycast sensors that detect obstacles and road boundaries[1]
- Sensors cast rays at different angles, measuring distances to obstacles
- Each ray returns an offset value (distance to detected object) which serves as input to the neural network

## Learning Mechanism

**Genetic Algorithm**

- Multiple cars (N=100) are generated simultaneously with randomized neural networks[1]
- Each car's "fitness" is determined by how far it travels without crashing
- The best-performing car's neural network (weights and biases) is saved as the "best brain"

**Mutation Process**

```jsx
static mutate(network, amount = 1) {
    network.levels.forEach((level) => {
        // Mutate biases
        for (let i = 0; i < level.biases.length; i++) {
            level.biases[i] = lerp(
                level.biases[i],
                Math.random() * 2 - 1,
                amount
            );
        }
        // Mutate weights
        for (let i = 0; i < level.weights.length; i++) {
            for (let j = 0; j < level.weights[i].length; j++) {
                level.weights[i][j] = lerp(
                    level.weights[i][j],
                    Math.random() * 2 - 1,
                    amount
                );
            }
        }
    });
}

```

- Mutation occurs by slightly modifying the weights and biases of the neural network
- Uses linear interpolation (lerp) to create variations of the successful network
- Mutation amount (0.1) determines how much the networks can vary from the original[1]

## Car Physics and Control

**Car Properties**

```jsx
#createPolygon() {
    const points = [];
    const rad = Math.hypot(this.width, this.height) / 2;
    const alpha = Math.atan2(this.width, this.height);

    // Create 4 corners of the car
    points.push({
        x: this.x - Math.sin(this.angle - alpha) * rad,
        y: this.y - Math.cos(this.angle - alpha) * rad
    });
    // ... (similar calculations for other 3 points)

    return points;
}

```

- Each car is represented by a polygon with four points
- Properties include:
  - Position (x, y)
  - Dimensions (width, height)
  - Speed and acceleration
  - Friction coefficient
  - Damage state[1]

```jsx
#move() {
    // Forward/Backward movement
    if (this.controls.forward) this.speed += this.acceleration;
    if (this.controls.reverse) this.speed -= this.acceleration;

    // Speed limits
    if (this.speed > this.maxSpeed) this.speed = this.maxSpeed;
    if (this.speed < -this.maxSpeed/2) this.speed = -this.maxSpeed/2;

    // Friction
    if (this.speed > 0) this.speed -= this.friction;
    if (this.speed < 0) this.speed += this.friction;
    if (Math.abs(this.speed) < this.friction) this.speed = 0;

    // Turning
    if (this.speed != 0) {
        const flip = this.speed > 0 ? 1 : -1;
        if (this.controls.left) this.angle += 0.03 * flip;
        if (this.controls.right) this.angle -= 0.03 * flip;
    }

    // Update position
    this.x -= Math.sin(this.angle) * this.speed;
    this.y -= Math.cos(this.angle) * this.speed;
}

```

**Movement Control**

- The neural network outputs control signals:
  - Forward acceleration
  - Left/right steering
  - Reverse movement
- These controls are applied through physics calculations considering:
  - Acceleration and friction
  - Angular rotation for steering
  - Collision detection with road boundaries and other cars[1]

The movement system includes:

- Acceleration and deceleration based on controls
- Maximum speed limits (different for forward/reverse)
- Friction to slow the car naturally
- Turning mechanics that depend on speed direction
- Position updates based on angle and speed

### Ray Casting

```jsx
class Sensor {
  constructor(car) {
    this.car = car;
    this.rayCount = 5;
    this.rayLength = 150;
    this.raySpread = Math.PI / 2; // 90 degrees
  }

  #castRays() {
    this.rays = [];
    for (let i = 0; i < this.rayCount; i++) {
      const rayAngle =
        lerp(
          this.raySpread / 2,
          -this.raySpread / 2,
          this.rayCount == 1 ? 0.5 : i / (this.rayCount - 1)
        ) + this.car.angle;

      const start = { x: this.car.x, y: this.car.y };
      const end = {
        x: this.car.x - Math.sin(rayAngle) * this.rayLength,
        y: this.car.y - Math.cos(rayAngle) * this.rayLength,
      };
      this.rays.push([start, end]);
    }
  }
}
```

Sensor implementation:

- Creates 5 rays in a fan pattern
- Rays spread across 90 degrees
- Each ray extends 150 units from car
- Ray angles are interpolated evenly across spread
- Updates with car position and rotation

### Intersection Detection

```jsx
#getReading(ray, roadBorders, traffic) {
    let touches = [];

    // Check road borders
    for (let i = 0; i < roadBorders.length; i++) {
        const touch = getIntersection(
            ray[0], ray[1],
            roadBorders[i][0], roadBorders[i][1]
        );
        if (touch) touches.push(touch);
    }

    // Check traffic
    for (let i = 0; i < traffic.length; i++) {
        const poly = traffic[i].polygon;
        for (let j = 0; j < poly.length; j++) {
            const touch = getIntersection(
                ray[0], ray[1],
                poly[j], poly[(j+1)%poly.length]
            );
            if (touch) touches.push(touch);
        }
    }

    // Return closest intersection
    if (touches.length == 0) return null;
    const offsets = touches.map(e => e.offset);
    const minOffset = Math.min(...offsets);
    return touches.find(e => e.offset == minOffset);
}

```

Intersection detection:

- Checks each ray against road borders and traffic
- Uses line-segment intersection algorithm
- Stores distance (offset) to each intersection
- Returns closest intersection point
- Null if no intersections found

## Traffic System

### Traffic Generation

```jsx
function generateCars(N, road) {
  const cars = [];
  for (let i = 1; i <= N; i++) {
    cars.push(new Car(road.getLaneCenter(1), 100, 30, 50, "AI"));
  }
  return cars;
}

const addTrafficCar = () => {
  const randomLane = Math.floor(Math.random() * 3);
  const bestCarY = Math.min(...carsRef.current.map((car) => car.y));
  const minY = bestCarY - window.innerHeight * 0.3;

  const newCar = new Car(
    road.getLaneCenter(randomLane),
    minY,
    30,
    50,
    "DUMMY",
    2,
    getRandomColor()
  );

  setTraffic((prevTraffic) => [...prevTraffic, newCar]);
};
```

- Generates dummy cars in random lanes
- Places new cars ahead of best AI car
- Removes cars too far behind
- Adjustable traffic speed
- Random colors for visual distinction
- Traffic cars are generated with:
  - Random lane positions
  - Constant forward movement
  - Different colors for visibility
  - Simplified AI (DUMMY control type)

**Dynamic Traffic Management**

- New traffic cars can be added during simulation
- Traffic speed can be adjusted
- Cars too far behind are automatically removed
- Traffic positions are relative to the best-performing car[1]

## Visualization

This simulation demonstrates the integration of multiple complex systems working together to create an evolving, learning self-driving car system. The combination of physics simulation, neural network processing, and evolutionary learning allows the cars to develop increasingly sophisticated driving behaviors over time.

**Main Canvas**

- Shows the road, cars, and sensors
- Camera follows the best-performing car
- Displays sensor rays and their intersections
- Shows collision detection in real-time

**Network Visualization**

```jsx
static drawNetwork(ctx, network) {
    const margin = 50;
    const left = margin;
    const top = margin;
    const width = ctx.canvas.width - margin * 2;
    const height = ctx.canvas.height - margin * 2;
    const levelHeight = height / network.levels.length;

    // Draw levels
    for (let i = network.levels.length - 1; i >= 0; i--) {
        const levelTop = top + lerp(
            height - levelHeight,
            0,
            network.levels.length == 1
                ? 0.5
                : i / (network.levels.length - 1)
        );

        ctx.setLineDash([7, 3]);
        Visualizer.drawLevel(
            ctx, network.levels[i],
            left, levelTop,
            width, levelHeight,
            i == network.levels.length - 1
                ? ["🠉", "🠈", "🠊", "🠋"]
                : []
        );
    }
}

```

Visualization features:

- Real-time neural network display
- Color-coded connections
- Node activation visualization
- Control output indicators
- Sensor ray rendering
- Network architecture display
- Displays neural network structure
- Shows active connections and neuron states
- Visualizes weights through line thickness and color
- Indicates bias values through node borders

## Technical Implementation

The project leverages several key concepts in deep learning:

- **Feedforward Neural Networks**: Multi-layer perceptron architecture for decision making
- **Genetic Algorithms**: Evolution-based learning through mutation and selection
- **Sensor Fusion**: Multiple raycast sensors providing environmental awareness
- **Real-time Visualization**: Canvas-based rendering of both the environment and neural network state

## Why This Matters

This simulator serves as a window into the learning process of neural networks, making typically abstract concepts tangible and observable. It demonstrates how:

- Neural networks develop decision-making capabilities through experience
- Simple rules can lead to complex, intelligent behavior
- Machine learning systems adapt to changing environments
- Collective learning can emerge from individual experiences

## Future Enhancements

The project is continuously evolving, with planned features including:

- Advanced learning algorithms
- More complex traffic scenarios
- Additional sensor types
- Performance metrics and analytics
- Training data export capabilities

## Getting Started

1. Clone the repository
2. Install dependencies with `npm install`
3. Run the development server with `npm run dev`
4. Open your browser to experience the learning process

## Contributing

Your contributions to improve this learning environment are welcome! Whether it's adding features, improving the learning algorithm, or enhancing the visualization, every contribution helps create a better understanding of neural networks.
