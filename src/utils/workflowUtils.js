// utils/workflowUtils.js

// Function to resolve node dependencies based on edges
export function resolveNodeDependencies(nodes, edges) {
  const dependencies = {};
  nodes.forEach(node => {
    dependencies[node.id] = []; // Initialize dependency array for each node
  });

  edges.forEach(edge => {
    // Assuming edge.target depends on edge.source
    if (dependencies[edge.target]) {
      dependencies[edge.target].push(edge.source);
    }
  });

  return dependencies;
}

// Function to determine execution order using a topological sort
export function determineExecutionOrder(nodes, edges) {
  let order = [];
  let visited = new Set();
  let visiting = new Set(); // To detect cycles

  let dependencies = resolveNodeDependencies(nodes, edges);

  function visit(nodeId) {
    if (visited.has(nodeId)) {
      return;
    }
    if (visiting.has(nodeId)) {
      throw new Error('Workflow contains a cycle, cannot determine execution order');
    }

    visiting.add(nodeId);

    dependencies[nodeId].forEach(visit); // Visit all dependencies first

    visiting.delete(nodeId);
    visited.add(nodeId);

    order.push(nodeId); // Add this node to the execution order
  }

  nodes.forEach(node => visit(node.id));

  return order.reverse(); // Reverse to get the correct order
}
