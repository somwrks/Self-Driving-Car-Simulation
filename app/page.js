"use client";
import Image from "next/image";
import { useEffect } from "react";

export default function Home() {
  useEffect(() => {
    class Car {
      constructor(x, y, width, height, controlType, maxSpeed = 3) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.speed = 0;
        this.angle = 0;
        this.acceleration = 0.3;
        this.maxSpeed = maxSpeed;
        this.damaged = false;
        this.friction = 0.05;
        if (controlType != "DUMMY") {
          this.sensor = new Sensor(this);
        }
        this.controls = new Controls(controlType);
      }
      update(roadBorders) {
        if (!this.damaged) {
          this.#move();
          this.polygon = this.#createPolygon();
          this.damaged = this.#assessDamage(roadBorders);
        }

        if (this.sensor) {
          this.sensor.update(roadBorders);
        }
        this.sensor.update(roadBorders);
      } //#endregion
      #assessDamage(roadBorders) {
        for (let i = 0; i < roadBorders.length; i++) {
          if (polysIntersect(this.polygon, roadBorders[i])) return true;
        }
        return false;
      }
      #createPolygon() {
        const points = [];
        const rad = Math.hypot(this.width, this.height) / 2;
        const alpha = Math.atan2(this.width, this.height);
        points.push({
          x: this.x - Math.sin(this.angle - alpha) * rad,
          y: this.y - Math.cos(this.angle - alpha) * rad,
        });
        points.push({
          x: this.x - Math.sin(this.angle + alpha) * rad,
          y: this.y - Math.cos(this.angle + alpha) * rad,
        });
        points.push({
          x: this.x - Math.sin(Math.PI + this.angle - alpha) * rad,
          y: this.y - Math.cos(Math.PI + this.angle - alpha) * rad,
        });
        points.push({
          x: this.x - Math.sin(Math.PI + this.angle + alpha) * rad,
          y: this.y - Math.cos(Math.PI + this.angle + alpha) * rad,
        });
        return points;
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
        if (this.damaged) {
          ctx.fillStyle = "red";
        } else {
          ctx.fillStyle = "blue";
        }
        ctx.beginPath();
        ctx.moveTo(this.polygon[0].x, this.polygon[0].y);
        for (let i = 1; i < this.polygon.length; i++) {
          ctx.lineTo(this.polygon[i].x, this.polygon[i].y);
        }
        ctx.fill();
        if (this.sensor) {
          this.sensor.draw(ctx);
        }
      }
    }

    class Controls {
      constructor(type) {
        this.forward = false;
        this.left = false;
        this.right = false;
        this.reverse = false;
        switch (type) {
          case "KEYS":
            this.#addKeyboardListeners();
            break;
          case "DUMMY":
            this.forward = true;
            break;
          default:
        }
      }

      #addKeyboardListeners() {
        document.onkeydown = (event) => {
          switch (event.key) {
            case "ArrowLeft":
            case "a":
              this.left = true;
              break;
            case "ArrowRight":
            case "d":
              this.right = true;
              break;
            case "ArrowUp":
            case "w":
              this.forward = true;
              break;
            case "ArrowDown":
            case "s":
              this.reverse = true;
              break;
          }
        };
        document.onkeyup = (event) => {
          switch (event.key) {
            case "ArrowLeft":
            case "a":
              this.left = false;
              break;
            case "ArrowRight":
            case "d":
              this.right = false;
              break;
            case "ArrowUp":
            case "w":
              this.forward = false;
              break;
            case "ArrowDown":
            case "s":
              this.reverse = false;
              break;
          }
        };
      }
    }

    class Road {
      constructor(x, width, laneCount = 3) {
        this.x = x;
        this.width = width;
        this.laneCount = laneCount;

        this.left = x - width / 2;
        this.right = x + width / 2;

        const infinity = 1000000;
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

        for (let i = 1; i <= this.laneCount - 1; i++) {
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

    class Sensor {
      constructor(car) {
        this.car = car;
        this.rayCount = 5;
        this.rayLength = 150;
        this.raySpread = Math.PI / 2;

        this.rays = [];
        this.readings = [];
      }

      update(roadBorders) {
        this.#castRays();
        this.readings = [];
        for (let i = 0; i < this.rays.length; i++) {
          this.readings.push(this.#getReading(this.rays[i], roadBorders));
        }
      }

      #getReading(ray, roadBorders) {
        let touches = [];

        for (let i = 0; i < roadBorders.length; i++) {
          const touch = getIntersection(
            ray[0],
            ray[1],
            roadBorders[i][0],
            roadBorders[i][1]
          );
          if (touch) {
            touches.push(touch);
          }
        }

        if (touches.length == 0) {
          return null;
        } else {
          const offsets = touches.map((e) => e.offset);
          const minOffset = Math.min(...offsets);
          return touches.find((e) => e.offset == minOffset);
        }
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

      draw(ctx) {
        if (!this.rays.length) return; // Guard clause

        for (let i = 0; i < this.rayCount; i++) {
          let end = this.rays[i][1];
          if (this.readings[i]) {
            end = this.readings[i];
          }

          ctx.beginPath();
          ctx.lineWidth = 2;
          ctx.strokeStyle = "yellow";
          ctx.moveTo(this.rays[i][0].x, this.rays[i][0].y);
          ctx.lineTo(end.x, end.y);
          ctx.stroke();

          ctx.beginPath();
          ctx.lineWidth = 2;
          ctx.strokeStyle = "black";
          ctx.moveTo(this.rays[i][1].x, this.rays[i][1].y);
          ctx.lineTo(end.x, end.y);
          ctx.stroke();
        }
      }
    }
    function lerp(A, B, t) {
      return A + (B - A) * t;
    }

    function getIntersection(A, B, C, D) {
      const tTop = (D.x - C.x) * (A.y - C.y) - (D.y - C.y) * (A.x - C.x);
      const uTop = (C.y - A.y) * (A.x - B.x) - (C.x - A.x) * (A.y - B.y);
      const bottom = (D.y - C.y) * (B.x - A.x) - (D.x - C.x) * (B.y - A.y);

      if (bottom != 0) {
        const t = tTop / bottom;
        const u = uTop / bottom;
        if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
          return {
            x: lerp(A.x, B.x, t),
            y: lerp(A.y, B.y, t),
            offset: t,
          };
        }
      }

      return null;
    }
    function polysIntersect(poly1, poly2) {
      for (let i = 0; i < poly1.length; i++) {
        for (let j = 0; j < poly2.length; j++) {
          const touch = getIntersection(
            poly1[i],
            poly1[(i + 1) % poly1.length],
            poly2[j],
            poly2[(j + 1) % poly2.length]
          );
          if (touch) {
            return true;
          }
        }
      }
      return false;
    }
    const canvas = document.getElementById("myCanvas");
    canvas.width = 200;

    const ctx = canvas.getContext("2d");
    const road = new Road(canvas.width / 2, canvas.width * 0.9);
    const car = new Car(road.getLaneCenter(1), 100, 30, 50, "KEYS");

    const traffic = [new Car(road.getLaneCenter(1), -100, 30, 50, "DUMMY", 2)];
    animate();

    function animate() {
      for (let i = 0; i < traffic.length; i++) {
        traffic[i].update(road.borders);
      }
      canvas.height = window.innerHeight;

      ctx.save();
      ctx.translate(0, -car.y + canvas.height * 0.7);

      road.draw(ctx);
      car.update(road.borders);
      for (let i = 0; i < traffic.length; i++) {
        traffic[i].draw(ctx);
      }
      car.draw(ctx);

      ctx.restore();
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
