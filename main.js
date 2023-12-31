import { Bodies, Body, Engine, Events, Render, Runner, Sleeping, World } from 'matter-js';
import { FRUITS } from './fruits';

const engine = Engine.create();
const render = Render.create({
  engine,
  element: document.body,
  options: {
    wireframes: false,
    background: '#F7F4C8',
    width: 1000,
    height: 850,
  },
});

const world = engine.world;
let score = 0;

// Create a div element for displaying the score
const scoreElement = document.createElement('div');
scoreElement.id = 'score';
scoreElement.style.position = 'absolute';
scoreElement.style.top = '15px';
scoreElement.style.left = '50px';
scoreElement.style.fontSize = '24px';
scoreElement.style.fontFamily = 'cursive';
document.body.appendChild(scoreElement);

// Create an image element
const imageElement = new Image();
imageElement.src = 'public/back.png'; // Replace with the correct path to your image
imageElement.style.position = 'absolute';
imageElement.style.width = '330px'; // Adjust the width as needed
imageElement.style.height = '800px';
imageElement.style.left = '655px'; // Replace with your desired x-coordinate
imageElement.style.top = '30px'; 

document.body.appendChild(imageElement);

const ground = Bodies.rectangle(310, 820, 620, 60, {
  isStatic: true,
  render: {
    fillStyle: '#E6B143',
  },
});

const leftWall = Bodies.rectangle(15, 395, 30, 790, {
  isStatic: true,
  render: {
    fillStyle: '#E6B143',
  },
});

const rightWall = Bodies.rectangle(605, 395, 30, 790, {
  isStatic: true,
  render: {
    fillStyle: '#E6B143',
  },
});

const topLine = Bodies.rectangle(310, 150, 620, 2, {
  isStatic: true,
  isSensor: true,
  render: {
    fillStyle: '#E6B143',
  },
  label: 'topLine',
});

World.add(world, [ground, leftWall, rightWall, topLine]);

Render.run(render);
Runner.run(engine);

let currentBody = null;
let currentFruit = null;
let interval = null;
let disableAction = false;

function addCurrentFruit() {
  const randomFruit = getRandomFruit();
  const body = Bodies.circle(300, 50, randomFruit.radius, {
    label: randomFruit.label,
    isSleeping: true,
    render: {
      fillStyle: randomFruit.color,
      sprite: { texture: `/${randomFruit.label}.png` },
    },
    restitution: 0.2,
  });

  currentBody = body;
  currentFruit = randomFruit;

  World.add(world, body);
}

function getRandomFruit() {
  const randomIndex = Math.floor(Math.random() * 5);
  const fruit = FRUITS[randomIndex];

  if (currentFruit && currentFruit.label == fruit.label) return getRandomFruit();

  return fruit;
}

window.onkeydown = (event) => {
  if (disableAction) return;
  switch (event.code) {
    case 'ArrowLeft':
      if (interval) return;
      interval = setInterval(() => {
        if (currentBody.position.x - 20 > 30)
          Body.setPosition(currentBody, {
            x: currentBody.position.x - 2,
            y: currentBody.position.y,
          });
      }, 5);
      break;

    case 'ArrowRight':
      if (interval) return;
      interval = setInterval(() => {
        if (currentBody.position.x + 20 < 590)
          Body.setPosition(currentBody, {
            x: currentBody.position.x + 2,
            y: currentBody.position.y,
          });
      }, 5);
      break;

    case 'Space':
      disableAction = true;
      Sleeping.set(currentBody, false);
      setTimeout(() => {
        addCurrentFruit();
        disableAction = false;
      }, 500);
      break;
  }
};

window.onkeyup = (event) => {
  switch (event.code) {
    case 'ArrowLeft':
    case 'ArrowRight':
      clearInterval(interval);
      interval = null;
      break;
  }
};

// Handle mouse movement
document.addEventListener('mousemove', (event) => {
  const mouseX = event.clientX;

  // Move the current fruit horizontally to the cursor position only when not falling
  if (currentBody && !disableAction) {
    const newY = currentBody.position.y; // Keep the current y-coordinate
    Body.setPosition(currentBody, {
      x: Math.min(Math.max(mouseX, 30), 590), // Constrain within the canvas boundaries
      y: newY,
    });
  }
});

// Handle mouse click
document.addEventListener('click', () => {
  if (!disableAction) {
    disableAction = true;
    Sleeping.set(currentBody, false);
    setTimeout(() => {
      addCurrentFruit();
      disableAction = false;
    }, 500);
  }
});

Events.on(engine, 'collisionStart', (event) => {
  event.pairs.forEach((collision) => {
    if (collision.bodyA.label == collision.bodyB.label) {
      World.remove(world, [collision.bodyA, collision.bodyB]);

      const index = FRUITS.findIndex((fruit) => fruit.label == collision.bodyA.label);

      if (index == FRUITS.length - 1) return;

      const newFruit = FRUITS[index + 1];
      const body = Bodies.circle(collision.collision.supports[0].x, collision.collision.supports[0].y, newFruit.radius, {
        render: {
          fillStyle: newFruit.color,
          sprite: { texture: `/${newFruit.label}.png` },
        },
        label: newFruit.label,
      });

      World.add(world, body);
      // Increase the score when a collision occurs
      score += 10;
      updateScore();
    }

    if ((collision.bodyA.label == 'topLine' || collision.bodyB.label == 'topLine') && !disableAction) {
      setTimeout(() => {
        alert('Game Over! Your Score: ' + score);
        resetGame();
      }, 1000);
    }
  });
});

function updateScore() {
  // Display the score in the score element
  scoreElement.innerText = 'Score: ' + score;
}

function resetGame() {
  // Reset the score and clear any existing bodies
  score = 0;
  updateScore();
  World.clear(world);
  addCurrentFruit();
}

// Initialize the game with the first fruit
addCurrentFruit();