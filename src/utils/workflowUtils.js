// utils/workflowUtils.js
// Ensure this function receives properly structured and non-undefined `nodes` and `edges`
export function resolveNodeDependencies(nodes, edges) {
  const dependencies = {};

  // Initialize dependency array for each node
  nodes.forEach(node => {
    dependencies[node.id] = [];
  });

  // Safely iterate over edges if it's defined and an array
  if (Array.isArray(edges)) {
    edges.forEach(edge => {
      if (edge.target && dependencies[edge.target]) {
        dependencies[edge.target].push(edge.source);
      }
    });
  }

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
