/**
 * Pagination Helper
 * Standardize pagination across all list endpoints
 */

const getPaginationParams = (req) => {
  const limit = Math.min(Math.max(parseInt(req.query.limit) || 20, 1), 100)
  const skip = Math.max(parseInt(req.query.skip) || 0, 0)
  return { limit, skip }
}

/**
 * Build paginated response
 */
const buildPaginatedResponse = (data, total, limit, skip) => {
  return {
    data,
    pagination: {
      total,
      limit,
      skip,
      page: Math.floor(skip / limit) + 1,
      pages: Math.ceil(total / limit),
      hasMore: skip + limit < total
    }
  }
}

module.exports = {
  getPaginationParams,
  buildPaginatedResponse
}
