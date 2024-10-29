"use client";
import Image from "next/image";
import { useEffect } from "react";

export default function Home() {
  useEffect(() => {
    class Car {
      constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.speed = 0;
        this.angle = 0;
        this.acceleration = 0.3;
        this.maxSpeed = 3;
        this.friction = 0.05;
        this.controls = new Controls();
      }
      update() {
        this.#move();
      }
      #move() {
        if (this.controls.forward) {
          this.acceleration += 1;
          this.speed += this.acceleration;
        }
        if (this.controls.reverse) {
          this.speed -= this.acceleration;
        }
        if (this.speed > this.maxSpeed) {
          this.speed = this.maxSpeed;
        }
        if (this.speed < -(this.maxSpeed / 2)) {
          this.speed = -this.maxSpeed / 2;
        }
        if (this.speed > 0) {
          this.speed -= this.friction;
        }
        if (this.speed < 0) {
          this.speed += this.friction;
        }
        if (Math.abs(this.speed) < this.friction) {
          this.speed = 0;
        }
        if (this.speed != 0) {
          const flip = this.speed > 0 ? 1 : -1;
          if (this.controls.right) {
            this.angle -= 0.03 * flip;
          }
          if (this.controls.left) {
            this.angle += 0.03 * flip;
          }
        }
        this.x -= Math.sin(this.angle) * this.speed;
        this.y -= Math.cos(this.angle) * this.speed;
      }
      draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(-this.angle);
        ctx.beginPath();
        ctx.rect(-this.width / 2, -this.height / 2, this.width, this.height);
        ctx.fill();

        ctx.restore();
      }
    }

    class Controls {
      constructor() {
        this.forward = false;
        this.left = false;
        this.right = false;
        this.reverse = false;

        this.#addKeyboardListeners();
      }
      #addKeyboardListeners() {
        document.onkeydown = (event) => {
          switch (event.key) {
            case "ArrowUp":
              this.forward = true;
              break;
            case "ArrowLeft":
              this.left = true;
              break;
            case "ArrowRight":
              this.right = true;
              break;
            case "ArrowDown":
              this.reverse = true;
              break;
          }
          document.onkeyup = (event) => {
            switch (event.key) {
              case "ArrowUp":
                this.forward = false;
                break;
              case "ArrowLeft":
                this.left = false;
                break;
              case "ArrowRight":
                this.right = false;
                break;
              case "ArrowDown":
                this.reverse = false;
                break;
            }
          };
        };
      }
    }

    class Road {
      constructor(x, width, laneCount = 4) {
        this.x = x;
        this.width = width;
        this.laneCount = laneCount;
        this.left = x - width / 2;
        this.right = x + width / 2;

        const infinity = 100000;
        this.top = -infinity;
        this.bottom = infinity;
        const topLeft = { x: this.left, y: this.top };
        const topRight = { x: this.right, y: this.top };
        const bottomLeft = { x: this.left, y: this.bottom };
        const bottomRight = { x: this.right, y: this.bottom };

        this.borders = [
          [topLeft, bottomLeft],
          [topRight, bottomRight],
        ];
      }
      getLaneCenter(laneIndex) {
        const laneWidth = this.width / this.laneCount;
        return (
          this.left +
          laneWidth / 2 +
          Math.min(laneIndex, this.laneCount - 1) * laneWidth
        );
      }
      draw(ctx) {
        ctx.lineWidth = 5;
        ctx.strokeStyle = "white";

        for (let i = 1; i < this.laneCount ; i++) {
          const x = lerp(this.left, this.right, i / this.laneCount);

          ctx.setLineDash([20, 20]);
          ctx.beginPath();
          ctx.moveTo(x, this.top);
          ctx.lineTo(x, this.bottom);
          ctx.stroke();
        }
        ctx.setLineDash([]);
        this.borders.forEach((border) => {
          ctx.beginPath();
          ctx.moveTo(border[0].x, border[0].y);
          ctx.lineTo(border[1].x, border[1].y);
          ctx.stroke();
        });
      }
    }
    function lerp(A, B, t) {
      return A + (B - A) * t;
    }
    const canvas = document.getElementById("myCanvas");
    // Set actual canvas dimensions
    canvas.width = 200;
    const ctx = canvas.getContext("2d");
    const road = new Road(canvas.width / 2, canvas.width * 0.9);
    const car = new Car(road.getLaneCenter(1), 100, 30, 50);
    car.draw(ctx);

    animate();

    function animate() {
      car.update();
      canvas.height = window.innerHeight;
      ctx.save()
      ctx.translate(0,-car.y+canvas.height*0.5)

      road.draw(ctx);
      car.draw(ctx);

      ctx.restore()
      requestAnimationFrame(animate);
    }

    // Handle window resize
    const handleResize = () => {
      canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return <canvas className="bg-gray-400" id="myCanvas"></canvas>;
}
