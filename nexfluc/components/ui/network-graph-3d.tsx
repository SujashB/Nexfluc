"use client"

import * as React from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { OrbitControls, Sphere, Line, Text } from "@react-three/drei"
import * as THREE from "three"
import { cn } from "@/lib/utils"

export interface NetworkNode {
  id: string
  label: string
  type: "startup" | "concept" | "feature" | "market"
  size?: number
}

export interface NetworkEdge {
  source: string
  target: string
  strength?: number
}

export interface NetworkGraph3DProps {
  nodes: NetworkNode[]
  edges: NetworkEdge[]
  className?: string
}

function Node({
  node,
  position,
  isSelected,
}: {
  node: NetworkNode
  position: [number, number, number]
  isSelected: boolean
}) {
  const meshRef = React.useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = React.useState(false)

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.01
      meshRef.current.position.y =
        position[1] + Math.sin(state.clock.elapsedTime + position[0]) * 0.1
    }
  })

  const getColor = () => {
    switch (node.type) {
      case "startup":
        return "#f97316" // Orange
      case "concept":
        return "#3b82f6" // Blue
      case "feature":
        return "#a855f7" // Purple
      default:
        return "#9ca3af" // Gray
    }
  }

  return (
    <group position={position}>
      <Sphere
        ref={meshRef}
        args={[node.size || 0.3, 32, 32]}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <meshStandardMaterial
          color={getColor()}
          emissive={getColor()}
          emissiveIntensity={hovered || isSelected ? 0.5 : 0.2}
          metalness={0.8}
          roughness={0.2}
        />
      </Sphere>
      <Text
        position={[0, (node.size || 0.3) + 0.2, 0]}
        fontSize={0.15}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        {node.label}
      </Text>
    </group>
  )
}

function Edge({
  source,
  target,
  strength = 0.5,
}: {
  source: [number, number, number]
  target: [number, number, number]
  strength: number
}) {
  const points = React.useMemo(
    () => [new THREE.Vector3(...source), new THREE.Vector3(...target)],
    [source, target]
  )

  return (
    <Line
      points={points}
      color="white"
      opacity={strength * 0.3}
      lineWidth={strength * 2}
    />
  )
}

export const NetworkGraph3D = React.forwardRef<
  HTMLDivElement,
  NetworkGraph3DProps
>(({ nodes, edges, className }, ref) => {
  const [selectedId, setSelectedId] = React.useState<string | null>(null)

  // Calculate positions using force-directed layout
  const positions = React.useMemo(() => {
    if (nodes.length === 0) return new Map()

    const posMap = new Map<string, [number, number, number]>()
    const radius = Math.min(3, Math.max(2, nodes.length * 0.3))

    nodes.forEach((node, i) => {
      const angle = (i / nodes.length) * Math.PI * 2
      const x = Math.cos(angle) * radius
      const y = Math.sin(angle * 2) * 0.5
      const z = Math.sin(angle) * radius
      posMap.set(node.id, [x, y, z])
    })

    return posMap
  }, [nodes])

  if (nodes.length === 0) {
    return (
      <div
        ref={ref}
        className={cn(
          "flex h-[400px] items-center justify-center rounded-lg border border-stone-700/50 bg-stone-900/20",
          className
        )}
      >
        <p className="text-sm text-stone-500">No network data available</p>
      </div>
    )
  }

  return (
    <div ref={ref} className={cn("h-[400px] w-full rounded-lg", className)}>
      <Canvas camera={{ position: [0, 0, 8], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        <pointLight position={[-10, -10, -10]} intensity={0.3} />

        {edges.map((edge, i) => {
          const sourcePos = positions.get(edge.source)
          const targetPos = positions.get(edge.target)
          if (!sourcePos || !targetPos) return null
          return (
            <Edge
              key={i}
              source={sourcePos}
              target={targetPos}
              strength={edge.strength || 0.5}
            />
          )
        })}

        {nodes.map((node) => {
          const pos = positions.get(node.id)
          if (!pos) return null
          return (
            <Node
              key={node.id}
              node={node}
              position={pos}
              isSelected={selectedId === node.id}
            />
          )
        })}

        <OrbitControls enableDamping dampingFactor={0.05} />
      </Canvas>
    </div>
  )
})

NetworkGraph3D.displayName = "NetworkGraph3D"

