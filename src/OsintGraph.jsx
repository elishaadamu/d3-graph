import React, { useEffect, useRef } from "react";
import * as d3 from "d3";
import data from "./data.json"; // Your JSON file

const OsintTree = () => {
  const svgRef = useRef();

  useEffect(() => {
    const margin = { top: 20, right: 120, bottom: 20, left: 140 };
    const width = 1280 - margin.left - margin.right;
    const height = 800 - margin.top - margin.bottom;

    let i = 0;

    // Clear any existing content
    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3
      .select(svgRef.current)
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom);

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const root = d3.hierarchy(data);
    root.x0 = height / 2;
    root.y0 = 0;

    // Collapse all children initially
    root.children?.forEach(collapse);

    const treeLayout = d3.tree().size([height, width]);

    update(root);

    function collapse(d) {
      if (d.children) {
        d._children = d.children;
        d._children.forEach(collapse);
        d.children = null;
      }
    }

    function update(source) {
      const duration = 750;

      const treeData = treeLayout(root);
      const nodes = treeData.descendants();
      const links = treeData.links();

      nodes.forEach((d) => (d.y = d.depth * 180));

      // Nodes
      const node = g
        .selectAll("g.node")
        .data(nodes, (d) => d.id || (d.id = ++i));

      const nodeEnter = node
        .enter()
        .append("g")
        .attr("class", "node")
        .attr("transform", () => `translate(${source.y0},${source.x0})`)
        .on("click", (event, d) => {
          toggle(d);
          update(d);
        });

      nodeEnter
        .append("circle")
        .attr("r", 1e-6)
        .style("fill", (d) => (d._children ? "#1e3a8a" : "#fff")); // Dark blue if collapsed children, white if leaf

      // Wrap text in <a> only if it's a URL node
      nodeEnter
        .filter((d) => d.data.type === "url")
        .append("a")
        .attr("xlink:href", (d) => d.data.url)
        .attr("target", "_blank")
        .append("text")
        .attr("dy", ".35em")
        .attr("x", (d) => (d.children || d._children ? -13 : 13))
        .attr("text-anchor", (d) =>
          d.children || d._children ? "end" : "start"
        )
        .text((d) => d.data.name)
        .style("fill-opacity", 1e-6);

      nodeEnter
        .filter((d) => d.data.type !== "url")
        .append("text")
        .attr("dy", ".35em")
        .attr("x", (d) => (d.children || d._children ? -13 : 13))
        .attr("text-anchor", (d) =>
          d.children || d._children ? "end" : "start"
        )
        .text((d) => d.data.name)
        .style("fill-opacity", 1e-6);

      // Transition to new position
      const nodeUpdate = node
        .merge(nodeEnter)
        .transition()
        .duration(duration)
        .attr("transform", (d) => `translate(${d.y},${d.x})`);

      nodeUpdate
        .select("circle")
        .attr("r", 6)
        .style("fill", (d) => (d._children ? "#1e3a8a" : "#fff")); // Dark blue if collapsed children, white if leaf

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
        .attr("d", () => {
          const o = { x: source.x0, y: source.y0 };
          return diagonal({ source: o, target: o });
        })
        .transition()
        .duration(duration)
        .attr("d", diagonal);

      link.transition().duration(duration).attr("d", diagonal);

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
  }, []);

  return <svg ref={svgRef}></svg>;
};

export default OsintTree;
