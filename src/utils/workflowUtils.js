// utils/workflowUtils.js

/**
 * Resolves node dependencies based on edges.
 * @param {Array} nodes - The array of nodes in the workflow.
 * @param {Array} edges - The array of edges defining dependencies between nodes.
 * @returns {Object} An object mapping each node ID to an array of its dependencies.
 */
export function resolveNodeDependencies(nodes, edges) {
  const dependencies = {};

  // Ensure nodes is an array
  if (!Array.isArray(nodes)) {
    console.error('Invalid nodes: Expected an array, received', typeof nodes);
    return {}; // Return an empty object or handle the error as appropriate
  }

  // Initialize dependency array for each node
  nodes.forEach(node => {
    if (node && node.id != null) { // Check if node and node.id are valid
      dependencies[node.id] = [];
    } else {
      console.error('Invalid node encountered:', node);
    }
  });

  // Ensure edges is an array
  if (!Array.isArray(edges)) {
    console.error('Invalid edges: Expected an array, received', typeof edges);
    // No need to return here; dependencies are already initialized
  } else {
    // Safely iterate over edges to populate dependencies
    edges.forEach(edge => {
      if (edge && edge.source != null && edge.target != null && Array.isArray(dependencies[edge.target])) {
        dependencies[edge.target].push(edge.source);
      } else {
        console.error('Invalid edge encountered:', edge);
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
