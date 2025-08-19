import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import data from "./data.json"; // Your JSON file

const OsintTree = () => {
  const svgRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [isTreeExpanded, setIsTreeExpanded] = useState(false);

  // === LINK OPTIONS ===
  const LINK_MODE = "curved"; // "curved" | "straight"
  const CURVE_TENSION = 0.75; // 0.0..1.0 (higher => flatter curve)

  // measure container
  useEffect(() => {
    const updateDimensions = () => {
      const container = svgRef.current?.parentElement;
      if (container) {
        const isMobile = window.innerWidth < 768;
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

    // responsive flags
    const isMobile = dimensions.width < 768;
    const isTablet = dimensions.width >= 768 && dimensions.width < 1024;

    // margins
    const margin = {
      top: isMobile ? 80 : 60,
      right: isMobile ? 20 : 220,
      bottom: 20,
      left: isMobile ? 20 : 220,
    };

    const width = dimensions.width - margin.left - margin.right;
    const height = dimensions.height - margin.top - margin.bottom;

    // horizontal spacing
    const nodeSpacing = isMobile ? 180 : isTablet ? 260 : 1000;

    let i = 0;

    // clear
    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3
      .select(svgRef.current)
      .attr("width", dimensions.width)
      .attr("height", dimensions.height);

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Level titles
    const levelTitles = [
      "Vision",
      "Goals",
      "Objectives",
      "Performance Measures",
    ];
    const levelColors = ["#e11d48", "#059669", "#2563eb", "#7c3aed"];

    const titleGroup = svg.append("g").attr("class", "level-titles");
    levelTitles.forEach((title, index) => {
      titleGroup
        .append("text")
        .attr("class", "level-title")
        .attr("x", margin.left + index * nodeSpacing)
        .attr("y", isMobile ? 30 : 50)
        .attr("text-anchor", "middle")
        .style("font-size", isMobile ? "10px" : "40px")
        .style("font-weight", "bold")
        .style("fill", levelColors[index])
        .style("margin-top", "10px")
        .text(title);
    });

    // data & collapse
    const root = d3.hierarchy(data);
    root.x0 = height / 2;
    root.y0 = 0;

    function collapse(d) {
      if (d.children) {
        d._children = d.children;
        d._children.forEach(collapse);
        d.children = null;
      }
    }

    // collapse all children of root initially
    if (root.children) {
      root.children.forEach(collapse);
      root._children = root.children;
      root.children = null;
    }

    const treeLayout = d3.tree().size([height, width]);

    update(root);

    function linkPath(d) {
      const s = d.source;
      const t = d.target;
      if (LINK_MODE === "straight") {
        return `M${s.y},${s.x}L${t.y},${t.x}`;
      }
      // Curved with controllable tension
      const dx = t.y - s.y;
      const alpha = dx * CURVE_TENSION;
      return `M${s.y},${s.x}C${s.y + alpha},${s.x} ${t.y - alpha},${t.x} ${
        t.y
      },${t.x}`;
    }

    function update(source) {
      const duration = 750;

      const treeData = treeLayout(root);
      const nodes = treeData.descendants();
      const links = treeData.links();

      nodes.forEach((d) => (d.y = d.depth * nodeSpacing));

      // NODES
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
        .attr(
          "cx",
          (d) => (d.children || d._children ? 20 : -20) // push circle left/right
        )
        .attr("r", isMobile ? 6 : 8)
        .style("stroke", (d) => (d._children ? "#1e3a8a" : "rgb(164 148 148)"))
        .style("fill", "#1e293b")
        .style("stroke-width", isMobile ? 0.8 : 25);

      // text for URL nodes
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
        .text((d) => d.data.name)
        .style("fill-opacity", 1e-6)
        .style("font-size", isMobile ? "32px" : "32px");

      // text for normal nodes
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
        .text((d) => d.data.name)
        .style("fill-opacity", 1e-6)
        .style("font-size", isMobile ? "32px" : "32px");

      // update positions
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

      // LINKS
      const link = g.selectAll("path.link").data(links, (d) => d.target.id);

      link
        .enter()
        .insert("path", "g")
        .attr("class", "link")
        .style("fill", "none")
        .style("stroke", (d) => {
          const targetDepth = d.target.depth;
          return levelColors[Math.min(targetDepth, levelColors.length - 1)];
        })
        .style("stroke-width", isMobile ? "0.45px" : "0.7px")
        .attr("d", () => {
          const o = { x: source.x0, y: source.y0 };
          return LINK_MODE === "straight"
            ? `M${o.y},${o.x}L${o.y},${o.x}`
            : `M${o.y},${o.x}C${o.y},${o.x} ${o.y},${o.x} ${o.y},${o.x}`;
        })
        .transition()
        .duration(duration)
        .attr("d", linkPath);

      link
        .transition()
        .duration(duration)
        .attr("d", linkPath)
        .style("stroke", (d) => {
          const targetDepth = d.target.depth;
          return levelColors[Math.min(targetDepth, levelColors.length - 1)];
        })
        .style("stroke-width", isMobile ? "1.25px" : "0.8px");

      link
        .exit()
        .transition()
        .duration(duration)
        .attr("d", () => {
          const o = { x: source.x, y: source.y };
          return LINK_MODE === "straight"
            ? `M${o.y},${o.x}L${o.y},${o.x}`
            : `M${o.y},${o.x}C${o.y},${o.x} ${o.y},${o.x} ${o.y},${o.x}`;
        })
        .remove();

      nodes.forEach((d) => {
        d.x0 = d.x;
        d.y0 = d.y;
      });
    }

    function toggle(d) {
      if (d.children) {
        d._children = d.children;
        d.children = null;
        if (d.depth === 0) {
          setIsTreeExpanded(false);
        }
      } else {
        d.children = d._children;
        d._children = null;
      }
    }
  }, [dimensions]);

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <svg ref={svgRef} style={{ width: "100%", height: "100%" }}></svg>

      {/* Vision statement overlay */}
      {!isTreeExpanded && (
        <div
          style={{
            position: "absolute",
            top: "30px",
            right: "-210px",
            transform: "translateX(-50%)",
            width: "450px", // ✅ Fix width here
            backgroundColor: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            padding: "16px 18px",
            boxShadow:
              "0 4px 12px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.1)",
            background: "linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)",
          }}
        >
          <h4
            style={{
              margin: "0 0 8px 0",
              fontSize: dimensions.width < 768 ? "11px" : "38px",
              fontWeight: "600",
              color: "#e11d48",
              fontFamily:
                "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
            }}
          >
            🎯 Vision Statement
          </h4>
          <p
            style={{
              margin: "0",
              fontSize: dimensions.width < 768 ? "10px" : "33px",
              color: "#4b5563",
              lineHeight: "1.5",
              wordWrap: "break-word",
              overflowWrap: "break-word",
              hyphens: "auto",
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
      )}
    </div>
  );
};

export default OsintTree;
