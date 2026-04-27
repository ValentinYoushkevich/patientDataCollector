export function buildBundle(resources) {
  return {
    resourceType: 'Bundle',
    type: 'transaction',
    timestamp: new Date().toISOString(),
    entry: resources.map((resource) => ({
      resource,
      request: {
        method: 'POST',
        url: resource.resourceType
      }
    }))
  }
}
