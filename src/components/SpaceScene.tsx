"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Stars, Float } from "@react-three/drei";
import * as THREE from "three";

// A simple floating asteroid component
function Asteroid({ position }: { position: [number, number, number] }) {
    const meshRef = useRef<THREE.Mesh>(null);

    useFrame((state, delta) => {
        if (meshRef.current) {
            meshRef.current.rotation.x += delta * 0.2;
            meshRef.current.rotation.y += delta * 0.3;
        }
    });

    return (
        <Float
            speed={1.5}
            rotationIntensity={1.5}
            floatIntensity={2}
            position={position}
        >
            <mesh ref={meshRef}>
                <dodecahedronGeometry args={[0.5, 0]} />
                <meshStandardMaterial
                    color="#888888"
                    roughness={0.8}
                    metalness={0.2}
                    wireframe={true}
                />
            </mesh>
        </Float>
    );
}

export default function SpaceScene() {
    return (
        <div className="fixed inset-0 w-screen h-screen z-0 overflow-hidden bg-black">
            <Canvas camera={{ position: [0, 0, 5], fov: 60 }}>
                <color attach="background" args={["#000000"]} />
                <ambientLight intensity={0.1} />
                <directionalLight position={[10, 10, 10]} intensity={1} />

                {/* Starry background */}
                <Stars
                    radius={100}
                    depth={50}
                    count={5000}
                    factor={4}
                    saturation={0}
                    fade
                    speed={1}
                />

                {/* Floating background elements */}
                <Asteroid position={[-3, 2, -5]} />
                <Asteroid position={[4, -1, -8]} />
                <Asteroid position={[-2, -3, -4]} />
            </Canvas>
        </div>
    );
}
