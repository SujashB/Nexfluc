"use client"

import * as React from "react"
import * as d3 from "d3"
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

export interface NetworkGraphProps {
  nodes: NetworkNode[]
  edges: NetworkEdge[]
  width?: number
  height?: number
  className?: string
}

export const NetworkGraph = React.forwardRef<HTMLDivElement, NetworkGraphProps>(
  ({ nodes, edges, width = 600, height = 400, className }, ref) => {
    const svgRef = React.useRef<SVGSVGElement>(null)
    const [dimensions, setDimensions] = React.useState({ width, height })

    React.useEffect(() => {
      if (!svgRef.current || nodes.length === 0) return

      const svg = d3.select(svgRef.current)
      svg.selectAll("*").remove()

      // Set up simulation
      const simulation = d3
        .forceSimulation(nodes as any)
        .force(
          "link",
          d3
            .forceLink(edges)
            .id((d: any) => d.id)
            .distance((d: any) => 100 - (d.strength || 0.5) * 50)
        )
        .force("charge", d3.forceManyBody().strength(-300))
        .force("center", d3.forceCenter(dimensions.width / 2, dimensions.height / 2))
        .force("collision", d3.forceCollide().radius((d: any) => (d.size || 10) + 5))

      // Create links
      const link = svg
        .append("g")
        .selectAll("line")
        .data(edges)
        .enter()
        .append("line")
        .attr("stroke", "rgba(255, 255, 255, 0.2)")
        .attr("stroke-width", (d) => (d.strength || 0.5) * 2)
        .attr("stroke-opacity", 0.6)

      // Create nodes
      const node = svg
        .append("g")
        .selectAll("circle")
        .data(nodes)
        .enter()
        .append("circle")
        .attr("r", (d) => d.size || 8)
        .attr("fill", (d) => {
          switch (d.type) {
            case "startup":
              return "rgba(249, 115, 22, 0.6)" // Orange
            case "concept":
              return "rgba(59, 130, 246, 0.6)" // Blue
            case "feature":
              return "rgba(168, 85, 247, 0.6)" // Purple
            default:
              return "rgba(156, 163, 175, 0.6)" // Gray
          }
        })
        .attr("stroke", "rgba(255, 255, 255, 0.3)")
        .attr("stroke-width", 1.5)
        .call(
          d3
            .drag<SVGCircleElement, NetworkNode>()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended) as any
        )

      // Add labels
      const labels = svg
        .append("g")
        .selectAll("text")
        .data(nodes)
        .enter()
        .append("text")
        .text((d) => d.label)
        .attr("font-size", "10px")
        .attr("fill", "rgba(255, 255, 255, 0.8)")
        .attr("dx", (d) => (d.size || 8) + 5)
        .attr("dy", 4)

      // Update positions on tick
      simulation.on("tick", () => {
        link
          .attr("x1", (d: any) => d.source.x)
          .attr("y1", (d: any) => d.source.y)
          .attr("x2", (d: any) => d.target.x)
          .attr("y2", (d: any) => d.target.y)

        node.attr("cx", (d: any) => d.x).attr("cy", (d: any) => d.y)

        labels.attr("x", (d: any) => d.x).attr("y", (d: any) => d.y)
      })

      function dragstarted(event: any) {
        if (!event.active) simulation.alphaTarget(0.3).restart()
        event.subject.fx = event.subject.x
        event.subject.fy = event.subject.y
      }

      function dragged(event: any) {
        event.subject.fx = event.x
        event.subject.fy = event.y
      }

      function dragended(event: any) {
        if (!event.active) simulation.alphaTarget(0)
        event.subject.fx = null
        event.subject.fy = null
      }

      // Handle resize
      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const { width: w, height: h } = entry.contentRect
          setDimensions({ width: w, height: h })
          simulation.force("center", d3.forceCenter(w / 2, h / 2))
        }
      })

      if (svgRef.current?.parentElement) {
        resizeObserver.observe(svgRef.current.parentElement)
      }

      return () => {
        simulation.stop()
        resizeObserver.disconnect()
      }
    }, [nodes, edges, dimensions])

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
      <div ref={ref} className={cn("w-full", className)}>
        <svg
          ref={svgRef}
          width={dimensions.width}
          height={dimensions.height}
          className="w-full rounded-lg border border-stone-700/50 bg-stone-900/20"
        />
      </div>
    )
  }
)

NetworkGraph.displayName = "NetworkGraph"

