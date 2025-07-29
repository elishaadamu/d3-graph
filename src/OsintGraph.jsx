import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import data from "./data.json"; // Your JSON file

const OsintTree = () => {
  const svgRef = useRef();
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    // Add CSS for instant tooltips
    const style = document.createElement("style");
    style.textContent = `
      svg title {
        pointer-events: none;
      }
      .node:hover title {
        display: block;
        transition: none !important;
        animation: none !important;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  useEffect(() => {
    const updateDimensions = () => {
      const container = svgRef.current?.parentElement;
      if (container) {
        const isMobile = window.innerWidth < 768;

        // Set minimum width to 1280px for desktop, keep responsive for mobile
        const containerWidth = isMobile
          ? container.clientWidth
          : Math.max(1280, container.clientWidth);

        const containerHeight = Math.max(600, window.innerHeight - 200);
        setDimensions({ width: containerWidth, height: containerHeight });
      }
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  useEffect(() => {
    if (dimensions.width === 0) return;

    // Responsive margins and spacing
    const isMobile = dimensions.width < 768;
    const isTablet = dimensions.width >= 768 && dimensions.width < 1024;

    const margin = {
      top: isMobile ? 80 : 60,
      right: isMobile ? 20 : 200,
      bottom: 20,
      left: isMobile ? 20 : 200,
    };

    const width = dimensions.width - margin.left - margin.right;
    const height = dimensions.height - margin.top - margin.bottom;

    // Responsive node spacing
    const nodeSpacing = isMobile ? 120 : isTablet ? 180 : 250;

    let i = 0;

    // Clear any existing content
    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3
      .select(svgRef.current)
      .attr("width", dimensions.width)
      .attr("height", dimensions.height);

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Add level titles with responsive positioning
    const levelTitles = [
      "Vision",
      "Goals",
      "Objectives",
      "Performance Measures",
    ];

    // Define colors for each level
    const levelColors = [
      "#e11d48", // Vision - Red
      "#059669", // Goals - Green
      "#2563eb", // Objectives - Blue
      "#7c3aed", // Performance Measures - Purple
    ];

    const titleGroup = svg.append("g").attr("class", "level-titles");

    levelTitles.forEach((title, index) => {
      titleGroup
        .append("text")
        .attr("class", "level-title")
        .attr("x", margin.left + index * nodeSpacing)
        .attr("y", isMobile ? 30 : 20)
        .attr("text-anchor", "middle")
        .style("font-size", isMobile ? "10px" : "14px")
        .style("font-weight", "bold")
        .style("fill", levelColors[index])
        .text(title);
    });

    const root = d3.hierarchy(data);
    root.x0 = height / 2;
    root.y0 = 0;

    // Define collapse function first
    function collapse(d) {
      if (d.children) {
        d._children = d.children;
        d._children.forEach(collapse);
        d.children = null;
      }
    }

    // Initially collapse ALL children of the root (Vision)
    // so only the Vision node circle is visible when page loads
    if (root.children) {
      root.children.forEach(collapse);
      // Hide the children completely on initial load
      root._children = root.children;
      root.children = null;
    }

    const treeLayout = d3.tree().size([height, width]);

    // Now call update with the collapsed tree
    update(root);

    function update(source) {
      const duration = 750;

      const treeData = treeLayout(root);
      const nodes = treeData.descendants();
      const links = treeData.links();

      nodes.forEach((d) => (d.y = d.depth * nodeSpacing));

      // Nodes
      const node = g
        .selectAll("g.node")
        .data(nodes, (d) => d.id || (d.id = ++i));

      const nodeEnter = node
        .enter()
        .append("g")
        .attr("class", "node")
        .attr("transform", (d) => `translate(${source.y0},${source.x0})`)
        .on("click", (event, d) => {
          toggle(d);
          update(d);
        });

      nodeEnter
        .append("circle")
        .attr("r", 1e-6)
        .style("fill", (d) => (d._children ? "#1e3a8a" : "#fff"));

      // Responsive text positioning and sizing
      nodeEnter
        .filter((d) => d.data.type === "url")
        .append("a")
        .attr("xlink:href", (d) => d.data.url)
        .attr("target", "_blank")
        .append("text")
        .attr("dy", ".35em")
        .attr("x", (d) =>
          d.children || d._children ? (isMobile ? -8 : -13) : isMobile ? 8 : 13
        )
        .attr("text-anchor", (d) =>
          d.children || d._children ? "end" : "start"
        )
        .text((d) => {
          const maxLength = isMobile ? 15 : 25;
          return d.data.name.length > maxLength
            ? d.data.name.substring(0, maxLength) + "..."
            : d.data.name;
        })
        .style("fill-opacity", 1e-6)
        .style("font-size", isMobile ? "10px" : "12px");

      nodeEnter
        .filter((d) => d.data.type !== "url")
        .append("text")
        .attr("dy", ".35em")
        .attr("x", (d) =>
          d.children || d._children ? (isMobile ? -8 : -13) : isMobile ? 8 : 13
        )
        .attr("text-anchor", (d) =>
          d.children || d._children ? "end" : "start"
        )
        .text((d) => {
          const maxLength = isMobile ? 15 : 25;
          return d.data.name.length > maxLength
            ? d.data.name.substring(0, maxLength) + "..."
            : d.data.name;
        })
        .style("fill-opacity", 1e-6)
        .style("font-size", isMobile ? "10px" : "12px");

      // Add custom instant tooltips instead of title elements
      nodeEnter
        .on("mouseenter", function (event, d) {
          // Remove any existing tooltip
          d3.select("body").select(".custom-tooltip").remove();

          // Create new tooltip
          const tooltip = d3
            .select("body")
            .append("div")
            .attr("class", "custom-tooltip")
            .style("position", "absolute")
            .style("background", "rgba(0, 0, 0, 0.8)")
            .style("color", "white")
            .style("padding", "8px")
            .style("border-radius", "4px")
            .style("font-size", "12px")
            .style("pointer-events", "none")
            .style("z-index", "1000")
            .style("left", event.pageX + 10 + "px")
            .style("top", event.pageY - 10 + "px")
            .text(d.data.name);
        })
        .on("mouseleave", function () {
          d3.select("body").select(".custom-tooltip").remove();
        });

      // Transition to new position
      const nodeUpdate = node
        .merge(nodeEnter)
        .transition()
        .duration(duration)
        .attr("transform", (d) => `translate(${d.y},${d.x})`);

      nodeUpdate
        .select("circle")
        .attr("r", isMobile ? 4 : 6)
        .style("fill", (d) => (d._children ? "#1e3a8a" : "#fff"));

      nodeUpdate.select("text").style("fill-opacity", 1);

      const nodeExit = node
        .exit()
        .transition()
        .duration(duration)
        .attr("transform", () => `translate(${source.y},${source.x})`)
        .remove();

      nodeExit.select("circle").attr("r", 1e-6);
      nodeExit.select("text").style("fill-opacity", 1e-6);

      // Links
      const link = g.selectAll("path.link").data(links, (d) => d.target.id);

      const diagonal = d3
        .linkHorizontal()
        .x((d) => d.y)
        .y((d) => d.x);

      link
        .enter()
        .insert("path", "g")
        .attr("class", "link")
        .style("fill", "none")
        .style("stroke", (d) => {
          // Color links based on target depth
          const targetDepth = d.target.depth;
          return levelColors[Math.min(targetDepth, levelColors.length - 1)];
        })
        .style("stroke-width", "0.4px")
        .attr("d", () => {
          const o = { x: source.x0, y: source.y0 };
          return diagonal({ source: o, target: o });
        })
        .transition()
        .duration(duration)
        .attr("d", diagonal);

      link
        .transition()
        .duration(duration)
        .attr("d", diagonal)
        .style("stroke", (d) => {
          // Update color on transition
          const targetDepth = d.target.depth;
          return levelColors[Math.min(targetDepth, levelColors.length - 1)];
        });

      link
        .exit()
        .transition()
        .duration(duration)
        .attr("d", () => {
          const o = { x: source.x, y: source.y };
          return diagonal({ source: o, target: o });
        })
        .remove();

      // Save the current position for transitions
      nodes.forEach((d) => {
        d.x0 = d.x;
        d.y0 = d.y;
      });
    }

    function toggle(d) {
      if (d.children) {
        d._children = d.children;
        d.children = null;
      } else {
        d.children = d._children;
        d._children = null;
      }
    }
  }, [dimensions]);

  const [isAccordionOpen, setIsAccordionOpen] = useState(false);

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <svg ref={svgRef} style={{ width: "100%", height: "100%" }}></svg>
      <div
        style={{
          position: "absolute",
          top: `${
            dimensions.height / 2 + (dimensions.width < 768 ? 60 : 80)
          }px`, // Vision circle center + small offset
          left: `${dimensions.width < 768 ? 40 : 200}px`, // Same as Vision circle's left margin
          transform: "translateX(-50%)", // Center the accordion under the circle
          maxWidth: dimensions.width < 768 ? "106px" : "148px", // Reduced to 53% of original (200px * 0.53 = 106px, 280px * 0.53 = 148px)
        }}
      >
        <button
          onClick={() => setIsAccordionOpen(!isAccordionOpen)}
          style={{
            backgroundColor: isAccordionOpen ? "#e5e7eb" : "#f3f4f6",
            border: "1px solid #d1d5db",
            borderRadius: isAccordionOpen ? "6px 6px 0 0" : "6px",
            padding: "10px 14px",
            fontSize: dimensions.width < 768 ? "11px" : "12px",
            fontWeight: "600",
            color: "#374151",
            cursor: "pointer",
            width: "100%",
            textAlign: "left",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            transition: "all 0.2s ease-in-out",
            boxShadow: isAccordionOpen
              ? "0 2px 4px rgba(0, 0, 0, 0.1)"
              : "0 1px 2px rgba(0, 0, 0, 0.05)",
            outline: "none",
          }}
          onMouseEnter={(e) => {
            if (!isAccordionOpen) {
              e.target.style.backgroundColor = "#e5e7eb";
            }
          }}
          onMouseLeave={(e) => {
            if (!isAccordionOpen) {
              e.target.style.backgroundColor = "#f3f4f6";
            }
          }}
        >
          <span>Vision Statement</span>
          <span
            style={{
              transform: isAccordionOpen ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.3s ease-in-out",
              fontSize: "10px",
              color: "#6b7280",
            }}
          >
            ▼
          </span>
        </button>
        <div
          style={{
            maxHeight: isAccordionOpen ? "160px" : "0",
            overflow: isAccordionOpen ? "auto" : "hidden",
            transition:
              "max-height 0.3s ease-in-out, box-shadow 0.2s ease-in-out",
            border: isAccordionOpen ? "1px solid #d1d5db" : "none",
            borderTop: "none",
            borderRadius: "0 0 6px 6px",
            backgroundColor: "#f9fafb",
            boxShadow: isAccordionOpen
              ? "0 4px 6px rgba(0, 0, 0, 0.1)"
              : "none",
            // Custom scrollbar styles
            scrollbarWidth: "thin",
            scrollbarColor: "#cbd5e1 #f1f5f9",
          }}
          className="custom-scrollbar"
        >
          <style jsx>{`
            .custom-scrollbar::-webkit-scrollbar {
              width: 6px;
            }
            .custom-scrollbar::-webkit-scrollbar-track {
              background: #f1f5f9;
              border-radius: 3px;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb {
              background: #cbd5e1;
              border-radius: 3px;
              transition: background 0.2s ease;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover {
              background: #94a3b8;
            }
          `}</style>
          <p
            className="footer-text"
            style={{
              margin: "0",
              padding: "14px 16px",
              fontSize: dimensions.width < 768 ? "10px" : "12px",
              color: "#4b5563",
              lineHeight: "1.5",
              wordWrap: "break-word",
              overflowWrap: "break-word",
              hyphens: "auto",
              width: "100%",
              boxSizing: "border-box",
              fontFamily:
                "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
              letterSpacing: "0.025em",
            }}
          >
            An integrated network, cost effective, multimodal transportation
            system that safely and efficiently moves people and goods throughout
            the region in an equitable and environmentally responsible manner to
            support economic prosperity and improved quality of life for all
            users.
          </p>
        </div>
      </div>
    </div>
  );
};

export default OsintTree;
