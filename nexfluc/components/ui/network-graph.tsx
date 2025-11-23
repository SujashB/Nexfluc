"use client"

import * as React from "react"
import * as d3 from "d3"
import { cn } from "@/lib/utils"

export interface NetworkNode {
  id: string
  label: string
  type: "startup" | "concept" | "feature" | "market"
  size?: number
  description?: string
  x?: number
  y?: number
}

export interface NetworkEdge {
  source: string | NetworkNode
  target: string | NetworkNode
  strength?: number
}

export interface NetworkGraphProps {
  nodes: NetworkNode[]
  edges: NetworkEdge[]
  width?: number | string
  height?: number
  className?: string
}

export const NetworkGraph = React.forwardRef<HTMLDivElement, NetworkGraphProps>(
  ({ nodes, edges, width = "100%", height = 500, className }, ref) => {
    const canvasRef = React.useRef<HTMLCanvasElement>(null)
    const containerRef = React.useRef<HTMLDivElement>(null)
    const simulationRef = React.useRef<d3.Simulation<any, any> | null>(null)

    React.useEffect(() => {
      if (!canvasRef.current || !containerRef.current || nodes.length === 0) return

      const canvas = canvasRef.current
      const context = canvas.getContext("2d")
      if (!context) return

      // Set canvas dimensions
      const containerWidth = containerRef.current.clientWidth || 960
      const containerHeight = height
      canvas.width = containerWidth
      canvas.height = containerHeight

      // Convert string IDs to node objects for D3
      const nodeMap = new Map(nodes.map((n) => [n.id, n]))
      const d3Nodes = nodes.map((node) => ({
        ...node,
        x: node.x || Math.random() * containerWidth,
        y: node.y || Math.random() * containerHeight,
        fx: undefined,
        fy: undefined,
      }))

      const d3Links = edges.map((edge) => {
        const source =
          typeof edge.source === "string"
            ? d3Nodes.find((n) => n.id === edge.source) || d3Nodes[0]
            : edge.source
        const target =
          typeof edge.target === "string"
            ? d3Nodes.find((n) => n.id === edge.target) || d3Nodes[0]
            : edge.target
        return {
          source,
          target,
          strength: edge.strength || 0.5,
        }
      })

      // Set up force simulation
      const simulation = d3
        .forceSimulation(d3Nodes)
        .force(
          "link",
          d3
            .forceLink(d3Links)
            .id((d: any) => d.id)
            .distance((d: any) => 150 - (d.strength || 0.5) * 50)
        )
        .force("charge", d3.forceManyBody().strength(-500))
        .force("x", d3.forceX(containerWidth / 2))
        .force("y", d3.forceY(containerHeight / 2))
        .force("collision", d3.forceCollide().radius((d: any) => (d.size || 12) + 5))

      simulationRef.current = simulation

      // Render function
      function render() {
        if (!context) return

        // Clear canvas
        context.clearRect(0, 0, canvas.width, canvas.height)

        // Draw links
        d3Links.forEach((link: any) => {
          const source = link.source
          const target = link.target
          if (!source || !target || source.x === undefined || target.x === undefined) return

          context.beginPath()
          context.moveTo(source.x, source.y)
          context.lineTo(target.x, target.y)
          context.strokeStyle = "rgba(255, 255, 255, 0.3)"
          context.lineWidth = (link.strength || 0.5) * 2
          context.stroke()
        })

        // Draw nodes
        d3Nodes.forEach((node: any) => {
          if (node.x === undefined || node.y === undefined) return

          const radius = node.size || 12

          // Draw node circle
          context.beginPath()
          context.arc(node.x, node.y, radius, 0, 2 * Math.PI)

          // Set color based on type
          switch (node.type) {
            case "startup":
              context.fillStyle = "rgba(249, 115, 22, 0.8)" // Orange
              break
            case "concept":
              context.fillStyle = "rgba(59, 130, 246, 0.8)" // Blue
              break
            case "feature":
              context.fillStyle = "rgba(168, 85, 247, 0.8)" // Purple
              break
            default:
              context.fillStyle = "rgba(156, 163, 175, 0.8)" // Gray
          }

          context.fill()
          context.strokeStyle = "rgba(255, 255, 255, 0.5)"
          context.lineWidth = 2
          context.stroke()

          // Draw label
          context.fillStyle = "rgba(255, 255, 255, 0.9)"
          context.font = "11px sans-serif"
          context.textAlign = "center"
          context.textBaseline = "top"
          const label = node.label.length > 15 ? node.label.substring(0, 15) + "..." : node.label
          context.fillText(label, node.x, node.y + radius + 5)
        })
      }

      // Update on simulation tick
      simulation.on("tick", render)

      // Initial render
      render()

      // Handle resize
      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const { width: w, height: h } = entry.contentRect
          canvas.width = w
          canvas.height = h
          simulation.force("x", d3.forceX(w / 2))
          simulation.force("y", d3.forceY(h / 2))
          render()
        }
      })

      if (containerRef.current) {
        resizeObserver.observe(containerRef.current)
      }

      return () => {
        simulation.stop()
        resizeObserver.disconnect()
      }
    }, [nodes, edges, height])

    if (nodes.length === 0) {
      return (
        <div
          ref={ref}
          className={cn(
            "flex h-[500px] items-center justify-center rounded-lg border border-stone-700/50 bg-stone-900/20",
            className
          )}
        >
          <p className="text-sm text-stone-500">No network data available</p>
        </div>
      )
    }

    return (
      <div
        ref={(node) => {
          if (ref) {
            if (typeof ref === "function") {
              ref(node)
            } else {
              ref.current = node
            }
          }
          containerRef.current = node
        }}
        className={cn("w-full rounded-lg border border-stone-700/50 bg-stone-900/20", className)}
        style={{ height: `${height}px`, minHeight: `${height}px` }}
      >
        <canvas
          ref={canvasRef}
          className="w-full h-full"
          style={{ display: "block" }}
        />
      </div>
    )
  }
)

NetworkGraph.displayName = "NetworkGraph"
