"use client"

import React, { useRef, useEffect } from "react"
import * as d3 from "d3"

interface NodeType extends d3.SimulationNodeDatum {
  id: string
  label: string
  type: "startup" | "concept" | "feature" | "market"
  size?: number
  x?: number
  y?: number
}

interface LinkType extends d3.SimulationLinkDatum<NodeType> {
  source: string | NodeType
  target: string | NodeType
  strength?: number
}

interface NetworkGraphCanvasProps {
  nodes: NodeType[]
  links: LinkType[]
  width?: number
  height?: number
  className?: string
}

export const NetworkGraphCanvas: React.FC<NetworkGraphCanvasProps> = ({
  nodes,
  links,
  width = 600,
  height = 400,
  className,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const context = canvas.getContext("2d")
    if (!context) return

    canvas.width = width
    canvas.height = height

    if (nodes.length === 0) {
      context.clearRect(0, 0, width, height)
      context.fillStyle = "rgba(255, 255, 255, 0.3)"
      context.font = "14px sans-serif"
      context.textAlign = "center"
      context.textBaseline = "middle"
      context.fillText("Start transcribing to see network graph", width / 2, height / 2)
      return
    }

    const simulation = d3
      .forceSimulation<NodeType>(nodes)
      .force(
        "link",
        d3
          .forceLink<NodeType, LinkType>(links)
          .id((d) => d.id)
          .distance((d) => (d.strength ? 150 / d.strength : 100))
      )
      .force("charge", d3.forceManyBody().strength(-200))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .on("tick", ticked)

    function ticked() {
      if (!context) return
      context.clearRect(0, 0, width, height)

      // draw links
      links.forEach((link) => {
        const s = link.source as NodeType
        const t = link.target as NodeType
        if (!(s.x && s.y && t.x && t.y) || !context) return

        context.beginPath()
        context.moveTo(s.x, s.y)
        context.lineTo(t.x, t.y)
        context.strokeStyle = "rgba(255, 255, 255, 0.3)"
        context.lineWidth = (link.strength ?? 1) * 1.5
        context.stroke()
      })

      // draw nodes
      nodes.forEach((node) => {
        if (!node.x || !node.y || !context) return
        const radius = node.size ?? 8

        context.beginPath()
        context.arc(node.x, node.y, radius, 0, 2 * Math.PI, false)

        // color nodes by type
        switch (node.type) {
          case "startup":
            context.fillStyle = "#FF7A1A"
            break
          case "concept":
            context.fillStyle = "#46C3FF"
            break
          case "feature":
            context.fillStyle = "#C06FFF"
            break
          case "market":
            context.fillStyle = "#8D8D8D"
            break
          default:
            context.fillStyle = "#888"
        }

        context.fill()

        // optional node label
        context.fillStyle = "#FFF"
        context.font = "10px sans-serif"
        context.textAlign = "center"
        context.textBaseline = "middle"
        context.fillText(node.label, node.x, node.y - radius - 10)
      })
    }

    return () => {
      simulation.stop()
    }
  }, [nodes, links, width, height])

  return (
    <div className={`w-full h-full overflow-hidden rounded-lg bg-black/30 ${className || ""}`}>
      <canvas ref={canvasRef} className="w-full h-full" style={{ width: "100%", height: "100%" }} />
    </div>
  )
}

